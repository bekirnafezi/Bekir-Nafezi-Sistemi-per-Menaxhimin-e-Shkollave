(() => {
  'use strict';
  const page = document.body.dataset.studentPage || 'login';
  const key = 'schoolControlToken';
  const token = () => sessionStorage.getItem(key);
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (v) => String(v ?? '—').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (v) => (v === null || v === undefined ? '—' : String(v));
  const isoDate = (s) => s ? s.split('-').reverse().join('.') : '—';
  const api = async (path, options = {}) => {
    const headers = {Accept:'application/json',...(options.headers || {})};
    if (token()) headers.Authorization = `Token ${token()}`;
    const res = await fetch(path,{...options,headers,cache:'no-store'});
    let body; try { body = await res.json() } catch { body = {} }
    if (!res.ok) {
      if ([401,403].includes(res.status) && page !== 'login') {
        sessionStorage.removeItem(key);
        location.replace('/login/?role=nxenes');
      }
      throw new Error(body.gabim || 'Operacioni nuk u realizua.');
    }
    return body;
  };
  function dateHeader(){ const el=$('student-date');if(el) el.textContent=new Intl.DateTimeFormat('sq-AL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()); }
  function showError(msg){if($('student-alert')) $('student-alert').textContent=msg;}
  function surface(title,body,actions=''){return `<section class="surface fill"><div class="surface-title"><h2>${title}</h2>${actions}</div>${body}</section>`;}
  function banner(title,sub='PANELI I NXËNËSIT'){return `<div class="student-dashboard-banner"><div><span class="small">${sub}</span><h1>${escapeHtml(title)}</h1></div><span style="font-size:34px;color:#f4c15e">✦</span></div>`;}
  function stat(label,value){return `<div class="summary-card"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;}
  function empty(what){return `<div class="student-content-center"><strong>${escapeHtml(what)}</strong><p>Nuk ka të dhëna të regjistruara.</p></div>`;}
  function modal(title,html){$('student-modal-title').textContent=title;$('student-modal-content').innerHTML=html;$('student-modal').showModal();}
  function table(headers,rows){return `<div style="overflow:auto"><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${headers.length}">Nuk ka të dhëna.</td></tr>`}</tbody></table></div>`;}
  if(page === 'login'){
    const form=$('student-login-form');
    form.addEventListener('submit',async (event)=>{
      event.preventDefault();const button=form.querySelector('button[type="submit"]');
      const data=Object.fromEntries(new FormData(form));
      button.disabled=true;$('student-login-error').textContent='';
      try {
        const res=await api('/api/nxenesi/hyr/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        sessionStorage.setItem(key,res.token);location.assign(res.redirect);
      } catch(err){$('student-login-error').textContent=err.message;}
      finally {button.disabled=false;}
    });
    return;
  }
  if (!token()){location.replace('/login/?role=nxenes');return;}
  dateHeader();
  $('student-logout').addEventListener('click',()=>{sessionStorage.removeItem(key);location.assign('/');});
  $('student-close').addEventListener('click',()=>$('student-modal').close());
  $('student-modal').addEventListener('click',e=>{if(e.target===$('student-modal'))$('student-modal').close()});
  const root=$('student-page-content');
  let badgeStudent = null;
  let badgeBusy = false;
  const seenFallback = {};
  function badgeStorage(section){return `schoolControlSeenV1:${badgeStudent}:${section}`;}
  function getSeen(section){
    const key=badgeStorage(section);
    try { const raw=localStorage.getItem(key); if(raw!==null){const list=JSON.parse(raw);if(Array.isArray(list))return new Set(list);} } catch {}
    return new Set(seenFallback[key]||[]);
  }
  function saveSeen(section,keys){
    const key=badgeStorage(section);
    const all=[...new Set([...getSeen(section),...keys])];
    seenFallback[key]=all;
    try {localStorage.setItem(key,JSON.stringify(all));} catch {}
  }
  const clearedFallback = {};
  function clearStorage(section){return `schoolControlClearedV1:${badgeStudent}:${section}`;}
  function getCleared(section){
    const key=clearStorage(section);
    try {const raw=localStorage.getItem(key);if(raw!==null){const list=JSON.parse(raw);if(Array.isArray(list))return new Set(list);}} catch {}
    return new Set(clearedFallback[key]||[]);
  }
  function saveCleared(section,keys){
    if(badgeStudent===null)return;
    const key=clearStorage(section);
    const all=[...new Set([...getCleared(section),...keys])];
    clearedFallback[key]=all;
    try {localStorage.setItem(key,JSON.stringify(all));} catch {}
  }
  function requestFinished(x){return x.statusi==='miratuar'||x.statusi==='refuzuar';}
  function activityFingerprint(x){return JSON.stringify([String(x.id),x.statusi,String(x.pergjigjja||'')]);}
  function visibleActivities(rows){const hidden=getCleared('aktivitetet');return rows.filter(x=>!requestFinished(x)||!hidden.has(activityFingerprint(x)));}
  function visibleNotices(rows,prefix){const hidden=getCleared('njoftimet');return rows.filter(x=>!hidden.has(`${prefix}:${x.id}`));}
  function clearButton(id,disabled){return `<button type="button" class="btn student-clear-button" id="${id}" ${disabled?'disabled':''}>Fshi</button>`;}
  function askClear(text,action){
    modal('Konfirmo pastrimin',`<p>${escapeHtml(text)}</p><div class="student-clear-actions"><button class="btn" type="button" id="student-clear-cancel">Anulo</button><button class="btn gold" type="button" id="student-clear-confirm">Po, fshi</button></div>`);
    $('student-clear-cancel').onclick=()=>$('student-modal').close();
    $('student-clear-confirm').onclick=async()=>{$('student-modal').close();try{await action();}catch(err){showError(err.message);}};
  }
  function noticeKeys(data){
    return [...visibleNotices(data.njoftimet||[],'d').map(x=>`d:${x.id}`),...visibleNotices(data.njoftimet_mesimdhenesit||[],'m').map(x=>`m:${x.id}`)];
  }
  function reviewKeys(data){
    return visibleActivities(data.kerkesat||[]).filter(x=>x.statusi==='miratuar'||x.statusi==='refuzuar'||String(x.pergjigjja||'').trim()).map(x=>`k:${x.id}:${x.statusi}`);
  }
  function showBadge(section,count){
    const link=document.querySelector(`.portal-nav a[href="/nxenesi/${section}/"]`);
    if(!link)return;
    let badge=link.querySelector('.student-unread-badge');
    if(!badge){badge=document.createElement('span');badge.className='student-unread-badge';badge.hidden=true;badge.setAttribute('aria-hidden','true');link.appendChild(badge);}
    badge.textContent=count>99?'99+':String(count);
    badge.hidden=count===0;
    const label=section==='njoftimet'?'Njoftimet':'Aktivitetet';
    link.setAttribute('aria-label',count?`${label}: ${count} të reja`:label);
  }
  function applyBadge(section,keys,markSeen=false){
    if(badgeStudent===null)return;
    if(markSeen)saveSeen(section,keys);
    const seen=getSeen(section);
    showBadge(section,new Set(keys.filter(x=>!seen.has(x))).size);
  }
  async function refreshBadges(){
    if(badgeBusy||badgeStudent===null||document.hidden||!token())return;
    badgeBusy=true;
    try{
      await Promise.allSettled([
        api('/api/nxenesi/njoftimet/').then(data=>applyBadge('njoftimet',noticeKeys(data))),
        api('/api/komunikimi-nxenesit/').then(data=>applyBadge('aktivitetet',reviewKeys(data)))
      ]);
    }finally{badgeBusy=false;}
  }
  function startBadges(){
    refreshBadges();
    setInterval(refreshBadges,15000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBadges();});
    window.addEventListener('focus',refreshBadges);
    window.addEventListener('storage',e=>{if(e.key&&(e.key.startsWith(`schoolControlSeenV1:${badgeStudent}:`)||e.key.startsWith(`schoolControlClearedV1:${badgeStudent}:`)))refreshBadges();});
  }
  async function init(){
    const me=await api('/api/nxenesi/profili/');
    badgeStudent=me.id;
    $('student-profile-name').textContent=[me.emri,me.mbiemri].filter(Boolean).join(' ');
    $('student-profile-class').textContent=me.klasa.emri;
    $('student-profile-id').textContent=me.id_nxenesi;
    $('student-profile-email').textContent=me.email;
    if(me.foto){const img=$('student-avatar');img.src=me.foto;img.hidden=false;$('student-avatar-fallback').hidden=true;}
    if(page==='klasa') renderClass(me);
    else if(page==='notat') await renderGrades(me);
    else if(page==='mungesat') await renderAbsences(me);
    else if(page==='njoftimet') await renderNotices(me);
    else await renderActivities(me);
    startBadges();
  }
  function renderClass(me){
    const guardian=me.kujdestari;
    const card=(label,value)=>`<div style="min-width:0;min-height:76px;box-sizing:border-box;background:#f2f7fc;border:1px solid #d7e5f3;border-radius:14px;padding:10px 18px;display:flex;flex-direction:column;justify-content:center;gap:6px;"><small style="font-size:13px;line-height:1.25;color:#7090b7;">${escapeHtml(label)}</small><b style="font-size:18px;line-height:1.3;color:#0d3d78;overflow-wrap:anywhere;">${escapeHtml(value)}</b></div>`;
    root.innerHTML=surface('Të dhënat e klasës',`<div style="width:100%;min-width:0;box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px 20px;align-content:center;flex:1;">${card('Klasa ime',me.klasa.emri)}${card('ID e nxënësit',me.id_nxenesi)}${card('Kujdestari i klasës',guardian?.emri||'Nuk është caktuar')}${card('Emaili i kujdestarit',guardian?.email||'—')}</div>`);
  }
  async function renderGrades(me){
    const data=await api('/api/nxenesi/notat/');
    const subjects=data.lendet||[]; const grades=data.notat||[];
    root.innerHTML=`<div class="student-summary">${stat('Lëndë me nota',subjects.length)}${stat('Nota gjithsej',data.gjithsej)}${stat('Mesatarja e përgjithshme',fmt(data.mesatarja))}</div>`+
    surface('Notat sipas lëndëve',subjects.length?`<div class="student-records">${subjects.map(x=>`<div class="student-record"><div><h3>${escapeHtml(x.lenda)}</h3><small>${x.notat} nota</small></div><div class="tag gold">Mesatarja ${escapeHtml(fmt(x.mesatarja))}</div></div>`).join('')}</div>`:empty('Nuk ka ende nota'),`<button id="student-all-grades" class="btn gold">Shiko të gjitha notat →</button>`);
    $('student-all-grades').addEventListener('click',()=>modal('Të gjitha notat',table(['Lënda','Nota','Data','Mësimdhënësi'],grades.map(x=>`<tr><td>${escapeHtml(x.lenda)}</td><td><b>${x.nota}</b></td><td>${escapeHtml(isoDate(x.data))}</td><td>${escapeHtml(x.mesimdhenesi)}</td></tr>`))));
  }
  async function renderAbsences(me){
    const data=await api('/api/nxenesi/mungesat/');const rows=data.mungesat||[]; const s=data.statuset||{};
    const labels={e_arsyeshme:'E arsyeshme',e_paarsyeshme:'E paarsyeshme',ne_shqyrtim:'Në shqyrtim'};
    root.innerHTML=`<div class="student-summary student-stats4">${stat('Mungesa gjithsej',data.gjithsej)}${stat('Të arsyeshme',s.e_arsyeshme||0)}${stat('Të paarsyeshme',s.e_paarsyeshme||0)}${stat('Në shqyrtim',s.ne_shqyrtim||0)}</div>`+
    surface('Pasqyra e mungesave',rows.length?`<div class="student-records">${rows.slice(0,4).map(x=>`<div class="student-record"><div><h3>${escapeHtml(x.lenda)}</h3><small>${escapeHtml(isoDate(x.data))} · Ora ${escapeHtml(fmt(x.ora))} · ${escapeHtml(x.mesimdhenesi)}</small></div><span class="tag">${escapeHtml(labels[x.statusi]||x.statusi)}</span></div>`).join('')}</div>`:empty('Nuk ke mungesa'),`<button class="btn gold" id="student-all-absences">Shiko të gjitha mungesat →</button>`);
    $('student-all-absences').addEventListener('click',()=>modal('Të gjitha mungesat',table(['Data','Ora','Lënda','Mësimdhënësi','Statusi','Arsyetimi'],rows.map(x=>`<tr><td>${escapeHtml(isoDate(x.data))}</td><td>${escapeHtml(fmt(x.ora))}</td><td>${escapeHtml(x.lenda)}</td><td>${escapeHtml(x.mesimdhenesi)}</td><td>${escapeHtml(labels[x.statusi]||x.statusi)}</td><td>${escapeHtml(x.arsyetimi||'—')}</td></tr>`))));
  }
  async function renderNotices(me){
    const data=await api('/api/nxenesi/njoftimet/');
    const director=visibleNotices(data.njoftimet||[],'d');
    const teacher=visibleNotices(data.njoftimet_mesimdhenesit||[],'m');
    function noticeCard(x){
      return `<article class="student-notice"><h3>${escapeHtml(x.titulli)}</h3><small>${escapeHtml(isoDate(x.data))} · ${escapeHtml(x.derguesi)}</small><p>${escapeHtml(x.permbajtja)}</p></article>`;
    }
    function preview(notices,emptyText){
      return `<div class="notice-preview">${notices.length?noticeCard(notices[0]):empty(emptyText)}</div>`;
    }
    function history(notices,title,emptyText){
      modal(title,notices.length?`<div class="student-notice-history">${notices.map(noticeCard).join('')}</div>`:`<p>${escapeHtml(emptyText)}</p>`);
    }
    root.innerHTML=`<div class="student-notices-layout">${surface('Njoftimet nga Drejtori',preview(director,'Nuk ka njoftime nga Drejtori'),`<div class="student-clear-actions">${clearButton('student-clear-director',!director.length)}<button type="button" class="btn gold" id="student-all-director-notices">Shiko të gjitha vendimet →</button></div>`)}${surface('Njoftimet nga Mësimdhënësi',preview(teacher,'Nuk ka njoftime nga Mësimdhënësi'),`<div class="student-clear-actions">${clearButton('student-clear-teacher',!teacher.length)}<button type="button" class="btn gold" id="student-all-teacher-notices">Shiko të gjitha vendimet →</button></div>`)}</div>`;
    $('student-all-director-notices').addEventListener('click',()=>history(director,'Të gjitha vendimet e Drejtorit','Nuk ka njoftime nga Drejtori.'));
    $('student-all-teacher-notices').addEventListener('click',()=>history(teacher,'Të gjitha vendimet e Mësimdhënësit','Nuk ka njoftime nga Mësimdhënësi.'));
    $('student-clear-director').onclick=()=>askClear('Të fshihen të gjitha njoftimet e Drejtorit nga pamja jote?',async()=>{saveCleared('njoftimet',director.map(x=>`d:${x.id}`));await renderNotices(me);});
    $('student-clear-teacher').onclick=()=>askClear('Të fshihen të gjitha njoftimet e Mësimdhënësit nga pamja jote?',async()=>{saveCleared('njoftimet',teacher.map(x=>`m:${x.id}`));await renderNotices(me);});
    applyBadge('njoftimet',noticeKeys(data),true);
  }
  async function renderActivities(me){
    const data=await api('/api/komunikimi-nxenesit/');
    const rows=visibleActivities(data.kerkesat||[]);
    const labels={ne_shqyrtim:'Në shqyrtim',miratuar:'Miratuar',refuzuar:'Refuzuar'};
    const list=()=>table(['Data','Lloji','Titulli','Marrësi','Statusi','Përgjigjja'],rows.map(r=>`<tr>${[r.data,r.lloji==='leje'?'Leje':'Ankesë',r.titulli,r.marresi,labels[r.statusi],r.pergjigjja||'—'].map(v=>`<td>${escapeHtml(v)}</td>`).join('')}</tr>`));
    root.innerHTML=surface('Ankesat dhe kërkesat për leje',`<div class="student-records"><div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn gold" id="new-complaint">+ Dërgo ankesë</button><button class="btn gold" id="new-leave">+ Kërko leje</button></div>${rows.slice(0,2).map(r=>`<div class="student-record"><div><h3>${escapeHtml(r.titulli)}</h3><small>${escapeHtml(r.marresi)}</small></div><span class="tag">${escapeHtml(labels[r.statusi])}</span></div>`).join('')||'<p>Nuk ka kërkesa.</p>'}</div>`,`<div class="student-clear-actions">${clearButton('student-clear-activities',!rows.some(requestFinished))}<button class="btn gold" id="all-requests">Shiko të gjitha kërkesat →</button></div>`);
    $('all-requests').onclick=()=>modal('Kërkesat e mia',list());
    function open(kind){
      const guardian=data.marresit[0];
      if(!guardian){modal('Kujdestari i klasës','<p>Klasa nuk ka kujdestar aktiv. Kontakto shkollën.</p>');return;}
      modal(kind==='leje'?'Kërko leje':'Dërgo ankesë',`<form id="student-request-form" style="display:grid;gap:12px"><label>Kujdestari i klasës<input type="text" id="request-guardian" readonly style="width:100%"></label><label>Titulli<input name="titulli" maxlength="150" required style="width:100%"></label><label>${kind==='leje'?'Arsyeja dhe datat e lejes':'Përshkrimi'}<textarea name="pershkrimi" required maxlength="3000" rows="5" style="width:100%"></textarea></label><p id="request-error" role="alert"></p><button class="btn gold" type="submit">Dërgo</button></form>`);
      $('request-guardian').value=guardian.emri;
      $('student-request-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await api('/api/komunikimi-nxenesit/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(new FormData(e.target)),lloji:kind,marresi:guardian.id})});$('student-modal').close();await renderActivities(me);}catch(err){$('request-error').textContent=err.message;b.disabled=false;}};
    }
    $('new-complaint').onclick=()=>open('ankese');$('new-leave').onclick=()=>open('leje');
    $('student-clear-activities').onclick=()=>askClear('Të fshihen kërkesat e miratuara dhe të refuzuara nga pamja jote? Kërkesat në shqyrtim do të mbeten.',async()=>{saveCleared('aktivitetet',rows.filter(requestFinished).map(activityFingerprint));await renderActivities(me);});
    applyBadge('aktivitetet',reviewKeys(data),true);
  }
  root.innerHTML='<div class="student-content-center" id="student-initial-loading" role="status" aria-live="polite"><strong>Duke ngarkuar të dhënat...</strong></div>';
  init().catch(err=>{
    if ($('student-initial-loading')) root.replaceChildren();
    showError(err.message || 'Paneli nuk u ngarkua. Provo përsëri.');
  });
})();
