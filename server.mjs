import http from 'node:http';
import { createHash, randomBytes, timingSafeEqual, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from 'redis';

const PORT=Number(process.env.PORT||3000);
const MASTER=process.env.TECH_KEY||'';
if(MASTER.length<24)throw new Error('Set strong TECH_KEY (24+ chars)');
const REDIS_URL=process.env.REDIS_URL||'';
const memory=new Map();
let redis=null;
let redisStatus='connecting';
if(REDIS_URL){
  redis=createClient({url:REDIS_URL,socket:{reconnectStrategy:retries=>Math.min(1000*retries,8000)}});
  redis.on('error', e=>{redisStatus='offline';if(process.env.NODE_ENV!=='test')console.error('Redis connection unavailable:',e.message);});
  redis.on('ready',()=>{redisStatus='ready';console.log('Redis ready')});
  redis.connect().catch(e=>{redisStatus='offline';console.error(e.message)});
}else redisStatus='memory';
const eq=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y)};
const hash=s=>createHash('sha256').update(s).digest('hex');
const rand=()=>randomBytes(22).toString('base64url');
const key=id=>'prolink:session:'+id;
const INDEX='prolink:ids';
async function load(id) {
 if(redis?.isReady){const raw=await redis.get(key(id));return raw?JSON.parse(raw):null}
 return memory.get(id)||null;
}
async function save(s){
 s.updatedAt=new Date().toISOString();
 if(redis?.isReady){
   await redis.set(key(s.id),JSON.stringify(s),{EX:60*60*24*30});
   await redis.sAdd(INDEX,s.id);
   await redis.expire(INDEX,60*60*24*31);
 }else memory.set(s.id,s);
}
async function ids(){if(redis?.isReady)return await redis.sMembers(INDEX);return [...memory.keys()]}
function reply(res,code,obj,extra={}){res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra});res.end(JSON.stringify(obj))}
function err(res,code,message){reply(res,code,{ok:false,error:message})}
async function body(req){
 let bytes=0,chunks=[];
 for await(const ch of req){bytes+=ch.length;if(bytes>65536)throw new Error('Body too large');chunks.push(ch)}
 return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
}
function auth(req){
 const hdr=req.headers.authorization||'';
 const token=hdr.startsWith('Bearer ')?hdr.slice(7):'';
 return eq(token,MASTER);
}
function limited(s,max=120){return String(s??'').slice(0,max).trim()}
function num(v,min,max){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(n,max)):null}
const rate=new Map();
function throttle(req,limit=30,period=60000){
 const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').toString().split(',')[0];
 const k=ip+':'+Math.floor(Date.now()/period),n=(rate.get(k)||0)+1;rate.set(k,n);
 if(rate.size>2000)rate.clear();
 return n<=limit;
}
const publicSession=s=>({id:s.id,technician:s.technician,customerLabel:s.customerLabel,
 status:s.status,createdAt:s.createdAt,updatedAt:s.updatedAt,points:s.points.map(({id,room,stage,transport,download,upload,ping,jitter,rssi,quality,timestamp,kind,distance_m})=>({id,room,stage,transport,download,upload,ping,jitter,rssi,quality,timestamp,kind,distance_m}))});
const api=async(req,res,path,query)=>{
 const quota=path.startsWith('/api/public/')?240:req.method==='GET'?120:50;
 if(!throttle(req,quota))return err(res,429,'Too many requests');
 if(path==='/api/health'&&req.method==='GET')return reply(res,200,{ok:true,service:'Bezeq WiFi 360',store:redis?.isReady?'redis':redisStatus,now:Date.now()});
 if(path==='/api/version'&&req.method==='GET')return reply(res,200,{ok:true,versionCode:6,versionName:'1.6.0-bezeq-wifi360',downloadUrl:'https://prolink-wifi-pro-live.onrender.com/download/prolink-wifi-pro.apk',releaseNotes:'עיצוב מציאות רבודה מקצועי, הצגת קליטה חיה, סיכום ציוד ומיקומים, ועדכונים מהענן'});
 if(path==='/api/sessions/recover'&&req.method==='POST'){
   if(!auth(req))return err(res,401,'Unauthorized technician');
   const b=await body(req),id=limited(b.id,50),token=limited(b.viewerToken,200);
   if(!/^[0-9a-f-]{36}$/.test(id)||token.length<20)return err(res,400,'Invalid recovery request');
   const existing=await load(id);
   if(existing){
     if(!eq(hash(token),existing.viewerHash))return err(res,403,'Viewer token mismatch');
     return reply(res,200,{ok:true,recovered:false,session:publicSession(existing)});
   }
   const s={id,viewerHash:hash(token),technician:limited(b.technician,80),customerLabel:limited(b.customerLabel||'לקוח',60),
     status:'active',createdAt:new Date().toISOString(),updatedAt:'',points:[]};
   await save(s);return reply(res,201,{ok:true,recovered:true,session:publicSession(s)});
 }
 if(path==='/api/sessions'&&req.method==='POST'){
   if(!auth(req))return err(res,401,'Unauthorized technician');
   const b=await body(req),id=randomUUID(),viewToken=rand();
   const s={id,viewerHash:hash(viewToken),technician:limited(b.technician,80),customerLabel:limited(b.customerLabel||'לקוח',60),
     status:'active',createdAt:new Date().toISOString(),updatedAt:'',points:[]};
   await save(s);
   return reply(res,201,{ok:true,session:publicSession(s),viewerUrl:'https://prolink-wifi-pro-live.onrender.com/view/'+id+'?token='+viewToken,viewerToken:viewToken});
 }
 if(path==='/api/sessions'&&req.method==='GET'){
   if(!auth(req))return err(res,401,'Unauthorized technician');
   const all=await Promise.all((await ids()).map(load));return reply(res,200,{ok:true,sessions:all.filter(Boolean).map(s=>({id:s.id,customerLabel:s.customerLabel,technician:s.technician,status:s.status,points:s.points.length,createdAt:s.createdAt,updatedAt:s.updatedAt}))});
 }
 const publicMatch=path.match(/^\/api\/public\/([0-9a-f-]{36})$/);
 if(publicMatch&&req.method==='GET'){
   const s=await load(publicMatch[1]);if(!s||!eq(hash(query.get('token')||''),s.viewerHash))return err(res,404,'Session not found');
   return reply(res,200,{ok:true,session:publicSession(s)});
 }
 const sess=path.match(/^\/api\/sessions\/([0-9a-f-]{36})(?:\/(measurements|complete))?$/);
 if(sess){
   if(!auth(req))return err(res,401,'Unauthorized technician');
   const s=await load(sess[1]);if(!s)return err(res,404,'Session not found');
   if(!sess[2]&&req.method==='GET')return reply(res,200,{ok:true,session:publicSession(s)});
   if(sess[2]==='complete'&&req.method==='POST'){s.status='completed';await save(s);return reply(res,200,{ok:true,session:publicSession(s)})}
   if(sess[2]==='measurements'&&req.method==='POST'){
     if(s.status==='completed')return err(res,409,'Session completed');
     const b=await body(req);
     const p={id:limited(b.id,80)||randomUUID(),room:limited(b.room,80),stage:b.stage==='after'?'after':'before',
       kind:b.kind==='signal'?'signal':'speed',distance_m:num(b.distance_m,0,500),
       transport:b.transport==='Ethernet'?'Ethernet':'Wi-Fi',
       download:num(b.download,0,10000),upload:num(b.upload,0,10000),ping:num(b.ping,0,10000),
       jitter:num(b.jitter,0,10000),rssi:num(b.rssi,-110,0),
       quality:limited(b.quality,32),timestamp:limited(b.timestamp,40)||new Date().toISOString()};
     if(!p.room||(p.kind==='speed'&&(p.download===null||p.upload===null)))return err(res,400,'Room, download and upload are required for speed measurements');
     if(s.points.length>=200)return err(res,409,'Maximum 200 points');
     if(!s.points.some(x=>x.id===p.id))s.points.push(p);
     await save(s);return reply(res,201,{ok:true,count:s.points.length});
   }
 }
 return err(res,404,'Not found');
};
const html=async(name)=>await readFile(new URL('./public/'+name,import.meta.url),'utf8');
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url||'/', 'http://localhost');
 const path=url.pathname;
 try{
  if(path.startsWith('/api/'))return await api(req,res,path,url.searchParams);
  if(path==='/download/prolink-wifi-pro.apk'&&req.method==='GET'){
    const apk=await readFile(new URL('./public/Bezeq_WiFi_360_v1.6.apk',import.meta.url));
    res.writeHead(200,{'content-type':'application/vnd.android.package-archive',
      'content-length':apk.length,'content-disposition':'attachment; filename="Bezeq_WiFi_360_v1.6.apk"',
      'cache-control':'no-store','x-content-type-options':'nosniff'});
    return res.end(apk);
  }
  if((path==='/'||path==='/tech')&&req.method==='GET'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});return res.end(await html('tech.html'));
  }
  if(path.startsWith('/view/')&&req.method==='GET'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});return res.end(await html('viewer.html'));
  }
  if(path.startsWith('/assets/')&&req.method==='GET'){
    const files={'/assets/app.css':'app.css','/assets/viewer.js':'viewer.js','/assets/tech.js':'tech.js'};
    if(!files[path])return err(res,404,'Not found');
    res.writeHead(200,{'content-type':path.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8','cache-control':'public,max-age=300','x-content-type-options':'nosniff'});
    return res.end(await html(files[path]));
  }
  err(res,404,'Not found');
 }catch(e){console.error('Request error',e.message);err(res,e.message==='Body too large'?413:500,'Request failed')}
});
server.listen(PORT,'0.0.0.0',()=>console.log('ProLink server on',PORT));
