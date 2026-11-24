document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),message=$('auth-message'),form=$('teacher-login-form')||$('teacher-register-form');
 const page=document.body.dataset.page;
 async function read(res){const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.gabim||data.detail||'Operacioni nuk u realizua.');return data;}
 if(page==='register'){
  try{const data=await read(await fetch('/api/mesimdhenesi/lendet/'));const sel=$('lenda');sel.replaceChildren();const placeholder=new Option('Zgjidh lëndën...','');sel.append(placeholder);data.forEach(x=>sel.add(new Option(x.emri,x.id)));}catch(e){message.textContent=e.message;}
 }
 form.addEventListener('submit',async ev=>{
  ev.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;message.classList.remove('success');message.textContent='Duke kontrolluar të dhënat...';
  try{
   if(page==='login'){
    const data=await read(await fetch('/api/auth/login/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password:$('password').value,role:'mesimdhenes'})}));
    sessionStorage.setItem('schoolControlToken',data.token);sessionStorage.setItem('schoolControlRole',data.perdoruesi.roli);sessionStorage.setItem('schoolControlEmail',data.perdoruesi.email);
    message.classList.add('success');message.textContent='Hyrja u realizua me sukses!';location.assign('/mesimdhenesi/panel/');
   }else{
    if($('fjalekalimi').value!==$('perserit_fjalekalimin').value)throw new Error('Fjalëkalimet nuk përputhen.');
    const data=await read(await fetch('/api/mesimdhenesi/regjistrohu/',{method:'POST',body:new FormData(form)}));
    form.reset();message.classList.add('success');message.textContent=data.mesazhi+' Hyrja do të lejohet pas miratimit.';
   }
  }catch(e){message.textContent=e.message;}finally{button.disabled=false;}
 });
});
