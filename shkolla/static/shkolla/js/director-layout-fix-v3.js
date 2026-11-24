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
        ['▣', 'Aktivitetet', '/dashboard/']
    ];

    function createHeader(app, sidebar) {
        let header = document.getElementById('director-visual-header');
        if (header) return header;
        header = document.createElement('header');
        header.id = 'director-visual-header';
        const brand = document.createElement('a');
        brand.className = 'director-brand-link';
        brand.href = '/klasat/';
        brand.innerHTML = '<span class="director-brand-icon" aria-hidden="true">🎓</span><span>SCHOOL <b>CONTROL</b></span>';
        const actions = document.createElement('div');
        actions.className = 'director-header-actions';
        const date = document.createElement('span');
        date.className = 'director-date-step2';
        date.textContent = new Date().toLocaleDateString('sq-AL', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
        const logout = document.createElement('button');
        logout.type = 'button';
        logout.id = 'logout-button';
        logout.textContent = '↪ Dil nga sistemi';
        actions.append(date, logout);
        header.append(brand, actions);
        app.insertBefore(header, sidebar);
        return header;
    }

    function createProfile(sidebar, main) {
        if (sidebar.querySelector('.director-profile-card')) return;
        const section = document.createElement('section');
        section.className = 'director-profile-card';
        section.setAttribute('aria-label', 'Profili i Drejtorit');
        section.innerHTML = '<div class="director-portrait" aria-hidden="true">👤</div><h2 class="director-profile-title">Drejtori</h2><span class="director-profile-role">Drejtor</span><div class="director-profile-school">🏫 SHFMU “Samidin Emini”</div><div class="director-profile-divider"></div><div class="director-profile-contact"><span class="director-profile-contact-icon" aria-hidden="true">✉</span><span class="director-email-place"></span></div><div class="director-profile-footer"><span aria-hidden="true">✦</span>SCHOOL CONTROL</div>';
        const oldEmail = main.querySelector('#user-email');
        const emailSlot = section.querySelector('.director-email-place');
        if (oldEmail) emailSlot.appendChild(oldEmail);
        else emailSlot.textContent = sessionStorage.getItem('schoolControlEmail') || '—';
        sidebar.appendChild(section);
    }

    function resetLogout(header) {
        const oldButton = header.querySelector('#logout-button');
        if (!oldButton) return;
        const button = oldButton.cloneNode(true);
        button.type = 'button';
        button.textContent = '↪ Dil nga sistemi';
        oldButton.replaceWith(button);
        button.addEventListener('click', function () {
            ['schoolControlToken', 'schoolControlRole', 'schoolControlEmail'].forEach(key => sessionStorage.removeItem(key));
            window.location.assign('/drejtori/hyrje/');
        });
    }

    function resetNavigation(main, content) {
        let nav = document.getElementById('director-visual-nav');
        if (!nav) {
            nav = document.createElement('nav');
            nav.id = 'director-visual-nav';
            nav.setAttribute('aria-label', 'Menuja kryesore e Drejtorit');
            main.insertBefore(nav, content);
        }
        nav.replaceChildren();
        const path = location.pathname;
        for (const [icon, label, href] of pages) {
            const link = document.createElement('a');
            link.className = 'director-nav-item';
            link.href = href;
            const active = path === href;
            if (active) {
                link.classList.add('director-nav-active');
                link.setAttribute('aria-current', 'page');
            }
            const symbol = document.createElement('span');
            symbol.className = 'director-nav-icon';
            symbol.setAttribute('aria-hidden', 'true');
            symbol.textContent = icon;
            const title = document.createElement('span');
            title.textContent = label;
            link.append(symbol, title);
            nav.appendChild(link);
        }
        return nav;
    }

    function setupActivities(page) {
        const information = page.querySelector(':scope > .information-section');
        if (!information || page.querySelector('.director-activity-actions')) return;
        const actions = document.createElement('div');
        actions.className = 'director-activity-actions';
        actions.setAttribute('aria-label', 'Veprimet e aktiviteteve dhe vendimeve');
        const decisionAdd = page.querySelector('.sc-decisions-add');
        const decisions = page.querySelector('.sc-decisions-view');
        const reports = page.querySelector('.sc-reports-toggle');
        if (decisionAdd) actions.appendChild(decisionAdd);
        if (decisions) actions.appendChild(decisions);
        if (reports) actions.appendChild(reports);
        if (actions.children.length) page.insertBefore(actions, information);
    }

    function run() {
        const app = document.querySelector('.app-container');
        const sidebar = app && app.querySelector(':scope > .sidebar');
        const main = app && app.querySelector(':scope > .main-content');
        if (!app || !sidebar || !main) return;
        const topbar = main.querySelector(':scope > .topbar');
        const content = Array.from(main.children).find(element =>
            element !== topbar && element.id !== 'director-visual-nav'
        );
        if (!content) return;
        document.body.classList.add('director-step1', 'director-step2', 'director-fix-v3');
        const header = createHeader(app, sidebar);
        createProfile(sidebar, main);
        resetLogout(header);
        resetNavigation(main, content);
        if (topbar) topbar.classList.add('director-hidden-topbar');
        if (content.classList.contains('dashboard-content')) setupActivities(content);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
})();
