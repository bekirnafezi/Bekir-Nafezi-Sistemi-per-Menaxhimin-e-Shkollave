(function () {
    'use strict';

    function configureHeader() {
        const header = document.getElementById('director-visual-header');
        if (!header) return;
        const actions = header.querySelector('.director-header-actions');
        const logout = actions && actions.querySelector('#logout-button');
        if (!actions || !logout) return;

        let requests = document.getElementById('teacher-requests-link');
        if (!requests) {
            requests = document.createElement('a');
            requests.id = 'teacher-requests-link';
            requests.href = '/drejtori/kerkesat/';
        }
        requests.removeAttribute('style');
        requests.className = 'director-requests-header-link';
        requests.textContent = '✉ Kërkesat dhe miratimet';
        actions.insertBefore(requests, logout);
    }

    function configureActivities() {
        if (window.location.pathname !== '/dashboard/') return;
        const page = document.querySelector('.main-content > .dashboard-content');
        if (!page) return;
        document.body.classList.add('director-activity-polish');

        const information = page.querySelector(':scope > .information-section');
        if (!information) return;
        let actions = page.querySelector(':scope > .director-activity-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'director-activity-actions';
            actions.setAttribute('aria-label', 'Vendimet dhe raportet');
        }
        const addDecision = page.querySelector('.sc-decisions-add');
        const viewDecisions = page.querySelector('.sc-decisions-view');
        const viewReports = page.querySelector('.sc-reports-toggle');
        for (const button of [addDecision, viewDecisions, viewReports]) {
            if (button) actions.appendChild(button);
        }
        if (actions.children.length) page.appendChild(actions);
    }

    function run() {
        configureHeader();
        configureActivities();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
