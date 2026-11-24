document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('schoolControlToken');
    const header = document.querySelector('.students-table-header');
    if (!token || !header) return;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'subject-new-button';
    addButton.textContent = '+ Shto Lëndë';
    header.appendChild(addButton);

    const dialog = document.createElement('dialog');
    dialog.className = 'subject-assignment-dialog subject-simple-dialog';
    dialog.innerHTML = `
        <div class="subject-assignment-head">
            <h2 id="subject-assignment-title">Shto Lëndë</h2>
            <button type="button" id="subject-assignment-close" aria-label="Mbyll">×</button>
        </div>
        <form id="subject-assignment-form">
            <div class="subject-assignment-field">
                <label for="subject-assignment-name">Emri i lëndës</label>
                <input id="subject-assignment-name" name="emri" maxlength="100" placeholder="p.sh. Biologji" required autocomplete="off">
            </div>
            <p id="subject-assignment-error" role="status" aria-live="polite"></p>
            <div class="subject-assignment-actions">
                <button type="button" id="subject-assignment-cancel">Anulo</button>
                <button type="submit" id="subject-assignment-save">Ruaj Lëndën</button>
            </div>
        </form>
    `;
    document.body.appendChild(dialog);

    const close = dialog.querySelector('#subject-assignment-close');
    const cancel = dialog.querySelector('#subject-assignment-cancel');
    const form = dialog.querySelector('#subject-assignment-form');
    const name = dialog.querySelector('#subject-assignment-name');
    const message = dialog.querySelector('#subject-assignment-error');
    const save = dialog.querySelector('#subject-assignment-save');
    let saving = false;

    addButton.addEventListener('click', () => {
        form.reset();
        message.textContent = '';
        message.style.color = '#b52626';
        dialog.showModal();
        name.focus();
    });
    const closeDialog = () => { if (!saving) dialog.close(); };
    close.addEventListener('click', closeDialog);
    cancel.addEventListener('click', closeDialog);
    dialog.addEventListener('cancel', e => { if (saving) e.preventDefault(); });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (saving) return;
        const emri = name.value.trim();
        if (!emri || emri.length > 100) {
            message.textContent = 'Shkruaj emrin e lëndës (maksimum 100 karaktere).';
            return;
        }
        saving = true;
        save.disabled = true;
        message.style.color = '#486985';
        message.textContent = 'Duke ruajtur...';
        try {
            const response = await fetch('/api/lendet/ligjeruesit/', {
                method: 'POST',
                headers: {
                    Authorization: `Token ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({veprimi: 'krijo_lende', emri})
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 401 || response.status === 403) {
                message.textContent = 'Sesioni ka përfunduar. Hyr përsëri si Drejtor.';
                message.style.color = '#b52626';
                return;
            }
            if (!response.ok) {
                const detail = data.gabim || data.detail || Object.values(data).flat().join(' ');
                throw new Error(detail || 'Lënda nuk u ruajt.');
            }
            message.style.color = '#16734e';
            message.textContent = data.mesazhi || 'Lënda u regjistrua me sukses.';
            setTimeout(() => window.location.reload(), 550);
        } catch (error) {
            message.style.color = '#b52626';
            message.textContent = error.message || 'Nuk u realizua kërkesa.';
        } finally {
            saving = false;
            save.disabled = false;
        }
    });
});
