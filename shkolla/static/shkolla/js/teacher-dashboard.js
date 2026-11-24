document.addEventListener('DOMContentLoaded', async () => {
    const $ = id => document.getElementById(id);
    const token = sessionStorage.getItem('schoolControlToken');
    if (!token || sessionStorage.getItem('schoolControlRole') !== 'mesimdhenes') {
        location.replace('/login/?role=mesimdhenes');
        return;
    }
    const dialog = $('teacher-dialog');
    const selectedClass = $('class-picker');
    const assignment = $('quick-assignment');
    let state = null;
    let photoUrl = null;
    let allDecisions = false;
    const now = new Date();
    $('today').textContent = new Intl.DateTimeFormat('sq-AL', {weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
    $('logout').onclick = () => {
        ['schoolControlToken','schoolControlRole','schoolControlEmail'].forEach(k => sessionStorage.removeItem(k));
        location.assign('/');
    };
    $('dialog-close').onclick = () => dialog.close();
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    async function api(url, method='GET', payload) {
        const options = {method,headers:{Authorization:`Token ${token}`}};
        if (payload !== undefined) {
            options.headers['Content-Type']='application/json';
            options.body=JSON.stringify(payload);
        }
        const response=await fetch(url,options);
        if(response.status===401){sessionStorage.removeItem('schoolControlToken');location.replace('/login/?role=mesimdhenes');throw new Error('Sesioni ka përfunduar.');}if(response.status===204)return null;
        const result=await response.json().catch(()=>({}));
        if(!response.ok){const msg=result.gabim||result.detail||Object.entries(result).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(', '):v}`).join('; ');throw new Error(msg||`Gabim HTTP ${response.status}`);}
        return result;
    }
    function showDialog(title, html, onReady) {
        $('dialog-title').textContent=title;
        $('dialog-content').innerHTML=html;
        $('dialog-message').textContent='';
        dialog.showModal();
        onReady?.();
    }
    const input = (label,type,id,extra='') => `<label for="${id}">${label}</label><input id="${id}" type="${type}" ${extra}>`;
    const form = html => `<form class="dialog-body" id="modal-form">${html}<button class="gold-button" type="submit">Ruaj dhe dërgo →</button></form>`;
    function modalError(text){$('dialog-message').textContent=text;}
    function dateToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
    async function refresh(classId) {
        try {
            state=await api(`/api/mesimdhenesi/panel/${classId ? '?klasa='+encodeURIComponent(classId) : ''}`);
            render();
        } catch(e) {
            $('page-message').textContent=e.message;
            if(e.message.includes('qasje')||e.message.includes('miratuar')){location.replace('/login/?role=mesimdhenes');}
        }
    }
    function render(){
        const p=state.profili;
        $('teacher-name').textContent=p.emri;
        $('welcome-name').textContent=p.emri+'!';
        $('teacher-email').textContent=p.email;
        $('teacher-phone').textContent=p.telefoni||'—';
        $('teacher-subject').textContent=p.lenda;
        $('teacher-school-id').textContent=p.identifikuesi ? 'ID shkollore: '+p.identifikuesi : '';
        const tutorClasses=state.klasat.filter(x=>x.kujdestar);
        $('profile-tutor').hidden=!tutorClasses.length;
        $('teacher-tutor').textContent=tutorClasses.map(x=>x.emri).join(', ');
        if(p.ka_foto&&!photoUrl){
            fetch('/api/mesimdhenesi/foto/',{headers:{Authorization:`Token ${token}`}})
            .then(r=>r.ok?r.blob():null).then(blob=>{if(!blob)return;photoUrl=URL.createObjectURL(blob);$('teacher-photo').src=photoUrl;$('teacher-photo').hidden=false;$('photo-placeholder').hidden=true;}).catch(()=>{});
        }
        const currentId=state.klasa_e_zgjedhur;
        $('class-list').replaceChildren();
        state.klasat.forEach(c=>{
            const el=document.createElement('button');el.className='class-card'+(c.id===currentId?' active':'');
            el.innerHTML=`<span class="class-icon">♙</span><span><strong>${escapeHTML(c.emri)}</strong><small>${c.nxenes} nxënës${c.kujdestar?' · Kujdestar':''}</small></span><b>➜</b>`;
            el.onclick=()=>refresh(c.id);$('class-list').append(el);
        });
        if(!state.klasat.length) $('class-list').innerHTML='<p class="empty">Drejtori nuk të ka caktuar ende në asnjë klasë.</p>';
        selectedClass.replaceChildren();
        state.klasat.forEach(c=>selectedClass.add(new Option(c.emri,c.id)));
        if(currentId) selectedClass.value=String(currentId);
        $('tutor-banner').hidden=!tutorClasses.length;
        $('tutor-class').textContent=tutorClasses.map(x=>x.emri).join(', ')||'—';
        $('tutor-banner').style.cursor=tutorClasses.length?'pointer':'default';
        $('tutor-banner').onclick=()=>{if(tutorClasses.length)refresh(tutorClasses[0].id)};
        $('student-table').replaceChildren();
        state.nxenesit.forEach((student,i)=>{
            const tr=document.createElement('tr');
            tr.innerHTML=`<td>${i+1}</td><td>${escapeHTML(student.emri)}</td><td>${student.mesatarja==null?'—':`<span class="grade-tag">${Number(student.mesatarja).toFixed(2)}</span>`}</td><td>${student.mungesat}</td><td><button class="mini-btn" aria-label="Shiko notat" title="Shiko notat">◉</button> <button class="mini-btn" aria-label="Shto notë" title="Shto notë">✎</button></td>`;
            const buttons=tr.querySelectorAll('button');buttons[0].onclick=()=>showGrades(student.id);buttons[1].onclick=()=>openGrade(student.id);
            $('student-table').append(tr);
        });
        if(!state.nxenesit.length)$('student-table').innerHTML='<tr><td colspan="5">Nuk ka nxënës në këtë klasë.</td></tr>';
        const chosenAssignment=assignment.value;
        assignment.replaceChildren();
        state.angazhimet.filter(a=>a.klasa_id===currentId).forEach(a=>assignment.add(new Option(a.klasa+' • '+a.lenda,a.id)));
        if([...assignment.options].some(o=>o.value===chosenAssignment))assignment.value=chosenAssignment;
        $('open-grade').disabled=!assignment.options.length;
        $('abs-total').textContent=state.mungesa_gjithsej;
        $('abs-justified').textContent=state.mungesat_e_arsyeshme;
        $('abs-unjustified').textContent=state.mungesat_e_paarsyeshme;
        $('abs-review').textContent=state.mungesat_ne_shqyrtim;
        $('class-average').textContent=state.mesatarja==null?'—':Number(state.mesatarja).toFixed(2);
        const decisions=$('decisions-list');decisions.replaceChildren();
        state.vendimet.slice(0,allDecisions?15:3).forEach(v=>{
            const b=document.createElement('button');b.className='decision';b.innerHTML=`<span class="decision-icon">▤</span><span><strong>${escapeHTML(v.titulli)}</strong><small>Drejtori • ${escapeHTML(v.data)}</small></span>`;
            b.onclick=()=>showDialog(v.titulli,`<div class="dialog-list"><article><p>${escapeHTML(v.permbajtja)}</p><small>${escapeHTML(v.data)}</small></article></div>`);
            decisions.append(b);
        });
        if(!state.vendimet.length)decisions.innerHTML='<p class="empty">Nuk ka vendime për t’u shfaqur.</p>';
    }
    function showGrades(studentId){
        const rows=state.notat.filter(x=>!studentId||x.nxenesi_id===studentId);
        showDialog('Notat sipas lëndëve',`<div class="dialog-list"><table class="dialog-table"><thead><tr><th>Nxënësi</th><th>Lënda</th><th>Nota</th><th>Data</th></tr></thead><tbody>${rows.map(n=>`<tr><td>${escapeHTML(n.nxenesi)}</td><td>${escapeHTML(n.lenda)}</td><td>${n.vleresimi}</td><td>${escapeHTML(n.data)}</td></tr>`).join('')||'<tr><td colspan="4">Nuk ka nota të regjistruara.</td></tr>'}</tbody></table></div>`);
    }
    function openGrade(studentId){
        const mine=state.angazhimet.filter(a=>a.klasa_id===state.klasa_e_zgjedhur);
        if(!mine.length){$('page-message').textContent='Nuk je i angazhuar në këtë klasë për të vendosur nota.';return;}
        const options=mine.map(a=>`<option value="${a.id}" ${String(a.id)===assignment.value?'selected':''}>${escapeHTML(a.klasa+' — '+a.lenda)}</option>`).join('');
        const students=state.nxenesit.map(n=>`<option value="${n.id}" ${n.id===studentId?'selected':''}>${escapeHTML(n.emri)}</option>`).join('');
        showDialog('Regjistro notë të re',form(`<label for="grade-assignment">Klasa dhe lënda</label><select id="grade-assignment">${options}</select><label for="grade-student">Nxënësi</label><select id="grade-student">${students}</select><label for="grade-value">Nota</label><select id="grade-value">${[1,2,3,4,5].map(x=>`<option value="${x}">${x}</option>`).join('')}</select>`),()=>{
            $('modal-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await api('/api/notat/','POST',{angazhimi:Number($('grade-assignment').value),nxenesi:Number($('grade-student').value),vleresimi:Number($('grade-value').value)});dialog.close();await refresh(state.klasa_e_zgjedhur);}catch(err){modalError(err.message)}finally{b.disabled=false;}};
        });
    }
    function openAbsences(){
        const options=state.angazhimet.filter(x=>x.klasa_id===state.klasa_e_zgjedhur).map(x=>`<option value="${x.id}">${escapeHTML(x.lenda)}</option>`).join('');
        const students=state.nxenesit.map(x=>`<option value="${x.id}">${escapeHTML(x.emri)}</option>`).join('');
        let html='<div class="dialog-list"><h3>Mungesat e klasës</h3>';
        html+='<table class="dialog-table"><thead><tr><th>Nxënësi</th><th>Data</th><th>Ora</th><th>Statusi</th><th></th></tr></thead><tbody>';
        html+=state.mungesat.map(m=>`<tr><td>${escapeHTML(m.nxenesi)}</td><td>${escapeHTML(m.data)}</td><td>${m.ora_mesimore??'—'}</td><td>${escapeHTML(m.statusi)}</td><td>${state.eshte_kujdestar?`<button class="mini-btn" data-justify="${m.id}">Arsyeto</button>`:''}</td></tr>`).join('')||'<tr><td colspan="5">Nuk ka mungesa.</td></tr>';
        html+='</tbody></table></div>';
        if(options){html+=form(`<h3>Regjistro mungesë</h3><label for="abs-assign">Lënda</label><select id="abs-assign">${options}</select><label for="abs-student">Nxënësi</label><select id="abs-student">${students}</select>${input('Data','date','abs-date','required') }<label for="abs-hour">Ora mësimore</label><select id="abs-hour">${Array.from({length:10},(_,i)=>`<option value="${i+1}">Ora ${i+1}</option>`).join('')}</select>`);}
        showDialog('Mungesat e klasës',html,()=>{
            document.querySelectorAll('[data-justify]').forEach(b=>b.onclick=()=>justifyAbsence(Number(b.dataset.justify)));
            if(!$('modal-form'))return;
            $('abs-date').value=dateToday();
            $('modal-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await api('/api/mungesat/','POST',{angazhimi:Number($('abs-assign').value),nxenesi:Number($('abs-student').value),data:$('abs-date').value,ora_mesimore:Number($('abs-hour').value)});dialog.close();await refresh(state.klasa_e_zgjedhur);}catch(err){modalError(err.message)}finally{b.disabled=false;}};
        });
    }
    function justifyAbsence(id){
        const record=state.mungesat.find(m=>m.id===id);
        if(!record)return;
        showDialog('Arsyetimi i mungesës',form(`<p>${escapeHTML(record.nxenesi)} • ${escapeHTML(record.data)} • Ora ${record.ora_mesimore??'—'}</p><label for="absence-status">Statusi</label><select id="absence-status"><option value="e_arsyeshme">E arsyeshme</option><option value="e_paarsyeshme">E paarsyeshme</option><option value="ne_shqyrtim">Në shqyrtim</option></select><label for="absence-reason">Arsyetimi / shënimi</label><textarea id="absence-reason" rows="4" required>${escapeHTML(record.arsyetimi)}</textarea>`),()=>{
            $('absence-status').value=record.statusi;
            $('modal-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await api(`/api/mungesat/${id}/`,'PATCH',{statusi:$('absence-status').value,arsyetimi:$('absence-reason').value.trim()});dialog.close();await refresh(state.klasa_e_zgjedhur);}catch(err){modalError(err.message)}finally{b.disabled=false;}};
        });
    }
    function openRequest(type){
        const discipline=type==='perjashtim';
        const heading=discipline?'Propozim për masë disiplinore':'Kërkesë për leje / sqarim';
        const studentOptions=state.nxenesit.map(s=>`<option value="${s.id}">${escapeHTML(s.emri)}</option>`).join('');
        let markup=`<label for="req-type">Lloji</label><select id="req-type">${discipline?'<option value="perjashtim">Propozim për përjashtim të përkohshëm</option>':'<option value="leje">Kërkesë për leje</option><option value="sqarim">Kërkesë për sqarim</option>'}</select>`;
        if(discipline)markup+=`<label for="req-student">Nxënësi</label><select id="req-student">${studentOptions}</select>`;
        markup+=input('Titulli','text','req-title','minlength="5" maxlength="180" required');
        markup+=input('Nga data','date','req-start',discipline?'required':'');
        markup+=input('Deri më','date','req-end',discipline?'required':'');
        markup+='<label for="req-description">Shpjegimi i kërkesës</label><textarea id="req-description" minlength="12" rows="4" required></textarea><p>Kjo kërkesë dërgohet për shqyrtim te Drejtori; nuk zbatohet automatikisht.</p>';
        showDialog(heading,form(markup),()=>{
            $('req-start').value=dateToday();$('req-end').value=dateToday();
            $('modal-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;
                try{const payload={lloji:$('req-type').value,titulli:$('req-title').value,pershkrimi:$('req-description').value,data_nga:$('req-start').value,data_deri:$('req-end').value};if(discipline)payload.nxenesi=Number($('req-student').value);await api('/api/mesimdhenesi/kerkesat/','POST',payload);dialog.close();await refresh(state.klasa_e_zgjedhur);$('page-message').textContent='Kërkesa iu dërgua Drejtorit për shqyrtim.';}catch(err){modalError(err.message)}finally{b.disabled=false;}
            };
        });
    }
    function showMyRequests(){
        showDialog('Kërkesat e mia',`<div class="dialog-list">${state.kerkesat.map(k=>`<article><strong>${escapeHTML(k.titulli)}</strong><span class="status-label ${k.statusi==='miratuar'?'good':k.statusi==='refuzuar'?'bad':''}">${escapeHTML(k.statusi.replaceAll('_',' '))}</span><p>${escapeHTML(k.pergjigja||'Në pritje të përgjigjes së Drejtorit.')}</p></article>`).join('')||'<p>Nuk ke kërkesa të dërguara.</p>'}</div>`);
    }
    selectedClass.onchange=()=>refresh(Number(selectedClass.value));
    $('open-grade').onclick=()=>openGrade();
    $('open-absence').onclick=openAbsences;
    $('all-grades').onclick=()=>showGrades();
    $('all-decisions').onclick=()=>{allDecisions=!allDecisions;render()};
    $('show-requests').onclick=showMyRequests;
    document.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>openRequest(b.dataset.request));
    await refresh();
});
