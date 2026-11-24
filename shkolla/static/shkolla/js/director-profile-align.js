(function () {
    'use strict';

    const API = '/api/drejtori/profili/';
    const PHOTO = '/api/drejtori/foto/';
    const key = 'schoolControlToken';
    let portraitUrl = null;
    let dialogUrl = null;

    function token() { return sessionStorage.getItem(key); }

    async function request(url, method = 'GET', body = null) {
        if (!token()) throw new Error('Nuk je i identifikuar. Hyr perseri si Drejtor.');
        const options = { method, headers: { Authorization: `Token ${token()}` }, cache: 'no-store' };
        if (body) options.body = body;
        const response = await fetch(url, options);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.gabim || payload.detail || `Gabim HTTP ${response.status}`);
        return payload;
    }

    async function fetchPhoto() {
        if (!token()) return null;
        const response = await fetch(PHOTO, { headers: { Authorization: `Token ${token()}` }, cache: 'no-store' });
        if (!response.ok) return null;
        return await response.blob();
    }

    function releaseDialogPhoto() {
        if (dialogUrl) URL.revokeObjectURL(dialogUrl);
        dialogUrl = null;
    }

    function setPortrait(profile, card) {
        const title = card.querySelector('.director-profile-title');
        if (title) title.textContent = profile.emri_i_plote || 'Drejtori';
        const email = card.querySelector('#user-email') || card.querySelector('.director-email-place');
        if (email) email.textContent = profile.email || '';
        if (profile.email) sessionStorage.setItem('schoolControlEmail', profile.email);
    }

    async function loadPortraitPhoto(card, profile) {
        const slot = card.querySelector('.director-portrait');
        if (!slot || !profile.ka_foto) return;
        try {
            const blob = await fetchPhoto();
            if (!blob || !slot.isConnected) return;
            if (portraitUrl) URL.revokeObjectURL(portraitUrl);
            portraitUrl = URL.createObjectURL(blob);
            slot.textContent = '';
            const img = document.createElement('img');
            img.src = portraitUrl;
            img.alt = 'Fotografia e Drejtorit';
            slot.appendChild(img);
            slot.classList.add('director-has-photo');
        } catch (_) {
            return;
        }
    }

    function makeDialog(card) {
        const dialog = document.createElement('dialog');
        dialog.className = 'director-profile-dialog';
        dialog.setAttribute('aria-labelledby', 'dp-title');
        dialog.innerHTML = `
            <div class="dp-head"><h2 id="dp-title">Përditëso profilin</h2><button type="button" class="dp-close" aria-label="Mbyll">×</button></div>
            <form class="dp-form" id="dp-form">
                <div class="dp-field"><label for="dp-first">Emri</label><input id="dp-first" name="emri" autocomplete="given-name" maxlength="150"></div>
                <div class="dp-field"><label for="dp-last">Mbiemri</label><input id="dp-last" name="mbiemri" autocomplete="family-name" maxlength="150"></div>
                <div class="dp-field dp-wide"><label for="dp-email">Emaili</label><input id="dp-email" name="email" type="email" autocomplete="email" maxlength="254" required></div>
                <div class="dp-field dp-wide"><label>Fotografia e profilit</label>
                    <div class="dp-photo-row"><span id="dp-photo-empty" class="dp-photo-preview dp-photo-placeholder" aria-hidden="true">👤</span>
                    <img id="dp-photo-preview" class="dp-photo-preview" alt="Fotografia e profilit" hidden>
                    <div class="dp-photo-input"><input type="file" id="dp-photo" name="foto" accept="image/jpeg,image/png,image/webp"><p class="dp-hint">JPG, PNG, WebP · maksimumi 3 MB</p></div></div>
                </div>
                <label class="dp-remove dp-wide"><input type="checkbox" id="dp-remove-photo"> Hiq fotografinë aktuale</label>
                <div class="dp-field dp-wide"><label for="dp-password">Fjalëkalimi aktual (vetëm kur ndryshon emailin)</label><input id="dp-password" type="password" autocomplete="current-password"></div>
                <p id="dp-status" class="dp-error" role="status" aria-live="polite"></p>
                <div class="dp-actions"><button type="button" class="dp-cancel">Anulo</button><button type="submit" class="dp-save">Ruaj ndryshimet</button></div>
            </form>`;
        document.body.appendChild(dialog);

        const $ = selector => dialog.querySelector(selector);
        const form = $('#dp-form');
        const status = $('#dp-status');
        const save = $('.dp-save');
        let originalEmail = '';

        function showStatus(message, good = false) {
            status.textContent = message || '';
            status.classList.toggle('ok', good);
        }
        function clearPreview() {
            releaseDialogPhoto();
            $('#dp-photo-preview').hidden = true;
            $('#dp-photo-preview').removeAttribute('src');
            $('#dp-photo-empty').hidden = false;
        }
        function showPreview(blob) {
            clearPreview();
            dialogUrl = URL.createObjectURL(blob);
            $('#dp-photo-preview').src = dialogUrl;
            $('#dp-photo-preview').hidden = false;
            $('#dp-photo-empty').hidden = true;
        }
        function closeDialog() { dialog.close(); clearPreview(); }
        $('.dp-close').addEventListener('click', closeDialog);
        $('.dp-cancel').addEventListener('click', closeDialog);
        dialog.addEventListener('close', clearPreview);
        dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'director-profile-edit-button';
        trigger.textContent = '✎';
        trigger.title = 'Përditëso profilin';
        trigger.setAttribute('aria-label', 'Përditëso profilin');
        card.appendChild(trigger);

        trigger.addEventListener('click', async () => {
            form.reset();
            clearPreview();
            showStatus('Duke ngarkuar profilin...');
            save.disabled = true;
            dialog.showModal();
            try {
                const profile = await request(API);
                originalEmail = profile.email || '';
                $('#dp-first').value = profile.emri || '';
                $('#dp-last').value = profile.mbiemri || '';
                $('#dp-email').value = originalEmail;
                if (profile.ka_foto) {
                    const blob = await fetchPhoto();
                    if (blob && dialog.open) showPreview(blob);
                }
                showStatus('');
                save.disabled = false;
            } catch (error) {
                showStatus(error.message);
            }
        });

        $('#dp-photo').addEventListener('change', event => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                showStatus('Zgjidh JPG, PNG ose WebP nen 3 MB.');
                event.target.value = '';
                return;
            }
            $('#dp-remove-photo').checked = false;
            showPreview(file);
            showStatus('');
        });
        $('#dp-remove-photo').addEventListener('change', event => {
            if (event.target.checked) {
                $('#dp-photo').value = '';
                clearPreview();
            }
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            const email = $('#dp-email').value.trim().toLowerCase();
            if (email !== originalEmail.toLowerCase() && !$('#dp-password').value) {
                showStatus('Shkruaj fjalëkalimin aktual për të ndryshuar emailin.');
                $('#dp-password').focus();
                return;
            }
            const data = new FormData();
            data.append('emri', $('#dp-first').value.trim());
            data.append('mbiemri', $('#dp-last').value.trim());
            data.append('email', email);
            if ($('#dp-password').value) data.append('fjalekalimi_aktual', $('#dp-password').value);
            const file = $('#dp-photo').files && $('#dp-photo').files[0];
            if (file) data.append('foto', file);
            if ($('#dp-remove-photo').checked) data.append('hiq_foton', 'true');
            save.disabled = true;
            showStatus('Duke ruajtur ndryshimet...');
            try {
                const result = await request(API, 'PATCH', data);
                setPortrait(result.profili, card);
                showStatus(result.mesazhi || 'Profili u ruajt me sukses.', true);
                setTimeout(() => window.location.reload(), 650);
            } catch (error) {
                save.disabled = false;
                showStatus(error.message);
            }
        });
    }

    async function initialize() {
        const card = document.querySelector('.app-container > .sidebar .director-profile-card');
        if (!card || card.querySelector('.director-profile-edit-button')) return;
        const school = card.querySelector('.director-profile-school');
        if (school) school.remove();
        makeDialog(card);
        try {
            const profile = await request(API);
            if (card.isConnected) {
                setPortrait(profile, card);
                await loadPortraitPhoto(card, profile);
            }
        } catch (_) {
            return;
        }
    }

    function start() {
        initialize();
        if (!document.querySelector('.director-profile-card')) setTimeout(initialize, 200);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    window.addEventListener('beforeunload', () => {
        if (portraitUrl) URL.revokeObjectURL(portraitUrl);
        releaseDialogPhoto();
    });
})();
