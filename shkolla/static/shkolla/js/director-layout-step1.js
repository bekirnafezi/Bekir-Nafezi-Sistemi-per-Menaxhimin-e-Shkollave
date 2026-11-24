(function () {
    function setup() {
        const app = document.querySelector('.app-container');
        const sidebar = app && app.querySelector(':scope > .sidebar');
        const main = app && app.querySelector(':scope > .main-content');
        const topbar = main && main.querySelector('.topbar');
        const content = main && main.querySelector('.dashboard-content');
        if (!app || !sidebar || !main || !topbar || !content) {
            console.error('School Control: Struktura e dashboard-it nuk përputhet me dizajnin e ri.');
            return;
        }
        if (document.getElementById('director-visual-header')) return;

        document.body.classList.add('director-step1');
        const header = document.createElement('header');
        header.id = 'director-visual-header';
        header.innerHTML = '<a class="director-brand-link" href="/dashboard/" aria-label="School Control - Paneli i Drejtorit"><span class="director-brand-icon" aria-hidden="true">🎓</span><span>SCHOOL <b>CONTROL</b></span></a><div class="director-header-actions"></div>';
        const actions = header.querySelector('.director-header-actions');
        const date = document.getElementById('current-date');
        const logout = document.getElementById('logout-button');
        if (date) actions.appendChild(date);
        if (logout) {
            actions.appendChild(logout);
            logout.textContent = '⏻ Dil nga sistemi';
        }
        app.insertBefore(header, sidebar);

        const profile = document.createElement('section');
        profile.className = 'director-profile-card';
        profile.setAttribute('aria-label', 'Profili i Drejtorit');
        profile.innerHTML = '<div class="director-portrait" aria-hidden="true">👤</div><h2 id="director-profile-name" class="director-profile-title">Drejtori</h2><span class="director-profile-role">Drejtor</span><div class="director-profile-school">🏫 SHFMU “Samidin Emini”</div><div class="director-profile-divider"></div><div class="director-profile-contact"><span class="director-profile-contact-icon" aria-hidden="true">✉</span><span class="director-email-place"></span></div><div class="director-profile-footer"><span aria-hidden="true">✦</span> SCHOOL CONTROL</div>';
        sidebar.appendChild(profile);
        const email = document.getElementById('user-email');
        if (email) profile.querySelector('.director-email-place').appendChild(email);
        const name = document.getElementById('welcome-name');
        const title = document.getElementById('director-profile-name');
        if (name) {
            const update = () => {
                const value = (name.textContent || '').trim().replace(/[!\s]+$/, '');
                if (value && value.toLowerCase() !== 'drejtor') title.textContent = value;
            };
            update();
            new MutationObserver(update).observe(name, { childList: true, characterData: true, subtree: true });
        }

        const links = [
            ['▣', 'Klasat', '/klasat/'],
            ['♙', 'Nxënësit', '/nxenesit/'],
            ['♧', 'Mësimdhënësit', '/mesimdhenesit/'],
            ['▤', 'Lëndët', '/lendet/'],
            ['▦', 'Angazhimet', '/angazhimet/'],
            ['★', 'Notat', '/notat/'],
            ['◷', 'Mungesat', '/mungesat/']
        ];
        const nav = document.createElement('nav');
        nav.id = 'director-visual-nav';
        nav.setAttribute('aria-label', 'Menuja kryesore e Drejtorit');
        for (const [icon, label, href] of links) {
            const item = document.createElement('a');
            item.className = 'director-nav-item';
            item.href = href;
            const mark = document.createElement('span');
            mark.className = 'director-nav-icon';
            mark.setAttribute('aria-hidden', 'true');
            mark.textContent = icon;
            const text = document.createElement('span');
            text.textContent = label;
            item.append(mark, text);
            nav.appendChild(item);
        }
        main.insertBefore(nav, content);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
        setup();
    }
}());
