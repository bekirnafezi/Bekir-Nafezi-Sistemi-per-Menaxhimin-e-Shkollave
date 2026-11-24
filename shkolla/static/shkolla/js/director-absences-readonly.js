(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    let students = [];
    let currentRows = [];
    let sequence = 0;

    const names = {
        e_arsyeshme: 'E arsyeshme',
        e_paarsyeshme: 'E paarsyeshme',
        ne_shqyrtim: 'Në shqyrtim'
    };

    function formatDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '—';
        const [year, month, day] = value.split('-');
        return `${day}.${month}.${year}`;
    }

    function cell(tr, value, className = '') {
        const td = document.createElement('td');
        if (className) td.className = className;
        td.textContent = String(value ?? '—');
        tr.append(td);
        return td;
    }

    function showRows(rows) {
        const target = $('absence-all');
        target.replaceChildren();
        if (!rows.length) {
            const tr = document.createElement('tr');
            const td = cell(tr, 'Nuk ka mungesa për këtë përzgjedhje.', 'absences-empty');
            td.colSpan = 7;
            target.append(tr);
            return;
        }
        for (const absence of rows) {
            const tr = document.createElement('tr');
            cell(tr, absence.nxenesi);
            cell(tr, absence.klasa);
            cell(tr, formatDate(absence.data));
            cell(tr, absence.ora_mesimore ?? '—');
            cell(tr, absence.lenda);
            const status = cell(tr, names[absence.statusi] || absence.statusi);
            const classMap = {
                e_arsyeshme: 'absence-good',
                e_paarsyeshme: 'absence-bad',
                ne_shqyrtim: 'absence-pending'
            };
            status.className = classMap[absence.statusi] || '';
            cell(tr, absence.arsyetimi || '—', 'absence-reason');
            target.append(tr);
        }
    }

    function fillSelect(select, list, placeholder) {
        const previous = select.value;
        select.replaceChildren();
        select.add(new Option(placeholder, ''));
        for (const item of list) select.add(new Option(item.emri, String(item.id)));
        if (list.some(item => String(item.id) === previous)) select.value = previous;
    }

    function fillStudents() {
        const classId = $('absence-class').value;
        const filtered = students.filter(student => !classId || String(student.klasa_id) === classId);
        fillSelect($('absence-student'), filtered, 'Të gjithë nxënësit');
    }

    function reportError(message = '') {
        const target = $('absence-error');
        target.textContent = message;
        target.hidden = !message;
    }

    async function reload() {
        const version = ++sequence;
        const token = sessionStorage.getItem('schoolControlToken');
        const role = sessionStorage.getItem('schoolControlRole');
        if (!token || (role && role !== 'drejtor')) {
            window.location.assign('/drejtori/hyrje/');
            return;
        }
        reportError();
        $('absence-open-all').disabled = true;
        const params = new URLSearchParams();
        for (const [id, key] of [
            ['absence-class', 'klasa'],
            ['absence-student', 'nxenesi'],
            ['absence-status-filter', 'statusi']
        ]) {
            if ($(id).value) params.set(key, $(id).value);
        }
        const endpoint = '/api/drejtori/mungesat-pasqyra/' + (params.size ? '?' + params.toString() : '');
        try {
            const response = await fetch(endpoint, {
                headers: {Authorization: `Token ${token}`},
                cache: 'no-store'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.gabim || 'Nuk mund të ngarkohen mungesat.');
            if (version !== sequence) return;
            students = data.nxenesit || [];
            currentRows = data.mungesat || [];
            fillSelect($('absence-class'), data.klasat || [], 'Të gjitha klasat');
            fillStudents();
            const stats = data.statistika || {};
            $('absence-total').textContent = stats.gjithsej ?? 0;
            $('absence-justified').textContent = stats.e_arsyeshme ?? 0;
            $('absence-unjustified').textContent = stats.e_paarsyeshme ?? 0;
            $('absence-pending').textContent = stats.ne_shqyrtim ?? 0;
            $('absence-modal-count').textContent = `Gjithsej ${currentRows.length} mungesa në përzgjedhjen aktuale`;
            showRows(currentRows);
        } catch (error) {
            if (version !== sequence) return;
            currentRows = [];
            reportError(error.message || 'Gabim gjatë ngarkimit.');
            $('absence-modal-count').textContent = 'Të dhënat nuk u ngarkuan.';
            showRows([]);
        } finally {
            if (version === sequence) $('absence-open-all').disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!$('director-absences-page')) return;
        const modal = $('absence-modal');
        $('absence-class').addEventListener('change', () => {
            fillStudents();
            $('absence-student').value = '';
            reload();
        });
        $('absence-student').addEventListener('change', reload);
        $('absence-status-filter').addEventListener('change', reload);
        $('absence-reset').addEventListener('click', () => {
            $('absence-class').value = '';
            fillStudents();
            $('absence-student').value = '';
            $('absence-status-filter').value = '';
            reload();
        });
        $('absence-open-all').addEventListener('click', () => modal.showModal());
        $('absence-close-all').addEventListener('click', () => modal.close());
        modal.addEventListener('click', event => {
            if (event.target === modal) modal.close();
        });
        reload();
    });
})();
