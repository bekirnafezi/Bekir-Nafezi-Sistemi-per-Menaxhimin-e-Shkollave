(function () {
    'use strict';

    const pages = [
        ['▣', 'Klasat', '/klasat/'],
        ['♙', 'Nxënësit', '/nxenesit/'],
        ['♧', 'Mësimdhënësit', '/mesimdhenesit/'],
        ['▤', 'Lëndët', '/lendet/'],
        ['▦', 'Angazhimet', '/angazhimet/'],
        ['★', 'Notat', '/notat/'],
        ['◷', 'Mungesat', '/mungesat/'],
        ['▣', 'Aktivitetet', '/dashboard/'],
        ['▤', 'Vendimet e Drejtorit', '/dashboard/#vendimet'],
        ['▥', 'Raportet', '/dashboard/#raportet']
    ];

    function makeLink(icon, label, url) {
        const a = document.createElement('a');
        a.className = 'director-nav-item';
        a.href = url;
        const mark = document.createElement('span');
        mark.className = 'director-nav-icon';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = icon;
        const text = document.createElement('span');
        text.textContent = label;
        a.append(mark, text);
        return a;
    }

    function localDate() {
        return new Date().toLocaleDateString('sq-AL', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function signOut() {
        ['schoolControlToken', 'schoolControlRole', 'schoolControlEmail'].forEach(key => sessionStorage.removeItem(key));
        window.location.assign('/login/?role=drejtor');
    }

    function buildOtherPage(app, sidebar, main, topbar, content) {
        document.body.classList.add('director-step1', 'director-step2');
        content.classList.add('director-page-content');

        const header = document.createElement('header');
        header.id = 'director-visual-header';
        const logo = document.createElement('a');
        logo.className = 'director-brand-link';
        logo.href = '/klasat/';
        const cap = document.createElement('span');
        cap.className = 'director-brand-icon';
        cap.textContent = '🎓';
        cap.setAttribute('aria-hidden', 'true');
        const word = document.createElement('span');
        word.append('SCHOOL ');
        const brand = document.createElement('b');
        brand.textContent = 'CONTROL';
        word.append(brand);
        logo.append(cap, word);
        const actions = document.createElement('div');
        actions.className = 'director-header-actions';
        const date = document.createElement('span');
        date.className = 'director-date-step2';
        date.textContent = localDate();
        const out = document.createElement('button');
        out.type = 'button';
        out.id = 'logout-button';
        out.textContent = '⏻ Dil nga sistemi';
        out.addEventListener('click', signOut);
        actions.append(date, out);
        header.append(logo, actions);
        app.insertBefore(header, sidebar);

        const profile = document.createElement('section');
        profile.className = 'director-profile-card';
        profile.setAttribute('aria-label', 'Profili i Drejtorit');
        profile.innerHTML = '<div class="director-portrait" aria-hidden="true">👤</div><h2 class="director-profile-title">Drejtori</h2><span class="director-profile-role">Drejtor</span><div class="director-profile-school">🏫 SHFMU “Samidin Emini”</div><div class="director-profile-divider"></div><div class="director-profile-contact"><span class="director-profile-contact-icon" aria-hidden="true">✉</span><span class="director-email-place"></span></div><div class="director-profile-footer"><span aria-hidden="true">✦</span>SCHOOL CONTROL</div>';
        profile.querySelector('.director-email-place').textContent = sessionStorage.getItem('schoolControlEmail') || '—';
        sidebar.appendChild(profile);
        if (topbar) topbar.classList.add('director-hidden-topbar');
    }

    function updateSelection(nav) {
        const page = window.location.pathname;
        const hash = window.location.hash;
        nav.querySelectorAll('.director-nav-item').forEach(link => {
            const url = new URL(link.href);
            const selected = url.pathname === page &&
                (page !== '/dashboard/' || url.hash === hash || (!hash && !url.hash));
            link.classList.toggle('director-nav-active', selected);
            if (selected) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    function openDashboardSection() {
        if (window.location.pathname !== '/dashboard/') return;
        const hash = window.location.hash;
        if (hash !== '#vendimet' && hash !== '#raportet') return;
        const button = document.querySelector(hash === '#vendimet' ? '.sc-decisions-view' : '.sc-reports-toggle');
        if (button) button.click();
    }

    function setup() {
        const app = document.querySelector('.app-container');
        const sidebar = app?.querySelector(':scope > .sidebar');
        const main = app?.querySelector(':scope > .main-content');
        const topbar = main?.querySelector(':scope > .topbar');
        const content = main?.querySelector(':scope > .dashboard-content, :scope > .classes-page, :scope > .students-page');
        if (!app || !sidebar || !main || !content) return;

        if (!document.getElementById('director-visual-header')) {
            buildOtherPage(app, sidebar, main, topbar, content);
        } else {
            document.body.classList.add('director-step2');
        }

        let nav = document.getElementById('director-visual-nav');
        if (!nav) {
            nav = document.createElement('nav');
            nav.id = 'director-visual-nav';
            nav.setAttribute('aria-label', 'Menuja kryesore e Drejtorit');
            main.insertBefore(nav, content);
        }
        for (const [icon, label, url] of pages) {
            if (!Array.from(nav.querySelectorAll('a')).some(a => new URL(a.href).pathname === new URL(url, window.location.origin).pathname && new URL(a.href).hash === new URL(url, window.location.origin).hash)) {
                nav.appendChild(makeLink(icon, label, url));
            }
        }
        updateSelection(nav);
        window.addEventListener('hashchange', function () {
            updateSelection(nav);
            openDashboardSection();
        });
        for (const a of nav.querySelectorAll('a[href^="/dashboard/#"]')) {
            a.addEventListener('click', function (event) {
                if (window.location.pathname === '/dashboard/') {
                    event.preventDefault();
                    if (window.location.hash !== new URL(a.href).hash) {
                        history.replaceState(null, '', a.getAttribute('href'));
                    }
                    updateSelection(nav);
                    openDashboardSection();
                }
            });
        }
        if (window.location.hash === '#vendimet' || window.location.hash === '#raportet') {
            window.setTimeout(openDashboardSection, 130);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, {once:true});
    else setup();
})();
