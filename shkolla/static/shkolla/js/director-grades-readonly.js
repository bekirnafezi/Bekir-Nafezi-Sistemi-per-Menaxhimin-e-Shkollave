(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    let classes = [];
    let students = [];
    let rows = [];
    let requestVersion = 0;

    function presentNumber(value) {
        return value === null || value === undefined ? '—' : Number(value).toFixed(2);
    }
    function presentDate(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
        const [y,m,d] = value.split('-');
        return `${d}.${m}.${y}`;
    }
    function createCell(row, value, isGrade) {
        const cell = document.createElement('td');
        if (isGrade) {
            const chip = document.createElement('span');
            chip.className = 'grade-mark';
            chip.textContent = value;
            cell.append(chip);
        } else {
            cell.textContent = value;
        }
        row.append(cell);
    }
    function renderRows(target, records, emptyText) {
        target.replaceChildren();
        if (!records.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 6;
            td.className = 'grades-empty';
            td.textContent = emptyText;
            tr.append(td);
            target.append(tr);
            return;
        }
        for (const item of records) {
            const tr = document.createElement('tr');
            createCell(tr, item.nxenesi);
            createCell(tr, item.klasa);
            createCell(tr, item.lenda);
            createCell(tr, String(item.nota), true);
            createCell(tr, presentDate(item.data));
            createCell(tr, item.mesimdhenesi);
            target.append(tr);
        }
    }
    function fillSelect(select, items, key, label) {
        const previous = select.value;
        select.replaceChildren();
        const option = new Option(label, '');
        select.add(option);
        for (const item of items) select.add(new Option(item.emri, String(item[key])));
        if (items.some(item => String(item[key]) === previous)) select.value = previous;
    }
    function fillStudents() {
        const selectedClass = $('grades-class').value;
        const selected = students.filter(student => !selectedClass || String(student.klasa_id) === selectedClass);
        fillSelect($('grades-student'), selected, 'id', 'Të gjithë nxënësit');
    }
    function setStatus(message, error = false) {
        $('grades-status').textContent = error ? message : '';
        $('grades-status').hidden = !error;
        $('grades-status').classList.toggle('error', error);
    }
    async function fetchData() {
        const version = ++requestVersion;
        const token = sessionStorage.getItem('schoolControlToken');
        const role = sessionStorage.getItem('schoolControlRole');
        if (!token || (role && role !== 'drejtor')) {
            window.location.assign('/drejtori/hyrje/');
            return;
        }
        setStatus('Duke ngarkuar notat...');
        const params = new URLSearchParams();
        const selectedClass = $('grades-class').value;
        const selectedStudent = $('grades-student').value;
        if (selectedClass) params.set('klasa', selectedClass);
        if (selectedStudent) params.set('nxenesi', selectedStudent);
        const url = '/api/drejtori/notat-pasqyra/' + (params.size ? '?' + params : '');
        try {
            const response = await fetch(url, { headers: { Authorization: `Token ${token}` }, cache: 'no-store' });
            let data;
            try { data = await response.json(); } catch { throw new Error('Përgjigjja nga serveri nuk është e vlefshme.'); }
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) throw new Error('Nuk ke qasje në pasqyrën e notave. Kontrollo hyrjen si Drejtor.');
                throw new Error(data.gabim || 'Nuk mund të ngarkohen notat.');
            }
            if (version !== requestVersion) return;
            classes = data.klasat || [];
            students = data.nxenesit || [];
            rows = data.notat || [];
            fillSelect($('grades-class'), classes, 'id', 'Të gjitha klasat');
            fillStudents();
            const s = data.statistika || {};
            $('grades-school-avg').textContent = presentNumber(s.mesatarja_shkollore);
            $('grades-class-avg').textContent = presentNumber(s.mesatarja_klases);
            $('grades-student-avg').textContent = presentNumber(s.mesatarja_nxenesit);
            $('grades-count').textContent = s.nota_ne_perzgjedhje ?? rows.length;
            renderRows($('grades-preview'), rows.slice(0, 5), 'Nuk ka nota për këtë përzgjedhje.');
            renderRows($('grades-all'), rows, 'Nuk ka nota për këtë përzgjedhje.');
            $('grades-modal-count').textContent = `Gjithsej ${rows.length} nota në përzgjedhjen aktuale`;
            setStatus('');
        } catch (error) {
            if (version !== requestVersion) return;
            setStatus(error.message || 'Gabim gjatë ngarkimit.', true);
            renderRows($('grades-preview'), [], 'Nuk mund të shfaqen notat.');
            renderRows($('grades-all'), [], 'Nuk mund të shfaqen notat.');
        }
    }
    document.addEventListener('DOMContentLoaded', () => {
        if (!$('director-grades-page')) return;
        $('grades-class').addEventListener('change', () => {
            fillStudents();
            $('grades-student').value = '';
            fetchData();
        });
        $('grades-student').addEventListener('change', fetchData);
        $('grades-reset').addEventListener('click', () => {
            $('grades-class').value = '';
            fillStudents();
            $('grades-student').value = '';
            fetchData();
        });
        const dialog = $('grades-modal');
        $('grades-open-all').addEventListener('click', () => dialog.showModal());
        $('grades-close-all').addEventListener('click', () => dialog.close());
        fetchData();
    });
})();
