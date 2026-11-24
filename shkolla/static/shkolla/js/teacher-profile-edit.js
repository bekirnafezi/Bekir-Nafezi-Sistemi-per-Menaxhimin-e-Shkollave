document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.portal-profile');
    const token = sessionStorage.getItem('schoolControlToken');
    const role = sessionStorage.getItem('schoolControlRole');
    if (!sidebar || !token || role !== 'mesimdhenes') return;

    const styles = document.createElement('style');
    styles.textContent = `
        .profile-edit-trigger {
            position:absolute;top:11px;right:11px;z-index:5;
            width:32px;height:32px;display:grid;place-items:center;
            border:1px solid #e9c66f99;border-radius:10px;
            color:#ffdc87;background:#ffffff13;font-size:17px;
            cursor:pointer;transition:background .15s ease;
        }
        .profile-edit-trigger:hover,.profile-edit-trigger:focus-visible {
            background:#ffffff38;outline:2px solid #f3d184;
        }
        .profile-edit-dialog {
            width:min(480px,calc(100vw - 26px));max-height:90dvh;
            padding:0;border:1px solid #e8c774;border-radius:21px;
            background:#fff;color:#153c62;overflow:auto;
            box-shadow:0 20px 85px #001b3d88;
        }
        .profile-edit-dialog::backdrop{background:#061e3caa;backdrop-filter:blur(2px)}
        .profile-edit-top{
            display:flex;align-items:center;justify-content:space-between;gap:12px;
            background:linear-gradient(105deg,#073362,#0c5695);
            color:#fff;padding:15px 19px;
        }
        .profile-edit-top h2{font-size:18px;margin:0;color:#fff}
        .profile-edit-close{background:transparent;border:0;color:#fff;font-size:24px;cursor:pointer}
        .profile-edit-form{padding:18px 21px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px 13px}
        .profile-edit-field{display:grid;gap:5px;min-width:0}
        .profile-edit-field.full{grid-column:1/-1}
        .profile-edit-field label{font-size:12px;font-weight:750;color:#8a641d}
        .profile-edit-field input,.profile-edit-field select {
            width:100%;min-width:0;padding:10px 11px;border:1px solid #dfcba4;
            border-radius:10px;background:#fffdf9;color:#173e64;font-size:13px;
        }
        .profile-edit-field input:focus,.profile-edit-field select:focus{outline:2px solid #efc263;outline-offset:1px}
        .profile-edit-field input[readonly]{background:#f2f6fa;color:#657e94}
        .profile-edit-photo-row{display:flex;align-items:center;gap:13px}
        .profile-edit-photo-preview{width:60px;height:60px;flex-shrink:0;object-fit:cover;border:3px solid #eec163;border-radius:50%;background:#edf5fc}
        .profile-edit-photo-empty{width:60px;height:60px;flex-shrink:0;display:grid;place-items:center;border:3px solid #eec163;border-radius:50%;background:#edf5fc;font-size:27px}
        .profile-edit-photo-input{min-width:0;flex:1}
        .profile-edit-photo-row input[type=file]{width:100%;font-size:12px;padding:6px}
        .profile-edit-remove{display:flex;gap:7px;align-items:center;color:#526f88;font-size:12px}
        .profile-edit-hint{font-size:11px;color:#68849b;margin:0;line-height:1.35}
        .profile-edit-footer{grid-column:1/-1;display:flex;justify-content:flex-end;gap:10px}
        .profile-edit-cancel,.profile-edit-save{border:0;border-radius:10px;padding:11px 16px;font-weight:750;font-size:12px;cursor:pointer}
        .profile-edit-cancel{background:#eaf2f9;color:#23527a}
        .profile-edit-save{background:linear-gradient(125deg,#ffe099,#e8b14e);color:#143b62}
        .profile-edit-save:disabled{opacity:.55;cursor:not-allowed}
        .profile-edit-status{grid-column:1/-1;margin:0;font-size:12px;color:#a0322a;min-height:0}
        .profile-edit-status.success{color:#13734b}
        @media(max-width:540px){.profile-edit-form{grid-template-columns:1fr}.profile-edit-field.full,.profile-edit-footer,.profile-edit-status{grid-column:1}}
    `;
    document.head.appendChild(styles);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'profile-edit-trigger';
    trigger.textContent = '✎';
    trigger.title = 'Përditëso profilin';
    trigger.setAttribute('aria-label', 'Përditëso profilin');
    sidebar.appendChild(trigger);

    const modal = document.createElement('dialog');
    modal.className = 'profile-edit-dialog';
    modal.setAttribute('aria-labelledby','profile-edit-title');
    modal.innerHTML = `
        <div class="profile-edit-top">
            <h2 id="profile-edit-title">Përditëso profilin</h2>
            <button type="button" class="profile-edit-close" aria-label="Mbyll">×</button>
        </div>
        <form class="profile-edit-form" id="profile-edit-form">
            <div class="profile-edit-field"><label for="profile-edit-first">Emri</label><input id="profile-edit-first" name="emri" maxlength="150" required></div>
            <div class="profile-edit-field"><label for="profile-edit-last">Mbiemri</label><input id="profile-edit-last" name="mbiemri" maxlength="150" required></div>
            <div class="profile-edit-field full"><label for="profile-edit-email">Emaili</label><input id="profile-edit-email" name="email" type="email" maxlength="254" required></div>
            <div class="profile-edit-field"><label for="profile-edit-phone">Numri i telefonit</label><input id="profile-edit-phone" name="telefoni" type="tel" maxlength="30"></div>
            <div class="profile-edit-field"><label for="profile-edit-id">ID shkollore</label><input id="profile-edit-id" readonly></div>
            <div class="profile-edit-field full"><label for="profile-edit-subject">Lënda e preferuar</label><select id="profile-edit-subject" name="lenda_preferuar"><option value="">Pa lëndë të përzgjedhur</option></select></div>
            <p class="profile-edit-field full profile-edit-hint">Ndryshimi i lëndës së preferuar nuk ndryshon klasat dhe angazhimet që i ka caktuar Drejtori.</p>
            <div class="profile-edit-field full">
                <label for="profile-edit-photo">Fotografia e profilit</label>
                <div class="profile-edit-photo-row">
                    <span class="profile-edit-photo-empty" id="profile-edit-empty" aria-hidden="true">👨‍🏫</span>
                    <img class="profile-edit-photo-preview" id="profile-edit-preview" alt="Fotografia aktuale" hidden>
                    <div class="profile-edit-photo-input"><input id="profile-edit-photo" name="foto" type="file" accept="image/jpeg,image/png,image/webp"><p class="profile-edit-hint">JPG, PNG ose WebP · maksimumi 3 MB</p></div>
                </div>
            </div>
            <label class="profile-edit-field full profile-edit-remove"><input type="checkbox" id="profile-edit-remove-photo" style="width:auto"> Hiq fotografinë aktuale</label>
            <div class="profile-edit-field full"><label for="profile-edit-password">Fjalëkalimi aktual (vetëm nëse ndryshon emailin)</label><input id="profile-edit-password" type="password" autocomplete="current-password" placeholder="Shkruaje vetëm kur ndryshon emailin"></div>
            <p id="profile-edit-status" class="profile-edit-status" role="status" aria-live="polite"></p>
            <div class="profile-edit-footer"><button type="button" class="profile-edit-cancel">Anulo</button><button type="submit" class="profile-edit-save">Ruaj ndryshimet</button></div>
        </form>
    `;
    document.body.appendChild(modal);

    const $ = id => modal.querySelector(`#${id}`);
    const statusEl = $('profile-edit-status');
    const save = modal.querySelector('.profile-edit-save');
    const form = $('profile-edit-form');
    let oldEmail = '';
    let objectUrl = null;

    function info(message, success=false) {
        statusEl.textContent = message || '';
        statusEl.classList.toggle('success', success);
    }
    function cleanupPhoto() {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null;
        $('profile-edit-preview').hidden = true;
        $('profile-edit-preview').removeAttribute('src');
        $('profile-edit-empty').hidden = false;
    }
    function showPhotoBlob(blob) {
        cleanupPhoto();
        objectUrl = URL.createObjectURL(blob);
        $('profile-edit-preview').src = objectUrl;
        $('profile-edit-preview').hidden = false;
        $('profile-edit-empty').hidden = true;
    }
    async function request(url, method='GET', body=null) {
        const options = {method, headers:{Authorization:`Token ${token}`}};
        if (body) options.body = body;
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.gabim || data.detail || `Veprimi dështoi (HTTP ${response.status}).`);
        return data;
    }
    function close() {modal.close();cleanupPhoto();}
    modal.querySelector('.profile-edit-close').addEventListener('click',close);
    modal.querySelector('.profile-edit-cancel').addEventListener('click',close);
    modal.addEventListener('click',event=>{if(event.target===modal)close();});
    modal.addEventListener('close',cleanupPhoto);

    trigger.addEventListener('click',async () => {
        info('Duke ngarkuar profilin...');
        form.reset();
        save.disabled = true;
        modal.showModal();
        try {
            const [profile, subjects] = await Promise.all([
                request('/api/mesimdhenesi/profili/'),
                request('/api/mesimdhenesi/lendet/')
            ]);
            oldEmail = profile.email;
            $('profile-edit-first').value = profile.emri || '';
            $('profile-edit-last').value = profile.mbiemri || '';
            $('profile-edit-email').value = profile.email || '';
            $('profile-edit-phone').value = profile.telefoni || '';
            $('profile-edit-id').value = profile.identifikuesi || '';
            const subjectSelect = $('profile-edit-subject');
            subjectSelect.replaceChildren(new Option('Pa lëndë të përzgjedhur', ''));
            subjects.forEach(s=>subjectSelect.add(new Option(s.emri, String(s.id))));
            subjectSelect.value = profile.lenda_preferuar == null ? '' : String(profile.lenda_preferuar);
            if (profile.ka_foto) {
                const response = await fetch('/api/mesimdhenesi/foto/',{headers:{Authorization:`Token ${token}`}});
                if (response.ok && modal.open) showPhotoBlob(await response.blob());
            }
            info('');
            save.disabled = false;
        } catch(error) {
            info(error.message);
        }
    });

    $('profile-edit-photo').addEventListener('change',event => {
        const photo = event.target.files?.[0];
        if (!photo) return;
        if (photo.size > 3*1024*1024) {info('Fotografia duhet të jetë nën 3 MB.');event.target.value='';return;}
        $('profile-edit-remove-photo').checked = false;
        showPhotoBlob(photo);
    });
    $('profile-edit-remove-photo').addEventListener('change',event => {
        if (event.target.checked) {
            $('profile-edit-photo').value='';
            cleanupPhoto();
        }
    });

    form.addEventListener('submit',async event => {
        event.preventDefault();
        const newEmail = $('profile-edit-email').value.trim().toLowerCase();
        const password = $('profile-edit-password').value;
        if (newEmail !== oldEmail.toLowerCase() && !password) {
            info('Shkruaj fjalëkalimin aktual për të ndryshuar emailin.');
            $('profile-edit-password').focus();
            return;
        }
        const upload = $('profile-edit-photo').files[0];
        if (upload && upload.size > 3*1024*1024) {info('Fotografia duhet të jetë nën 3 MB.');return;}
        const formData = new FormData();
        ['emri','mbiemri','email','telefoni','lenda_preferuar'].forEach(key => {
            formData.append(key, form.elements.namedItem(key).value.trim());
        });
        if (password) formData.append('fjalekalimi_aktual', password);
        if (upload) formData.append('foto', upload);
        if ($('profile-edit-remove-photo').checked) formData.append('hiq_foton','true');
        save.disabled = true;
        info('Duke ruajtur ndryshimet...');
        try {
            const result = await request('/api/mesimdhenesi/profili/', 'PATCH', formData);
            if (oldEmail.toLowerCase() !== result.profili.email.toLowerCase()) {
                const newMail = result.profili.email;
                ['schoolControlTeacherDecisionRead:','schoolControlTeacherResponseRead:'].forEach(prefix => {
                    const oldKey = prefix + oldEmail;
                    const newKey = prefix + newMail;
                    if (localStorage.getItem(oldKey) && !localStorage.getItem(newKey))
                        localStorage.setItem(newKey, localStorage.getItem(oldKey));
                });
            }
            sessionStorage.setItem('schoolControlEmail', result.profili.email);
            info('Profili u përditësua me sukses.',true);
            setTimeout(()=>window.location.reload(),600);
        } catch(error) {
            save.disabled = false;
            info(error.message);
        }
    });
});
