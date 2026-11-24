document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.teacherPage || 'panel';
    const token = sessionStorage.getItem('schoolControlToken');
    const role = sessionStorage.getItem('schoolControlRole');
    const $ = id => document.getElementById(id);
    const path = '/mesimdhenesi/';
    const routes = {panel: `${path}panel/`, klasat: `${path}klasat/`, notat: `${path}notat/`, 'klasa-ime': `${path}klasa-ime/`, vendimet: `${path}vendimet/`, kerkesat: `${path}kerkesat/`};
    if (!token || role !== 'mesimdhenes') {
        location.replace('/login/?role=mesimdhenes');
        return;
    }

    let state = null;
    let chosenClass = null;
    let chosenAssignment = null;
    let allRequests = [];
    let photoObjectUrl = null;
    let focusStudent = '';
    let decisionRead = [];
    let responseRead = [];
    let tutorTab = 'students';
    const dialog = $('portal-dialog');

    function esc(x) {
        return String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
    }
    function dateToday() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function showDate() {
        const parts = new Intl.DateTimeFormat('en-GB', {
            weekday:'long',day:'numeric',month:'numeric',year:'numeric',timeZone:'Europe/Belgrade'
        }).formatToParts(new Date());
        const values = Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
        const days = {Monday:'e hënë',Tuesday:'e martë',Wednesday:'e mërkurë',Thursday:'e enjte',Friday:'e premte',Saturday:'e shtunë',Sunday:'e diel'};
        const months = ['','janar','shkurt','mars','prill','maj','qershor','korrik','gusht','shtator','tetor','nëntor','dhjetor'];
        $('portal-date').textContent = `${days[values.weekday]||values.weekday}, ${values.day} ${months[Number(values.month)]} ${values.year}`;
    }
    showDate();
    setInterval(showDate, 60000);

    $('portal-logout').addEventListener('click', () => {
        ['schoolControlToken', 'schoolControlRole', 'schoolControlEmail'].forEach(k => sessionStorage.removeItem(k));
        location.assign('/');
    });
    $('dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });

    async function api(url, method='GET', payload) {
        const options = {method,headers:{Authorization:`Token ${token}`}};
        if (payload !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(payload);
        }
        const response = await fetch(url, options);
        if (response.status === 401) {
            sessionStorage.removeItem('schoolControlToken');
            location.replace('/login/?role=mesimdhenes');
            throw new Error('Sesioni ka përfunduar.');
        }
        if (response.status === 204) return null;
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            let msg = body.gabim || body.detail;
            if (!msg) msg = Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' · ');
            throw new Error(msg || `Operacioni dështoi (HTTP ${response.status}).`);
        }
        return body;
    }

    function setMessage(value, target='portal-message') {
        $(target).textContent = value || '';
    }
    function flashSuccess(value, id='grade-feedback') {
        const el = $(id);
        if (!el) return;
        el.classList.add('success');
        el.textContent = value;
    }
    function flashError(value, id='grade-feedback') {
        const el = $(id);
        if (!el) return;
        el.classList.remove('success');
        el.textContent = value;
    }
    function openDialog(title, html, ready) {
        $('dialog-title').textContent = title;
        $('dialog-inner').innerHTML = html;
        $('dialog-error').textContent = '';
        if (!dialog.open) dialog.showModal();
        if (ready) ready();
    }
    function dialogError(value) {$('dialog-error').textContent = value;}
    function localGet(key) {
        try { const x = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(x) ? x : []; }
        catch { return []; }
    }
    function localSet(key, values) { try { localStorage.setItem(key, JSON.stringify(values)); } catch {} }
    function decisionKey() {return `schoolControlTeacherDecisionRead:${state.profili.email}`;}
    function responseKey() {return `schoolControlTeacherResponseRead:${state.profili.email}`;}
    function initReads() {
        decisionRead = localGet(decisionKey());
        responseRead = localGet(responseKey());
    }
    function getNewDecisions() {return state.vendimet.filter(x => !decisionRead.includes(Number(x.id)));}
    function getNewResponses() {return state.kerkesat.filter(x => ['miratuar','refuzuar'].includes(x.statusi) && !responseRead.includes(Number(x.id)));}
    function badge(id, count) {
        const el = $(id);
        el.hidden = count === 0;
        el.textContent = count > 9 ? '9+' : String(count);
    }
    function updateBadges() {
        badge('notification-badge', getNewDecisions().length);
        badge('request-badge', getNewResponses().length);
        if ($('decision-unread-count')) $('decision-unread-count').textContent = String(getNewDecisions().length);
        if ($('home-decision-count')) $('home-decision-count').textContent = String(getNewDecisions().length);
    }
    function markDecision(id) {
        if (!decisionRead.includes(Number(id))) {
            decisionRead.push(Number(id));
            localSet(decisionKey(), decisionRead);
        }
        updateBadges();
    }
    function markResponse(id) {
        if (!responseRead.includes(Number(id))) {
            responseRead.push(Number(id));
            localSet(responseKey(), responseRead);
        }
        updateBadges();
    }
    function formatAverage(value) {return value === null || value === undefined ? '—' : Number(value).toFixed(2);}
    function statusText(x) {return ({ne_shqyrtim:'Në shqyrtim',e_arsyeshme:'E arsyeshme',e_paarsyeshme:'E paarsyeshme',miratuar:'Miratuar',refuzuar:'Refuzuar'})[x] || x || '—';}
    function statusTag(x) {return `<span class="tag ${x === 'e_arsyeshme' || x === 'miratuar'?'green':x === 'e_paarsyeshme'||x === 'refuzuar'?'red':'gold'}">${esc(statusText(x))}</span>`;}
    function formatDate(x) {
        if (!x) return '—';
        const d = String(x).slice(0,10).split('-');
        return d.length === 3 ? `${d[2]}.${d[1]}.${d[0]}` : x;
    }
    function setQueryClass(id) {
        const u = new URL(location.href);
        if (id) u.searchParams.set('klasa', id); else u.searchParams.delete('klasa');
        history.replaceState(null, '', u.pathname + u.search);
    }
    async function loadSnapshot(id=null) {
        const suffix = id ? `?klasa=${encodeURIComponent(id)}` : '';
        const data = await api(`/api/mesimdhenesi/panel/${suffix}`);
        if (!state) {
            state = data;
            initReads();
            updateProfile();
        } else {
            state = data;
        }
        chosenClass = data.klasa_e_zgjedhur;
        updateBadges();
        return data;
    }
    function updateProfile() {
        const p = state.profili;
        $('profile-name').textContent = p.emri;
        $('profile-subject').textContent = p.lenda || '—';
        $('profile-email').textContent = p.email;
        $('profile-phone').textContent = p.telefoni || '—';
        $('profile-identifier').textContent = p.identifikuesi ? `ID: ${p.identifikuesi}` : 'SCHOOL CONTROL';
        const tutors = state.klasat.filter(c => c.kujdestar);
        $('profile-tutor').hidden = !tutors.length;
        $('profile-tutor-class').textContent = tutors.map(c=>c.emri).join(', ');
        if (p.ka_foto) {
            fetch('/api/mesimdhenesi/foto/', {headers:{Authorization:`Token ${token}`}})
                .then(r => r.ok ? r.blob() : null)
                .then(b => {
                    if (!b) return;
                    if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
                    photoObjectUrl = URL.createObjectURL(b);
                    $('portal-photo').src = photoObjectUrl;
                    $('portal-photo').hidden = false;
                    $('portrait-fallback').hidden = true;
                }).catch(() => {});
        }
    }
    function classList() {
        const teachingIds = new Set(state.angazhimet.map(a => a.klasa_id));
        return state.klasat.filter(c => teachingIds.has(c.id));
    }
    function tutorList() {return state.klasat.filter(c => c.kujdestar);}
    function assignmentList(classId) {return state.angazhimet.filter(a => a.klasa_id === Number(classId));}
    function studentRecord(id) {return state.nxenesit.find(n => n.id === Number(id));}
    function gradeLines(studentId=null) {
        return state.notat.filter(n => !studentId || n.nxenesi_id === Number(studentId));
    }
    function absenceLines(studentId=null) {
        return state.mungesat.filter(n => !studentId || n.nxenesi_id === Number(studentId));
    }
    function noData(colspan, text) {return `<tr><td class="table-empty" colspan="${colspan}">${esc(text)}</td></tr>`;}
    function showGrades(studentId=null) {
        const rows = gradeLines(studentId);
        const content = `<div class="dialog-table-wrap"><table><thead><tr><th>Nxënësi</th><th>Lënda</th><th>Nota</th><th>Data</th></tr></thead><tbody>${rows.map(n => `<tr><td>${esc(n.nxenesi)}</td><td>${esc(n.lenda)}</td><td><span class="tag green">${n.vleresimi}</span></td><td>${formatDate(n.data)}</td></tr>`).join('') || noData(4,'Nuk ka nota të regjistruara.')}</tbody></table></div>`;
        openDialog(studentId ? `Notat e ${studentRecord(studentId)?.emri || 'nxënësit'}` : 'Notat sipas lëndëve', content);
    }
    async function loadClass(id, renderFn) {
        await loadSnapshot(id);
        setQueryClass(id);
        renderFn();
    }

    function renderHome() {
        $('home-class-count').textContent = classList().length;
        $('home-tutor-count').textContent = tutorList().length;
        $('home-decision-count').textContent = getNewDecisions().length;
        $('home-request-count').textContent = state.kerkesat.filter(x => x.statusi === 'ne_shqyrtim').length;
    }

    function studentClassRow(n, i) {
        return `<tr><td>${i+1}</td><td><strong>${esc(n.emri)}</strong></td><td>${formatAverage(n.mesatarja)}</td><td>${esc(n.notat)}</td><td><span class="tag ${n.mungesat>5?'red':''}">${esc(n.mungesat)}</span></td><td><button class="row-action" type="button" data-student-grade="${esc(n.id)}">Notat</button><button class="row-action" type="button" data-student-abs="${esc(n.id)}">Mungesat</button></td></tr>`;
    }
    function bindClassStudentActions(container) {
        container.querySelectorAll('[data-student-grade]').forEach(b => b.addEventListener('click', () => showGrades(b.dataset.studentGrade)));
        container.querySelectorAll('[data-student-abs]').forEach(b => b.addEventListener('click', () => showAbsences(b.dataset.studentAbs)));
    }
    function showAllClassStudents() {
        const selected = classList().find(c => c.id === chosenClass);
        if (!selected) return;
        const students = state.nxenesit.slice();
        const content = `<div class="all-students-toolbar"><label for="all-class-search">Kërko nxënësin</label><input type="search" id="all-class-search" placeholder="Shkruaj emrin ose mbiemrin..." autocomplete="off"><span id="all-class-counter" role="status"></span></div><div class="dialog-table-wrap"><table><thead><tr><th>Nr.</th><th>Emri dhe mbiemri</th><th>Mesatarja</th><th>Numri i notave</th><th>Mungesat</th><th>Veprimet</th></tr></thead><tbody id="all-class-students"></tbody></table></div>`;
        openDialog(`Të gjithë nxënësit – ${selected.emri}`, content);
        const search = $('all-class-search');
        const renderAll = () => {
            const term = search.value.trim().toLocaleLowerCase('sq-AL');
            const filtered = students.filter(n => n.emri.toLocaleLowerCase('sq-AL').includes(term));
            const tbody = $('all-class-students');
            tbody.innerHTML = filtered.map((n, i) => studentClassRow(n, i)).join('') || noData(6, 'Nuk u gjet asnjë nxënës.');
            $('all-class-counter').textContent = `${filtered.length} nga ${students.length} nxënës`;
            bindClassStudentActions(tbody);
        };
        search.addEventListener('input', renderAll);
        renderAll();
        search.focus();
    }

    function renderClasses() {
        const classes = classList();
        $('classes-total').textContent = `${classes.length} klasa`;
        const cards = $('class-cards');
        cards.innerHTML = classes.length ? classes.map(c => `<button type="button" class="class-card ${c.id === chosenClass ? 'selected' : ''}" data-class="${c.id}"><span class="class-symbol">▣</span><span><strong>${esc(c.emri)}</strong><small>${c.nxenes} nxënës${c.kujdestar?' · Kujdestar':''}</small></span><b>→</b></button>`).join('') : '<div class="placeholder-card">Drejtori nuk të ka caktuar ende në klasa. Pasi të caktohesh, ato do të shfaqen këtu.</div>';
        cards.querySelectorAll('[data-class]').forEach(b => b.addEventListener('click', async () => {
            try {await loadClass(Number(b.dataset.class),renderClasses);} catch(e){setMessage(e.message);}
        }));
        const chosen = classes.find(c => c.id === chosenClass);
        $('class-detail').hidden = !chosen;
        if (!chosen) return;
        $('class-title').textContent = `Nxënësit e klasës ${chosen.emri}`;
        $('class-subtitle').textContent = `Gjithsej ${state.nxenesit.length} nxënës · Lëndët: ${assignmentList(chosen.id).map(x=>x.lenda).join(', ') || '—'}`;
        const gradeLink = $('class-grade-link');
        gradeLink.hidden = !assignmentList(chosen.id).length;
        gradeLink.href = `${routes.notat}?klasa=${chosen.id}`;
        $('class-record-absence').hidden = !assignmentList(chosen.id).length;
        const tbody = $('class-students');
        const preview = state.nxenesit.slice(0, 3);
        tbody.innerHTML = preview.map((n, i) => studentClassRow(n, i)).join('') || noData(6, 'Nuk ka nxënës të regjistruar në këtë klasë.');
        bindClassStudentActions(tbody);
        $('class-preview-count').textContent = `Shfaqen ${preview.length} nga ${state.nxenesit.length} nxënës`;
        $('class-view-all').disabled = state.nxenesit.length === 0;
    }

    function chooseAssignment(id) {
        const a = state.angazhimet.find(x => x.id === Number(id));
        chosenAssignment = a ? a.id : null;
        return a;
    }
    async function renderGrades() {
        const select = $('grade-assignment');
        if (!chosenAssignment) {
            const qp = new URLSearchParams(location.search);
            const cid = qp.get('klasa');
            const first = cid ? state.angazhimet.find(a=> String(a.klasa_id) === cid) : null;
            chosenAssignment = first?.id || state.angazhimet[0]?.id || null;
        }
        const mine = state.angazhimet;
        select.innerHTML = mine.length ? mine.map(a=>`<option value="${a.id}" ${chosenAssignment===a.id?'selected':''}>${esc(a.klasa)} · ${esc(a.lenda)}</option>`).join('') : '<option value="">Asnjë angazhim i caktuar</option>';
        const chosen = chooseAssignment(chosenAssignment);
        const studentSelect = $('grade-student');
        studentSelect.innerHTML = `<option value="">Zgjidh nxënësin...</option>` + (chosen ? state.nxenesit.map(n=>`<option value="${n.id}">${esc(n.emri)}</option>`).join('') : '');
        $('grade-class-hint').textContent = chosen ? `${chosen.klasa} · ${chosen.lenda}` : 'Nuk ke angazhime të caktuara.';
        const tbody = $('grade-students');
        tbody.innerHTML = chosen ? state.nxenesit.map((n,i)=>`<tr><td>${i+1}</td><td>${esc(n.emri)}</td><td>${formatAverage(n.mesatarja)}</td><td>${n.notat}</td></tr>`).join('') || noData(4,'Nuk ka nxënës në këtë klasë.') : noData(4,'Drejtori ende nuk të ka caktuar në një lëndë/klasë.');
        $('grade-form').querySelector('button[type="submit"]').disabled = !chosen || !state.nxenesit.length;
    }
    async function gradeAssignmentChange() {
        const select = $('grade-assignment');
        const a = chooseAssignment(select.value);
        if (!a) return;
        try {
            await loadClass(a.klasa_id, renderGrades);
            select.value = String(a.id);
            chosenAssignment = a.id;
            renderGrades();
        } catch(e) {flashError(e.message);}
    }
    async function saveGrade(event) {
        event.preventDefault();
        const assignment = chooseAssignment($('grade-assignment').value);
        const sid = Number($('grade-student').value);
        const value = Number($('grade-value').value);
        if (!assignment || !sid || ![1,2,3,4,5].includes(value)) {
            flashError('Zgjidh angazhimin, nxënësin dhe notën nga 1 deri në 5.');
            return;
        }
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        flashError('Duke ruajtur notën...');
        try {
            await api('/api/notat/', 'POST', {angazhimi:assignment.id,nxenesi:sid,vleresimi:value});
            await loadSnapshot(assignment.klasa_id);
            chosenAssignment = assignment.id;
            renderGrades();
            $('grade-student').value = String(sid);
            $('grade-value').value = '';
            flashSuccess('Nota u ruajt me sukses në databazë.');
        } catch(e) {flashError(e.message);} finally {button.disabled = false;}
    }

    function displayTutorTab() {
        $('tutor-students-section').hidden = true;
        $('tutor-absences-section').hidden = true;
        $('tab-tutor-students').classList.toggle('active', tutorTab === 'students');
        $('tab-tutor-absences').classList.toggle('active', tutorTab === 'absences');
        $('tab-tutor-students').setAttribute('aria-selected', String(tutorTab === 'students'));
        $('tab-tutor-absences').setAttribute('aria-selected', String(tutorTab === 'absences'));
    }

    function showTutorDetails(type) {
        if (!state) return;
        tutorTab = type;
        displayTutorTab();
        if (!document.getElementById('tutor-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'tutor-dialog-styles';
            style.textContent = `
                #tutor-students-section[hidden], #tutor-absences-section[hidden] { display:none !important; }
                #portal-dialog.tutor-detail-dialog { width:min(1100px,calc(100vw - 32px)); max-width:1100px; }
                #portal-dialog.tutor-detail-dialog .dialog-inner { padding:16px 18px; }
                .tutor-modal-tools {display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;align-items:center;margin-bottom:13px}
                .tutor-modal-tools select {border:1px solid #d7e5f2;border-radius:10px;background:#f7fbff;color:#123c66;padding:9px;font:inherit;max-width:240px}
                .tutor-modal-table {max-height:55dvh;overflow:auto;border:1px solid #d8e7f2;border-radius:13px}
                .tutor-modal-table table {width:100%;min-width:770px;border-collapse:collapse}
                .tutor-modal-table th {position:sticky;top:0;background:#e6f2fb;color:#174b73;font-size:12px;padding:12px;text-align:left;z-index:1}
                .tutor-modal-table td {padding:12px;border-bottom:1px solid #e7eff5;font-size:12px;white-space:nowrap}
                .tutor-modal-table .row-action {margin-right:5px}
                .tutor-modal-note {margin:0 0 13px;font-size:13px;color:#68849b}
                @media(max-width:710px) {#portal-dialog.tutor-detail-dialog {width:calc(100vw - 16px)} .tutor-modal-tools {justify-content:flex-start}}
            `;
            document.head.appendChild(style);
        }
        const className = tutorList().find(x => x.id === chosenClass)?.emri || 'klasës';
        if (type === 'students') {
            const rows = state.nxenesit.map((n,i) => {
                const absences = absenceLines(n.id);
                const justified = absences.filter(m => m.statusi === 'e_arsyeshme').length;
                const unjustified = absences.filter(m => m.statusi === 'e_paarsyeshme').length;
                return `<tr><td>${i+1}</td><td><strong>${esc(n.emri)}</strong></td><td>${formatAverage(n.mesatarja)}</td><td>${n.notat}</td><td>${n.mungesat}</td><td>${justified}</td><td>${unjustified}</td><td><button type="button" class="row-action" data-modal-student-grade="${n.id}">Notat</button><button type="button" class="row-action" data-modal-student-abs="${n.id}">Mungesat</button></td></tr>`;
            }).join('') || noData(8, 'Nuk ka nxënës në këtë klasë.');
            const html = `<p class="tutor-modal-note">${esc(className)} · Pasqyra e nxënësve dhe mesatareve</p><div class="tutor-modal-tools"><button type="button" class="btn subtle" id="tutor-modal-all-grades">Të gjitha notat sipas lëndëve →</button></div><div class="tutor-modal-table"><table><thead><tr><th>Nr.</th><th>Nxënësi</th><th>Mesatarja</th><th>Nota</th><th>Mungesa</th><th>Të arsyeshme</th><th>Të paarsyeshme</th><th>Veprimet</th></tr></thead><tbody>${rows}</tbody></table></div>`;
            openDialog('Nxënësit, notat dhe mesataret', html, () => {
                $('tutor-modal-all-grades').addEventListener('click', () => {dialog.close();showGrades();});
                dialog.querySelectorAll('[data-modal-student-grade]').forEach(b => b.addEventListener('click', () => {dialog.close();showGrades(b.dataset.modalStudentGrade);}));
                dialog.querySelectorAll('[data-modal-student-abs]').forEach(b => b.addEventListener('click', () => {dialog.close();showAbsences(b.dataset.modalStudentAbs);}));
            });
        } else {
            const filterStudent = `<option value="">Të gjithë nxënësit</option>` + state.nxenesit.map(n => `<option value="${n.id}">${esc(n.emri)}</option>`).join('');
            const filterStatus = `<option value="">Të gjitha statuset</option><option value="ne_shqyrtim">Në shqyrtim</option><option value="e_arsyeshme">Të arsyeshme</option><option value="e_paarsyeshme">Të paarsyeshme</option>`;
            const buttonAbsence = assignmentList(chosenClass).length ? '<button type="button" id="tutor-modal-new-absence" class="btn blue">＋ Shëno mungesë</button>' : '';
            const html = `<p class="tutor-modal-note">${esc(className)} · Mungesat me datë, orë dhe status</p><div class="tutor-modal-tools"><select id="tutor-modal-filter-student" aria-label="Filtro sipas nxënësit">${filterStudent}</select><select id="tutor-modal-filter-status" aria-label="Filtro sipas statusit">${filterStatus}</select>${buttonAbsence}</div><div class="tutor-modal-table"><table><thead><tr><th>Nxënësi</th><th>Data</th><th>Ora</th><th>Lënda</th><th>Statusi</th><th>Arsyetimi</th><th>Veprimi</th></tr></thead><tbody id="tutor-modal-absence-rows"></tbody></table></div>`;
            openDialog('Mungesat sipas orëve dhe arsyetimet', html, () => {
                function renderModalAbsences() {
                    const studentId = $('tutor-modal-filter-student').value;
                    const status = $('tutor-modal-filter-status').value;
                    const rows = state.mungesat.filter(m => (!studentId || m.nxenesi_id === Number(studentId)) && (!status || m.statusi === status));
                    $('tutor-modal-absence-rows').innerHTML = rows.map(m => `<tr><td>${esc(m.nxenesi)}</td><td>${formatDate(m.data)}</td><td>${m.ora_mesimore ?? '—'}</td><td>${esc(m.lenda)}</td><td>${statusTag(m.statusi)}</td><td>${esc(m.arsyetimi || '—')}</td><td><button type="button" class="row-action" data-modal-justify="${m.id}">Arsyeto</button></td></tr>`).join('') || noData(7, 'Nuk ka mungesa për filtrat e zgjedhur.');
                    dialog.querySelectorAll('[data-modal-justify]').forEach(b => b.addEventListener('click', () => {dialog.close();justifyAbsence(b.dataset.modalJustify);}));
                }
                $('tutor-modal-filter-student').addEventListener('change', renderModalAbsences);
                $('tutor-modal-filter-status').addEventListener('change', renderModalAbsences);
                if ($('tutor-modal-new-absence')) $('tutor-modal-new-absence').addEventListener('click', () => {dialog.close();recordAbsence();});
                renderModalAbsences();
            });
        }
        dialog.classList.add('tutor-detail-dialog');
    }
    function renderTutor() {
        const tutors = tutorList();
        const select = $('tutor-class-select');
        select.hidden = !tutors.length;
        $('not-tutor').hidden = !!tutors.length;
        $('tutor-content').hidden = !tutors.length;
        if (!tutors.length) return;
        select.innerHTML = tutors.map(c=>`<option value="${c.id}">${esc(c.emri)}</option>`).join('');
        select.value = String(chosenClass);
        const chosen = tutors.find(c=>c.id===chosenClass) || tutors[0];
        $('tutor-class-name').textContent = chosen.emri;
        $('tutor-students-total').textContent = state.nxenesit.length;
        $('tutor-class-average').textContent = formatAverage(state.mesatarja);
        $('tutor-absence-total').textContent = state.mungesa_gjithsej;
        $('tutor-absence-justified').textContent = state.mungesat_e_arsyeshme;
        $('tutor-absence-unjustified').textContent = state.mungesat_e_paarsyeshme;
        $('tutor-absence-pending').textContent = state.mungesat_ne_shqyrtim;
        $('tutor-record-absence').hidden = !assignmentList(chosen.id).length;
        const tbody = $('tutor-students');
        tbody.innerHTML = state.nxenesit.map((n,i)=>{
            const a = absenceLines(n.id);
            const justified = a.filter(x=>x.statusi==='e_arsyeshme').length;
            const unjustified = a.filter(x=>x.statusi==='e_paarsyeshme').length;
            return `<tr><td>${i+1}</td><td><strong>${esc(n.emri)}</strong></td><td><span class="tag green">${formatAverage(n.mesatarja)}</span></td><td>${n.notat}</td><td>${n.mungesat}</td><td>${justified}</td><td>${unjustified}</td><td><button type="button" class="row-action" data-student-grade="${n.id}">Notat</button><button type="button" class="row-action" data-student-abs="${n.id}">Mungesat</button></td></tr>`;
        }).join('') || noData(8,'Nuk ka nxënës në këtë klasë.');
        tbody.querySelectorAll('[data-student-grade]').forEach(b => b.addEventListener('click',()=>showGrades(b.dataset.studentGrade)));
        tbody.querySelectorAll('[data-student-abs]').forEach(b => b.addEventListener('click',()=>showAbsences(b.dataset.studentAbs)));
        const filter = $('abs-student-filter');
        const prev = filter.value;
        filter.innerHTML = '<option value="">Të gjithë nxënësit</option>' + state.nxenesit.map(n=>`<option value="${n.id}">${esc(n.emri)}</option>`).join('');
        if ([...filter.options].some(o=>o.value===prev)) filter.value = prev;
        renderAbsenceRows();
        displayTutorTab();
    }
    function renderAbsenceRows() {
        const tbody = $('tutor-absences');
        const studentId = $('abs-student-filter').value;
        const status = $('abs-status-filter').value;
        const rows = state.mungesat.filter(m=>(!studentId || m.nxenesi_id===Number(studentId))&&(!status||m.statusi===status));
        tbody.innerHTML = rows.map(m=>`<tr><td>${esc(m.nxenesi)}</td><td>${formatDate(m.data)}</td><td>${m.ora_mesimore??'—'}</td><td>${esc(m.lenda)}</td><td>${statusTag(m.statusi)}</td><td>${esc(m.arsyetimi||'—')}</td><td><button type="button" class="row-action" data-justify="${m.id}">Arsyeto</button></td></tr>`).join('') || noData(7,'Nuk ka mungesa për filtrat e zgjedhur.');
        tbody.querySelectorAll('[data-justify]').forEach(b=>b.addEventListener('click',()=>justifyAbsence(b.dataset.justify)));
    }
    function showAbsences(studentId=null) {
        const rows = absenceLines(studentId);
        openDialog(studentId ? `Mungesat e ${studentRecord(studentId)?.emri || 'nxënësit'}` : 'Mungesat e klasës', `<div class="dialog-table-wrap"><table><thead><tr><th>Data</th><th>Ora</th><th>Lënda</th><th>Statusi</th><th>Arsyetimi</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${formatDate(m.data)}</td><td>${m.ora_mesimore??'—'}</td><td>${esc(m.lenda)}</td><td>${statusTag(m.statusi)}</td><td>${esc(m.arsyetimi||'—')}</td></tr>`).join('') || noData(5,'Nuk ka mungesa të regjistruara.')}</tbody></table></div>`);
    }
    function justifyAbsence(id) {
        const m=state.mungesat.find(x=>x.id===Number(id));
        if (!m) return;
        openDialog('Shqyrto mungesën', `<p class="dialog-detail">${esc(m.nxenesi)} · ${formatDate(m.data)} · Ora ${m.ora_mesimore??'pa orë'}</p><form class="dialog-form" id="justify-form"><label for="justify-status">Statusi</label><select id="justify-status"><option value="ne_shqyrtim">Në shqyrtim</option><option value="e_arsyeshme">E arsyeshme</option><option value="e_paarsyeshme">E paarsyeshme</option></select><label for="justify-reason">Arsyetimi / shënimi</label><textarea id="justify-reason" rows="3">${esc(m.arsyetimi || '')}</textarea><button class="btn gold" type="submit">Ruaj arsyetimin</button></form>`, () => {
            $('justify-status').value=m.statusi;
            $('justify-form').addEventListener('submit',async e=>{
                e.preventDefault();
                const button=e.currentTarget.querySelector('button');
                const status = $('justify-status').value;
                const arsyetimi = $('justify-reason').value.trim();
                if(status==='e_arsyeshme'&&!arsyetimi){dialogError('Për mungesën e arsyeshme kërkohet arsyetim.');return;}
                button.disabled=true;
                try {await api(`/api/mungesat/${m.id}/`,'PATCH',{statusi:status,arsyetimi});dialog.close();await loadSnapshot(chosenClass);renderTutor();}
                catch(err){dialogError(err.message);}finally{button.disabled=false;}
            });
        });
    }
    function recordAbsence() {
        const assignments=assignmentList(chosenClass);
        if(!assignments.length){setMessage('Nuk je caktuar për këtë klasë për të shënuar mungesë.');return;}
        const options=assignments.map(a=>`<option value="${a.id}">${esc(a.lenda)}</option>`).join('');
        const students=state.nxenesit.map(n=>`<option value="${n.id}">${esc(n.emri)}</option>`).join('');
        if (!students) {setMessage('Nuk ka nxënës në këtë klasë.');return;}
        openDialog('Regjistro mungesë',`<form class="dialog-form" id="absence-form"><label for="absence-assignment">Lënda</label><select id="absence-assignment">${options}</select><label for="absence-student">Nxënësi</label><select id="absence-student">${students}</select><label for="absence-date">Data</label><input id="absence-date" type="date" required><label for="absence-hour">Ora mësimore</label><select id="absence-hour">${Array.from({length:10},(_,i)=>`<option value="${i+1}">Ora ${i+1}</option>`).join('')}</select><button class="btn gold" type="submit">Ruaj mungesën</button></form>`,()=>{
            $('absence-date').value=dateToday();
            $('absence-form').addEventListener('submit',async e=>{
                e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;
                try {
                    await api('/api/mungesat/','POST',{nxenesi:Number($('absence-student').value),angazhimi:Number($('absence-assignment').value),data:$('absence-date').value,ora_mesimore:Number($('absence-hour').value)});
                    dialog.close();await loadSnapshot(chosenClass);if(page==='klasat')renderClasses();else renderTutor();
                    setMessage('');
                }catch(err){dialogError(err.message);}finally{button.disabled=false;}
            });
        });
    }
    function renderDecisions() {
        $('decision-unread-count').textContent = String(getNewDecisions().length);
        const list = $('decision-list');
        list.innerHTML = state.vendimet.length ? state.vendimet.map(d=>{
            const unread=!decisionRead.includes(Number(d.id));
            return `<button type="button" class="decision-card ${unread?'new':''}" data-decision="${d.id}"><span class="decision-card-icon">▤</span><span><strong>${esc(d.titulli)}</strong><small>Drejtori · ${formatDate(d.data)}</small><p>${esc(String(d.permbajtja).slice(0,120))}${String(d.permbajtja).length>120?'…':''}</p></span>${unread?'<span class="tag gold">E re</span>':'<span class="tag">Lexuar</span>'}</button>`;
        }).join('') : '<p class="empty-message">Nuk ka ende vendime për t’u shfaqur.</p>';
        list.querySelectorAll('[data-decision]').forEach(b=>b.addEventListener('click',()=>{
            const d=state.vendimet.find(x=>x.id===Number(b.dataset.decision));
            if(!d)return;
            markDecision(d.id);renderDecisions();
            openDialog(d.titulli,`<p class="dialog-meta">Vendim i Drejtorit · ${formatDate(d.data)}</p><div class="dialog-detail">${esc(d.permbajtja)}</div>`);
        }));
    }
    async function refreshDecisions() {
        const current = chosenClass;
        try {await loadSnapshot(current);renderDecisions();setMessage('');}catch(err){setMessage(err.message);}
    }
    function renderRequests() {
        const tbody=$('requests-table');
        tbody.innerHTML = allRequests.map(r=>`<tr><td>${formatDate(r.krijuar_me)}</td><td>${esc(({perjashtim:'Masë disiplinore',leje:'Leje',sqarim:'Sqarim'})[r.lloji]||r.lloji)}</td><td><strong>${esc(r.titulli)}</strong></td><td>${statusTag(r.statusi)}</td><td>${r.pergjigja?esc(String(r.pergjigja).slice(0,62)):'Në pritje të përgjigjes'}</td><td><button type="button" class="row-action" data-request-detail="${r.id}">Hap</button></td></tr>`).join('') || noData(6,'Nuk ke dërguar ende kërkesa te Drejtori.');
        tbody.querySelectorAll('[data-request-detail]').forEach(b=>b.addEventListener('click',()=>{
            const r=allRequests.find(x=>x.id===Number(b.dataset.requestDetail));
            if(!r)return;
            markResponse(r.id);
            if (r.statusi!=='ne_shqyrtim') {updateBadges();}
            openDialog(r.titulli,`<div class="request-detail-grid"><strong>Lloji</strong><span>${esc(r.lloji)}</span><strong>Statusi</strong><span>${statusTag(r.statusi)}</span><strong>Data</strong><span>${formatDate(r.krijuar_me)}</span><strong>Shpjegimi</strong><span class="dialog-detail">${esc(r.pershkrimi)}</span><strong>Përgjigjja</strong><span class="dialog-detail">${esc(r.pergjigja||'Në pritje të përgjigjes nga Drejtori.')}</span></div>`);
        }));
        updateBadges();
    }
    async function refreshRequests() {
        try {allRequests = await api('/api/mesimdhenesi/kerkesat/');renderRequests();setMessage('');}
        catch(e){setMessage(e.message);}
    }
    async function openRequest(type) {
        const title = ({perjashtim:'Propozim mase disiplinore',leje:'Kërkesë për leje',sqarim:'Kërkesë për sqarim'})[type];
        let body=`<form class="dialog-form" id="new-request"><label for="req-title">Titulli</label><input id="req-title" type="text" minlength="5" maxlength="180" required><label for="req-explanation">Shpjegimi i kërkesës</label><textarea id="req-explanation" minlength="12" rows="4" required></textarea>`;
        if(type==='perjashtim') {
            const choices = state.klasat.filter(c=>assignmentList(c.id).length||c.kujdestar);
            body+=`<label for="req-class">Klasa e nxënësit</label><select id="req-class">${choices.map(c=>`<option value="${c.id}">${esc(c.emri)}</option>`).join('')}</select><label for="req-student">Nxënësi</label><select id="req-student" required></select>`;
        }
        if(type!=='sqarim')body+=`<label for="req-from">Nga data</label><input id="req-from" type="date" ${type==='perjashtim'?'required':''}><label for="req-to">Deri më</label><input id="req-to" type="date" ${type==='perjashtim'?'required':''}>`;
        body+='<p class="dialog-meta">Kërkesa shkon te Drejtori. Asnjë masë disiplinore nuk zbatohet automatikisht.</p><button class="btn gold" type="submit">Dërgo kërkesën</button></form>';
        openDialog(title,body,()=>{
            if($('req-from'))$('req-from').value=dateToday();
            if($('req-to'))$('req-to').value=dateToday();
            if(type==='perjashtim'){
                const fill=async()=>{
                    const cls=$('req-class').value;
                    $('req-student').innerHTML='<option value="">Duke ngarkuar...</option>';
                    try {
                        const d=await api(`/api/mesimdhenesi/panel/?klasa=${encodeURIComponent(cls)}`);
                        $('req-student').innerHTML=d.nxenesit.map(n=>`<option value="${n.id}">${esc(n.emri)}</option>`).join('')||'<option value="">Nuk ka nxënës</option>';
                    } catch(err){dialogError(err.message);}
                };
                $('req-class').addEventListener('change',fill);
                if($('req-class').value)fill();
            }
            $('new-request').addEventListener('submit',async e=>{
                e.preventDefault();
                const button=e.currentTarget.querySelector('button');
                const payload={lloji:type,titulli:$('req-title').value.trim(),pershkrimi:$('req-explanation').value.trim()};
                if(type!=='sqarim'){
                    payload.data_nga=$('req-from').value;
                    payload.data_deri=$('req-to').value;
                }
                if(type==='perjashtim'){
                    const student=Number($('req-student').value);
                    if(!student){dialogError('Zgjidh nxënësin e klasës përkatëse.');return;}
                    payload.nxenesi=student;
                }
                button.disabled=true;
                try {await api('/api/mesimdhenesi/kerkesat/','POST',payload);dialog.close();await refreshRequests();}
                catch(err){dialogError(err.message);}finally{button.disabled=false;}
            });
        });
    }
    async function initPage() {
        const qp = new URLSearchParams(location.search);
        let requested = qp.get('klasa');
        if (requested && !/^\d+$/.test(requested)) requested = null;
        await loadSnapshot(requested);
        if (page==='panel') renderHome();
        if (page==='klasat') {
            const teach=classList();
            if(teach.length && !teach.some(x=>x.id===chosenClass))await loadSnapshot(teach[0].id);
            renderClasses();
            $('class-record-absence').addEventListener('click',recordAbsence);
            $('class-view-all').addEventListener('click',showAllClassStudents);
        }
        if (page==='notat') {
            if (state.angazhimet.length){
                const id = requested ? state.angazhimet.find(a=>String(a.klasa_id)===requested)?.klasa_id : state.angazhimet[0].klasa_id;
                if(id)await loadSnapshot(id);
            }
            renderGrades();
            $('grade-assignment').addEventListener('change',gradeAssignmentChange);
            $('grade-form').addEventListener('submit',saveGrade);
        }
        if (page==='klasa-ime') {
            const tutors=tutorList();
            if(tutors.length && !tutors.some(x=>x.id===chosenClass))await loadSnapshot(tutors[0].id);
            renderTutor();
            $('tutor-class-select').addEventListener('change',async e=>{
                try{await loadClass(Number(e.target.value),renderTutor);}catch(err){setMessage(err.message);}
            });
            $('tutor-show-grades').addEventListener('click',()=>showGrades());
            $('tutor-record-absence').addEventListener('click',recordAbsence);
            $('tab-tutor-students').addEventListener('click',()=>showTutorDetails('students'));
            $('tab-tutor-absences').addEventListener('click',()=>showTutorDetails('absences'));
            $('abs-student-filter').addEventListener('change',renderAbsenceRows);
            $('abs-status-filter').addEventListener('change',renderAbsenceRows);
        }
        if (page==='vendimet') {
            renderDecisions();
            $('decision-refresh').addEventListener('click',refreshDecisions);
        }
        if (page==='kerkesat') {
            await refreshRequests();
            document.querySelectorAll('[data-open-request]').forEach(b=>b.addEventListener('click',()=>openRequest(b.dataset.openRequest)));
            $('requests-refresh').addEventListener('click',refreshRequests);
        }
        setInterval(async()=>{
            try {
                const d=await api('/api/mesimdhenesi/panel/');
                state.vendimet=d.vendimet;
                state.kerkesat=d.kerkesat;
                updateBadges();
                if(page==='vendimet')renderDecisions();
            }catch{}
        },60000);
    }
    try {await initPage();}catch(error){setMessage(error.message || 'Paneli nuk u ngarkua.');}
});
