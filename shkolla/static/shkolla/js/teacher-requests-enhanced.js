document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.teacherPage !== 'kerkesat') return;

    const tbody = document.getElementById('requests-table');
    const header = tbody?.closest('.surface')?.querySelector('.surface-title');
    const refresh = document.getElementById('requests-refresh');
    if (!tbody || !header || !refresh) return;

    const css = document.createElement('style');
    css.textContent = `
        .requests-actions { display:flex; flex-wrap:wrap; align-items:center; justify-content:flex-end; gap:10px; }
        .requests-show-all { border:1px solid #d69f3c; border-radius:11px; padding:11px 15px;
            background:linear-gradient(125deg,#ffe095,#ecb64d);color:#073962; font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap; }
        .requests-show-all:disabled { opacity:.55;cursor:default; }
        .requests-show-all:focus-visible, .requests-view-dialog button:focus-visible,
        .requests-view-dialog input:focus-visible {outline:3px solid #f0b73c;outline-offset:3px;}
        .requests-view-dialog { border:1px solid #e3c17b; border-radius:20px; padding:0;
            width:min(1050px,calc(100vw - 32px));max-width:none; max-height:min(80vh,850px);
            background:#fff;box-shadow:0 22px 70px #001d4270; color:#123c66; }
        .requests-view-dialog::backdrop {background:rgba(3,24,50,.63);backdrop-filter:blur(3px);}
        .requests-view-layout {display:flex;flex-direction:column; min-height:0; max-height:min(80vh,850px);}
        .requests-view-top {display:flex;align-items:center;justify-content:space-between;gap:12px;
            background:linear-gradient(110deg,#073965,#0b548d);color:white;padding:18px 22px;}
        .requests-view-top h2 {margin:0;font-size:21px;color:#fff;}
        .requests-view-close {background:#ffe5ae;border:0;border-radius:10px;color:#12416e;
            font-size:20px;font-weight:800;width:39px;height:39px;cursor:pointer;}
        .requests-view-tools {padding:15px 20px;border-bottom:1px solid #dbe6f0;display:flex;gap:12px;
            align-items:center;justify-content:space-between;flex-wrap:wrap;}
        .requests-view-tools input {width:min(350px,100%);padding:10px 12px;border:1px solid #d6dfeb;
            border-radius:10px;font:inherit;font-size:13px;color:#123e69;}
        .requests-view-total {font-size:13px;color:#537391;}
        .requests-view-scroll {overflow:auto;min-height:0;flex:1;scrollbar-width:thin;}
        .requests-view-scroll table {min-width:760px;width:100%;border-collapse:collapse;font-size:12px;}
        .requests-view-scroll th {position:sticky;top:0;background:#e7f1fa;z-index:1;color:#15456b;}
        .requests-view-scroll td,.requests-view-scroll th {padding:12px 13px;text-align:left;
            border-bottom:1px solid #e8eef5;vertical-align:middle;}
        .requests-view-scroll tbody tr:nth-child(even) {background:#f7fbff;}
        .requests-view-empty {padding:18px;color:#587997;font-size:13px;}
        @media(max-width:780px) {.requests-actions{justify-content:flex-start;}
            .requests-view-top{padding:13px 16px;}.requests-view-top h2{font-size:17px;}}
    `;
    document.head.appendChild(css);

    const actions = document.createElement('div');
    actions.className = 'requests-actions';
    const showAll = document.createElement('button');
    showAll.type = 'button';
    showAll.className = 'requests-show-all';
    showAll.textContent = 'Shiko të gjitha kërkesat';
    showAll.disabled = true;
    refresh.replaceWith(actions);
    actions.append(showAll, refresh);

    const modal = document.createElement('dialog');
    modal.className = 'requests-view-dialog';
    modal.setAttribute('aria-labelledby','requests-view-title');
    modal.innerHTML = `
        <div class="requests-view-layout">
            <div class="requests-view-top">
                <h2 id="requests-view-title">Të gjitha kërkesat</h2>
                <button type="button" class="requests-view-close" aria-label="Mbyll dritaren">×</button>
            </div>
            <div class="requests-view-tools">
                <input type="search" id="requests-view-search" placeholder="Kërko sipas titullit ose statusit..." aria-label="Kërko kërkesa">
                <span class="requests-view-total" id="requests-view-total"></span>
            </div>
            <div class="requests-view-scroll" id="requests-view-list"></div>
        </div>
    `;
    document.body.appendChild(modal);
    const list = modal.querySelector('#requests-view-list');
    const search = modal.querySelector('#requests-view-search');
    const total = modal.querySelector('#requests-view-total');
    modal.querySelector('.requests-view-close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => {if (e.target === modal) modal.close();});

    const realRows = () => Array.from(tbody.querySelectorAll('tr')).filter(row => row.querySelector('[data-request-detail]'));

    function updatePreview() {
        const rows = realRows();
        rows.forEach((row, index) => {row.style.display = index < 3 ? '' : 'none';});
        showAll.disabled = !rows.length;
        showAll.textContent = rows.length ? `Shiko të gjitha kërkesat (${rows.length}) →` : 'Shiko të gjitha kërkesat';
    }

    const observer = new MutationObserver(updatePreview);
    observer.observe(tbody, {childList:true});
    updatePreview();

    function fillModal() {
        const original = tbody.closest('table');
        const table = document.createElement('table');
        const head = original.querySelector('thead');
        if (head) table.appendChild(head.cloneNode(true));
        const body = document.createElement('tbody');
        for (const originalRow of realRows()) {
            const clone = originalRow.cloneNode(true);
            clone.style.removeProperty('display');
            body.appendChild(clone);
        }
        table.appendChild(body);
        list.replaceChildren(table);
        search.value = '';
        filterModal();
    }

    function filterModal() {
        const term = search.value.trim().toLocaleLowerCase('sq-AL');
        const rows = Array.from(list.querySelectorAll('tbody tr'));
        let visible = 0;
        for (const row of rows) {
            const match = !term || row.textContent.toLocaleLowerCase('sq-AL').includes(term);
            row.style.display = match ? '' : 'none';
            if (match) visible += 1;
        }
        total.textContent = `${visible} nga ${rows.length} kërkesa`;
    }
    search.addEventListener('input', filterModal);

    list.addEventListener('click', e => {
        const button = e.target.closest('[data-request-detail]');
        if (!button) return;
        const id = button.getAttribute('data-request-detail');
        const original = Array.from(tbody.querySelectorAll('[data-request-detail]')).find(
            el => el.getAttribute('data-request-detail') === id
        );
        if (!original) return;
        modal.close();
        original.click();
    });

    showAll.addEventListener('click', () => {
        if (showAll.disabled) return;
        fillModal();
        modal.showModal();
        search.focus();
    });
});
