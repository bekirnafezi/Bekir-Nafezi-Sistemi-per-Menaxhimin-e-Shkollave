document.addEventListener("DOMContentLoaded", function () {
    const dashboard = document.querySelector(".dashboard-content");

    if (dashboard) {
        let ancestor = dashboard.parentElement;

        while (ancestor && ancestor !== document.body) {
            ancestor.classList.add("sc-corridor-surface");
            ancestor = ancestor.parentElement;
        }

        const headers = document.querySelectorAll(
            "header, .topbar, .top-bar, .main-header, .dashboard-header"
        );

        headers.forEach(function (header) {
            const rect = header.getBoundingClientRect();

            if (
                rect.width >= 600 &&
                rect.height > 35 &&
                rect.height < 180 &&
                rect.top < 270
            ) {
                header.classList.add("sc-corridor-header");
            }
        });

        for (const element of document.querySelectorAll("*")) {
            if (
                element.children.length !== 0 ||
                element.textContent.trim() !== "Drejtor"
            ) {
                continue;
            }

            let parent = element.parentElement;

            while (parent && parent !== document.body) {
                const rect = parent.getBoundingClientRect();

                if (
                    rect.width >= 600 &&
                    rect.height >= 45 &&
                    rect.height <= 170
                ) {
                    parent.classList.add("sc-corridor-header");
                    break;
                }

                parent = parent.parentElement;
            }

            break;
        }
    }

    const sidebar = document.querySelector(
        ".sidebar, #sidebar"
    );

    if (!sidebar) {
        return;
    }

    const navigation = sidebar.querySelector(
        "nav, .sidebar-nav, .nav-menu, .sidebar-menu, .menu"
    ) || sidebar;

    function normalizePath(value) {
        const path = value.replace(/\/+$/, "");
        return path || "/";
    }

    const currentPath = normalizePath(
        window.location.pathname
    );

    const links = navigation.querySelectorAll("a[href]");

    links.forEach(function (link) {
        const rawHref = link.getAttribute("href");

        if (!rawHref || rawHref.startsWith("#")) {
            return;
        }

        let target;

        try {
            target = new URL(rawHref, window.location.href);
        } catch {
            return;
        }

        if (target.origin !== window.location.origin) {
            return;
        }

        const rect = link.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        if (
            rect.top < sidebarRect.top + 125 &&
            !link.closest("nav")
        ) {
            return;
        }

        link.classList.add("sc-gold-nav-item");

        if (link.parentElement) {
            link.parentElement.classList.add(
                "sc-gold-nav-parent"
            );
        }

        if (
            normalizePath(target.pathname) === currentPath
        ) {
            link.classList.add("sc-nav-current");

            if (link.parentElement) {
                link.parentElement.classList.add(
                    "sc-nav-current"
                );
            }

            link.setAttribute("aria-current", "page");
        }

        link.querySelectorAll("*").forEach(function (part) {
            const partRect = part.getBoundingClientRect();

            const isLine =
                partRect.width >= 35 &&
                partRect.width <= 210 &&
                partRect.height >= 2 &&
                partRect.height <= 14;

            const isDot =
                partRect.width >= 10 &&
                partRect.width <= 38 &&
                Math.abs(
                    partRect.width - partRect.height
                ) <= 5;

            if (isLine || isDot) {
                part.classList.add("sc-gold-mark");
            }
        });

        link.addEventListener("click", function () {
            navigation.querySelectorAll(
                ".sc-nav-current"
            ).forEach(function (item) {
                item.classList.remove("sc-nav-current");
            });

            link.classList.add("sc-nav-current");

            if (link.parentElement) {
                link.parentElement.classList.add(
                    "sc-nav-current"
                );
            }
        });
    });
});
