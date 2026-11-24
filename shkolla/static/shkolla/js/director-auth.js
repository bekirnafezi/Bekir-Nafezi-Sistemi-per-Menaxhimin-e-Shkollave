document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('director-login-form') || document.getElementById('director-register-form');
    const message = document.getElementById('auth-message');
    if (!form || !message) return;

    const register = document.body.dataset.page === 'director-register';
    const field = id => document.getElementById(id).value.trim();
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.textContent;
    const csrf = form.querySelector('input[name=csrfmiddlewaretoken]')?.value || '';

    async function read(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.gabim || data.detail || 'Operacioni nuk u realizua.');
        return data;
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        message.textContent = 'Duke kontrolluar të dhënat...';
        message.classList.remove('success');
        button.disabled = true;
        button.textContent = 'Duke u përpunuar...';

        try {
            let data;
            if (register) {
                if (field('fjalekalimi') !== field('perserit_fjalekalimin')) {
                    throw new Error('Fjalëkalimet nuk përputhen.');
                }
                data = await read(await fetch('/api/drejtori/regjistrohu/', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf},
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        emri: field('emri'),
                        mbiemri: field('mbiemri'),
                        email: field('email'),
                        kodi: field('kodi'),
                        fjalekalimi: document.getElementById('fjalekalimi').value,
                        perserit_fjalekalimin: document.getElementById('perserit_fjalekalimin').value
                    })
                }));
            } else {
                data = await read(await fetch('/api/auth/login/', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf},
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        email: field('email'),
                        password: document.getElementById('password').value,
                        role: 'drejtor'
                    })
                }));
            }

            if (!data.token || !data.perdoruesi || data.perdoruesi.roli !== 'drejtor') {
                throw new Error('Serveri nuk ktheu të dhënat e drejtorit.');
            }

            sessionStorage.setItem('schoolControlToken', data.token);
            sessionStorage.setItem('schoolControlRole', data.perdoruesi.roli);
            sessionStorage.setItem('schoolControlEmail', data.perdoruesi.email);
            message.classList.add('success');
            message.textContent = register ? 'Llogaria u krijua. Po hapet paneli...' : 'Hyrja u realizua me sukses!';
            window.location.assign('/klasat/');
        } catch (error) {
            message.textContent = error.message || 'Nuk mund të lidhemi me serverin.';
        } finally {
            button.disabled = false;
            button.textContent = buttonText;
        }
    });
});
