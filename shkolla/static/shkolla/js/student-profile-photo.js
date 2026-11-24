(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const button = $('student-edit-profile');
  if (!button) return;
  const dialog = $('student-photo-dialog');
  const form = $('student-photo-form');
  const input = $('student-photo-input');
  const preview = $('student-photo-preview');
  const fallback = $('student-photo-preview-fallback');
  const error = $('student-photo-error');
  const save = $('student-photo-save');
  const endpoint = '/api/nxenesi/foto/';
  const token = () => sessionStorage.getItem('schoolControlToken');
  let currentUrl = null;
  let previewUrl = null;
  let busy = false;
  const headers = () => ({Authorization: `Token ${token()}`});
  function showPreview(url) {
    preview.hidden = !url;
    fallback.hidden = !!url;
    if (url) preview.src = url;
    else preview.removeAttribute('src');
  }
  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    input.value = '';
    showPreview(currentUrl);
  }
  async function loadPhoto() {
    if (!token()) return;
    const res = await fetch(endpoint, {headers: headers(), cache: 'no-store'});
    if (res.status === 404) return;
    if (!res.ok) throw new Error('Fotografia nuk u ngarkua.');
    const url = URL.createObjectURL(await res.blob());
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = url;
    const avatar = $('student-avatar');
    avatar.src = url;
    avatar.hidden = false;
    $('student-avatar-fallback').hidden = true;
    if (!previewUrl) showPreview(url);
  }
  button.addEventListener('click', () => {
    error.textContent = '';
    clearPreview();
    dialog.showModal();
  });
  $('student-photo-close').addEventListener('click', () => {if (!busy) dialog.close();});
  $('student-photo-cancel').addEventListener('click', () => {if (!busy) dialog.close();});
  dialog.addEventListener('cancel', e => {if (busy) e.preventDefault();});
  dialog.addEventListener('close', clearPreview);
  input.addEventListener('change', () => {
    error.textContent = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    const file = input.files[0];
    if (!file) {showPreview(currentUrl);return;}
    if (file.size > 3 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
      error.textContent = 'Zgjidh JPG, PNG ose WebP, maksimumi 3 MB.';
      clearPreview();return;
    }
    previewUrl = URL.createObjectURL(file);
    showPreview(previewUrl);
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!input.files.length || busy) return;
    busy = true;save.disabled = true;input.disabled = true;error.textContent = '';
    const data = new FormData();data.append('foto', input.files[0]);
    try {
      const res = await fetch(endpoint, {method:'POST',headers:headers(),body:data});
      const result = await res.json();
      if (!res.ok) throw new Error(result.gabim || 'Fotografia nuk u ruajt.');
      await loadPhoto();
      dialog.close();
    } catch (err) {error.textContent = err.message;}
    finally {busy = false;save.disabled = false;input.disabled = false;}
  });
  loadPhoto().catch(() => {});
})();
