const $=id=>document.getElementById(id);let key=sessionStorage.getItem('prolink_token')||'';
const api=async(path,options={})=>{const r=await fetch(path,{...options,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json',...options.headers}});const j=await r.json();if(!r.ok)throw new Error(j.error||'שגיאת שרת');return j};
async function connect(){
 key=$('techKey').value.trim()||key;if(!key)return;
 try{await api('/api/sessions');sessionStorage.setItem('prolink_token',key);$('login').classList.add('hidden');$('workspace').classList.remove('hidden');$('loginInfo').textContent='';await load()}
 catch(e){$('loginInfo').textContent='לא ניתן להתחבר: '+e.message}
}
async function load(){try{const data=await api('/api/sessions');const root=$('sessions');root.replaceChildren();if(!data.sessions.length){root.textContent='טרם נוצרו ביקורים';return}
for(const s of data.sessions.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))){
 const row=document.createElement('div');row.className='point';const text=document.createElement('div');
 const heading=document.createElement('strong');heading.textContent=s.customerLabel+' • '+s.points+' נקודות';text.append(heading);
 const info=document.createElement('div');info.className='tiny';info.textContent=new Date(s.createdAt).toLocaleString('he-IL')+' • '+(s.status==='completed'?'הושלם':'פעיל');text.append(info);row.append(text);
 const link=document.createElement('span');link.className='badge';link.textContent='מספר ביקור: '+s.id.slice(0,8);row.append(link);root.append(row);
 }}catch(e){$('sessions').textContent=e.message}}
$('connect').addEventListener('click',connect);
$('create').addEventListener('click',async()=>{try{
 const j=await api('/api/sessions',{method:'POST',body:JSON.stringify({customerLabel:$('customer').value,technician:$('technician').value})});
 const container=$('createInfo');container.replaceChildren();
 const a=document.createElement('a');a.href=j.viewerUrl;a.textContent='פתח קישור לקוח';a.target='_blank';a.rel='noreferrer';container.append(a);
 const btn=document.createElement('button');btn.textContent='העתק קישור ללקוח';btn.className='secondary';btn.style.margin='12px';
 btn.onclick=async()=>{await navigator.clipboard.writeText(j.viewerUrl);btn.textContent='הקישור הועתק'};container.append(btn);
 const code=document.createElement('div');code.className='tiny break';code.textContent=j.viewerUrl;container.append(code);
 await load();
 }catch(e){$('createInfo').textContent=e.message}});
$('refresh').addEventListener('click',load);$('logout').addEventListener('click',()=>{sessionStorage.removeItem('prolink_token');location.reload()});
if(key)connect();