const $=id=>document.getElementById(id);const id=location.pathname.split('/').pop(),token=new URLSearchParams(location.search).get('token')||'';
const esc=n=>String(n??'—');
const quality=r=>!Number.isFinite(r)||r>=0?'לא ידוע':r>=-65?'טובה':r>=-72?'בינונית':'חלשה';
const state=r=>quality(r)==='טובה'?'good':quality(r)==='בינונית'?'mid':'bad';
const recommends=points=>{
 const before=points.filter(p=>p.stage==='before'&&Number.isFinite(p.rssi)&&p.rssi<0);
 if(before.length<3)return 'יש למדוד ליד הנתב, בנקודת ביניים ובחדר המרוחק לפני בחירת מיקום.';
 const weak=before.some(p=>p.rssi<-72);
 if(!weak)return 'לא אותרה בעיית קליטה חמורה בנקודות שנמדדו. מומלץ לאמת יציבות ומהירות לפני רכישת ציוד.';
 const mid=before.filter(p=>p.rssi>=-63&&p.rssi<=-50).sort((a,b)=>a.rssi-b.rssi)[0];
 if(!mid)return 'הנקודה הרחוקה אינה מתאימה להתקנת מגדיל אלחוטי. מדוד נקודת ביניים נוספת או בחר פתרון קווי.';
 return 'נקודת ביניים מומלצת לניסיון: '+mid.room+'. לפני התקנה יש לאמת מהירות ויציבות. אין להתקין מגדיל באזור עם אות חלש.';
};
let last='';
async function update(){
 try{
 const response=await fetch('/api/public/'+encodeURIComponent(id)+'?token='+encodeURIComponent(token),{cache:'no-store'});
 if(!response.ok)throw new Error('קישור לא תקין או שהמדידה אינה זמינה');
 const obj=await response.json(),s=obj.session; const serialized=JSON.stringify(s);
 if(serialized===last)return;last=serialized;
 $('heading').textContent='מצב הגלישה • '+esc(s.customerLabel);
 $('updated').textContent='עדכון אחרון: '+new Date(s.updatedAt).toLocaleTimeString('he-IL');
 $('sessionStatus').textContent=s.status==='completed'?'הביקור הושלם':'בדיקה מתבצעת';
 const points=s.points||[],lastPoint=points[points.length-1];
 $('count').textContent=points.length+' נקודות';
 const top=Math.max(...points.map(p=>Number(p.download)||0),0);
 $('download').textContent=top?top.toFixed(1):'—';
 for(const field of ['upload','ping','jitter']) $(''+field).textContent=lastPoint?.[field]!=null?Number(lastPoint[field]).toFixed(1):'—';
 const q=quality(lastPoint?.rssi);$('quality').textContent='קליטה '+q;$('quality').className='status '+(q==='בינונית'?'warning':q==='חלשה'?'bad':'');
 const holder=$('points');holder.replaceChildren();
 if(!points.length)holder.textContent='הטכנאי עדיין לא שמר מדידות.';
 points.slice().reverse().forEach(p=>{
 const row=document.createElement('div');row.className='point';
 const dot=document.createElement('span');dot.className='dot '+state(p.rssi);row.append(dot);
 const text=document.createElement('div');const name=document.createElement('strong');name.textContent=p.room+' • '+(p.stage==='after'?'אחרי התקנה':'לפני התקנה');text.append(name);
 const desc=document.createElement('div');desc.className='tiny';desc.textContent='הורדה '+(p.download??'—')+' Mbps • העלאה '+(p.upload??'—')+' Mbps • קליטה '+quality(p.rssi);text.append(desc);row.append(text);holder.append(row);
 });
 $('recommendation').textContent=recommends(points);
 }catch(e){$('updated').textContent=e.message;$('sessionStatus').textContent='לא מחובר';$('sessionStatus').className='status bad'}
}
update();setInterval(update,3500);