document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),token=sessionStorage.getItem('schoolControlToken');
 if(!token||sessionStorage.getItem('schoolControlRole')!=='drejtor'){location.replace('/login/?role=drejtor');return;}
 let currentId=null;
 const safe=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 async function api(url,method='GET',body){const opts={method,headers:{Authorization:`Token ${token}`}};if(body){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}const response=await fetch(url,opts);const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.gabim||data.detail||'Operacioni nuk u realizua.');return data;}
 function message(t){$('message').textContent=t}
 async function load(){
  try{
   const data=await api('/api/drejtori/kerkesat/');
   $('pending-count').textContent=data.ne_pritje.length;
   $('request-count').textContent=data.kerkesat.filter(k=>k.statusi==='ne_shqyrtim').length;
   $('all-count').textContent=data.kerkesat.length;
   $('pending-list').replaceChildren();
   data.ne_pritje.forEach(t=>{const el=document.createElement('article');el.className='item';el.innerHTML=`<div><strong>${safe(t.emri)}</strong><p>${safe(t.email)} · ID: ${safe(t.identifikuesi)} · ${safe(t.telefoni)} · Lënda: ${safe(t.lenda)}</p></div><button>Mirato llogarinë</button>`;el.querySelector('button').onclick=async()=>{if(!confirm(`Mirato llogarinë për ${t.emri}?`))return;try{await api(`/api/drejtori/mesimdhenesit/${t.id}/mirato/`,'PATCH',{});message('Llogaria u miratua. Tani mund ta caktosh mësimdhënësin te Angazhimet.');await load()}catch(e){message(e.message)}};$('pending-list').append(el)});
   if(!data.ne_pritje.length)$('pending-list').innerHTML='<p class="empty">Nuk ka llogari në pritje.</p>';
   $('requests-list').replaceChildren();
   data.kerkesat.forEach(k=>{const el=document.createElement('article');el.className='item';el.innerHTML=`<div><strong>${safe(k.titulli)}</strong><p>${safe(k.mesimdhenesi)} · ${safe(k.lloji)} · ${safe(k.data)}</p><p>${safe(k.pershkrimi)}${k.nxenesi?' · Nxënësi: '+safe(k.nxenesi):''}${k.data_nga?' · '+safe(k.data_nga)+' — '+safe(k.data_deri):''}</p><em>Statusi: ${safe(k.statusi)}</em>${k.pergjigja?'<p>Përgjigjja: '+safe(k.pergjigja)+'</p>':''}</div>${k.statusi==='ne_shqyrtim'?'<button>Shqyrto kërkesën</button>':''}`;const b=el.querySelector('button');if(b)b.onclick=()=>{currentId=k.id;$('dialog-title').textContent=k.titulli;$('decision-reason').value='';$('decision-dialog').showModal()};$('requests-list').append(el)});
   if(!data.kerkesat.length)$('requests-list').innerHTML='<p class="empty">Nuk ka kërkesa të regjistruara.</p>';
  }catch(e){message(e.message)}
 }
 $('refresh').onclick=load;
 $('close-dialog').onclick=()=>$('decision-dialog').close();
 $('decision-form').onsubmit=async e=>{e.preventDefault();try{await api('/api/drejtori/kerkesat/','PATCH',{id:currentId,statusi:$('decision-status').value,pergjigja:$('decision-reason').value.trim()});$('decision-dialog').close();message('Vendimi u ruajt.');await load()}catch(err){message(err.message)}};
 await load();
});
