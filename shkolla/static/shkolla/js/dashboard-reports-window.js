document.addEventListener("DOMContentLoaded", function () {

    const content = document.querySelector(".dashboard-content");

    const section = content?.querySelector(".information-section");

    const activityPanel = section?.querySelector(".activity-panel");

    const reportsPanel = section?.querySelector(
        ".sc-reports-panel.sc-reports-compact"
    );

    const originalButton = reportsPanel?.querySelector(
        ".sc-reports-toggle"
    );

    if (!content || !section || !activityPanel ||
        !reportsPanel || !originalButton) {
        return;
    }

    const button = originalButton.cloneNode(true);
    const visibleCounter = button.querySelector(".sc-reports-count");

    originalButton.replaceWith(button);

    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-label", "Hap dritaren e raporteve");
    button.removeAttribute("aria-controls");

    const dialog = document.createElement("dialog");

    dialog.className = "sc-report-window";

    dialog.setAttribute("aria-labelledby", "sc-rw-title");

    dialog.innerHTML = `
        <div class="sc-rw-header">
            <div>
                <h2 id="sc-rw-title">Raportet</h2>
                <p>Aktivitetet e mbajtura dhe t\u00eb anuluara</p>
            </div>

            <button type="button"
                    class="sc-rw-close"
                    aria-label="Mbyll raportet">
                &times;
            </button>
        </div>

        <p class="sc-rw-message" role="status"></p>

        <div class="sc-rw-list"></div>

        <div class="sc-rw-footer" hidden>
            <span class="sc-rw-page"></span>

            <div class="sc-rw-navigation">
                <button type="button" class="sc-rw-prev">
                    Prapa
                </button>

                <button type="button" class="sc-rw-next">
                    P?rpara
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const reasonDialog = document.createElement("dialog");

    reasonDialog.className = "sc-report-reason-window";

    reasonDialog.innerHTML = `
        <h3>Arsyeja e anulimit</h3>
        <p class="sc-rw-full-reason"></p>
        <button type="button">Mbyll</button>
    `;

    document.body.appendChild(reasonDialog);

    const list = dialog.querySelector(".sc-rw-list");
    const message = dialog.querySelector(".sc-rw-message");
    const footer = dialog.querySelector(".sc-rw-footer");
    const pageText = dialog.querySelector(".sc-rw-page");
    const prevButton = dialog.querySelector(".sc-rw-prev");
    const nextButton = dialog.querySelector(".sc-rw-next");


    const filterBar = document.createElement("nav");
    filterBar.className = "sc-rw-filters";
    filterBar.setAttribute("aria-label", "Filtro raportet");

    const filterButtons = new Map();

    let activeFilter = "all";

    const options = [
        ["all", "T\u00eb gjitha"],
        ["mbajtur", "T\u00eb mbajtura"],
        ["anuluar", "T\u00eb anuluara"]
    ];

    options.forEach(function (option) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "sc-rw-filter";
        button.textContent = option[1];
        button.dataset.filter = option[0];

        button.addEventListener("click", function () {
            activeFilter = option[0];
            page = 0;
            renderReports();
        });

        filterBar.appendChild(button);
        filterButtons.set(option[0], button);
    });

    list.before(filterBar);

    let reports = [];
    let page = 0;
    let requestNumber = 0;

    function formatDate(value) {
        const parts = String(value).split("-").map(Number);

        if (parts.length !== 3 || parts.some(Number.isNaN)) {
            return value;
        }

        const date = new Date(
            parts[0],
            parts[1] - 1,
            parts[2],
            12
        );

        return new Intl.DateTimeFormat("sq-AL", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }


    function pageSize() {
        if (window.innerWidth < 700) {
            return window.innerHeight < 720 ? 1 : 2;
        }

        if (window.innerHeight < 700) {
            return 2;
        }

        if (window.innerHeight < 820) {
            return 4;
        }

        return 6;
    }

    function showFullReason(reason) {
        reasonDialog.querySelector(
            ".sc-rw-full-reason"
        ).textContent = reason;

        reasonDialog.showModal();
    }

    function createReport(activity) {
        const card = document.createElement("article");
        card.className = "sc-rw-card";

        const top = document.createElement("div");
        top.className = "sc-rw-card-top";

        const name = document.createElement("strong");
        name.className = "sc-rw-name";
        name.textContent = activity.emri;

        const status = document.createElement("span");
        status.className = "sc-rw-status";

        if (activity.statusi === "mbajtur") {
            status.classList.add("held");
            status.textContent = "\u2713 I mbajtur";
        } else {
            status.classList.add("cancelled");
            status.textContent = "\u00d7 I anuluar";
        }

        top.appendChild(name);
        top.appendChild(status);

        const date = document.createElement("time");
        date.className = "sc-rw-date";
        date.dateTime = activity.data;
        date.textContent = formatDate(activity.data);

        card.appendChild(top);
        card.appendChild(date);

        if (
            activity.statusi === "anuluar" &&
            activity.arsye_anulimi
        ) {
            const reason = document.createElement("p");
            reason.className = "sc-rw-reason";

            const fullReason = activity.arsye_anulimi;

            reason.textContent = "Arsyeja: " + (
                fullReason.length > 100
                    ? fullReason.slice(0, 100) + "..."
                    : fullReason
            );

            card.appendChild(reason);

            if (fullReason.length > 100) {
                const more = document.createElement("button");
                more.type = "button";
                more.className = "sc-rw-reason-button";
                more.textContent = "Lexo arsyen e plot\u00eb";

                more.addEventListener("click", function () {
                    showFullReason(fullReason);
                });

                card.appendChild(more);
            }
        }

        return card;
    }


    function renderReports() {
        list.replaceChildren();

        const heldCount = reports.filter(function (item) {
            return item.statusi === "mbajtur";
        }).length;

        const cancelledCount = reports.filter(function (item) {
            return item.statusi === "anuluar";
        }).length;

        const counts = {
            all: reports.length,
            mbajtur: heldCount,
            anuluar: cancelledCount
        };

        const labels = {
            all: "T\u00eb gjitha",
            mbajtur: "T\u00eb mbajtura",
            anuluar: "T\u00eb anuluara"
        };

        filterButtons.forEach(function (button, key) {
            button.textContent =
                labels[key] + " (" + counts[key] + ")";

            button.setAttribute(
                "aria-pressed",
                String(activeFilter === key)
            );
        });

        const filtered = reports.filter(function (item) {
            return activeFilter === "all" ||
                item.statusi === activeFilter;
        });

        if (filtered.length === 0) {
            message.textContent = reports.length === 0
                ? "Ende nuk ka raporte t\u00eb regjistruara."
                : "Nuk ka raporte n\u00eb k\u00ebt\u00eb kategori.";

            footer.hidden = true;
            return;
        }

        message.textContent = "";

        const size = pageSize();
        const totalPages = Math.ceil(filtered.length / size);

        page = Math.min(page, totalPages - 1);

        const start = page * size;

        filtered.slice(start, start + size).forEach(
            function (report) {
                list.appendChild(createReport(report));
            }
        );

        pageText.textContent =
            "Faqja " + (page + 1) + " nga " + totalPages;

        prevButton.disabled = page === 0;
        nextButton.disabled = page >= totalPages - 1;

        footer.hidden = totalPages <= 1;
    }

    async function loadReports() {
        const currentRequest = ++requestNumber;

        list.replaceChildren();
        footer.hidden = true;
        message.textContent = "Duke ngarkuar raportet...";

        try {
            const token = sessionStorage.getItem(
                "schoolControlToken"
            );

            if (!token) {
                throw new Error("Identifikohuni p\u00ebrs\u00ebri.");
            }

            const response = await fetch(
                "/api/aktivitetet/raportet/",
                {
                    headers: {
                        Authorization: "Token " + token,
                        Accept: "application/json"
                    }
                }
            );

            const data = await response.json().catch(
                function () {
                    return null;
                }
            );

            if (!response.ok) {
                throw new Error(
                    data?.gabim ||
                    data?.detail ||
                    "Raportet nuk u ngarkuan."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("Formati i raporteve nuk \u00ebsht\u00eb i sakt\u00eb.");
            }

            if (currentRequest !== requestNumber) {
                return;
            }

            reports = data.filter(function (item) {
                return (
                    item.statusi === "mbajtur" ||
                    item.statusi === "anuluar"
                );
            });

            reports.sort(function (a, b) {
                const dateResult = String(b.data).localeCompare(
                    String(a.data)
                );

                return dateResult ||
                    Number(b.id) - Number(a.id);
            });

            if (visibleCounter) {
                visibleCounter.textContent =
                    reports.length === 1
                        ? "1 raport"
                        : reports.length + " raporte";
            }

            page = 0;
            renderReports();

        } catch (error) {
            if (currentRequest === requestNumber) {
                message.textContent = error.message;
            }
        }
    }

    button.addEventListener("click", function () {
        if (!dialog.open) {
            dialog.showModal();
            loadReports();
        }
    });

    dialog.querySelector(".sc-rw-close").addEventListener(
        "click",
        function () {
            dialog.close();
        }
    );

    reasonDialog.querySelector("button").addEventListener(
        "click",
        function () {
            reasonDialog.close();
        }
    );

    prevButton.addEventListener("click", function () {
        if (page > 0) {
            page -= 1;
            renderReports();
        }
    });

    nextButton.addEventListener("click", function () {
        const filteredCount = reports.filter(function (item) {
            return activeFilter === "all" ||
                item.statusi === activeFilter;
        }).length;

        if ((page + 1) * pageSize() < filteredCount) {
            page += 1;
            renderReports();
        }
    });

    window.addEventListener(
        "schoolcontrol:reports-refresh",
        function () {
            loadReports();
        }
    );

    function findLendeBottom() {
        const elements = content.querySelectorAll("*");

        for (const element of elements) {
            if (
                element.children.length !== 0 ||
                element.textContent.trim() !== "L\u00ebnd\u00eb"
            ) {
                continue;
            }

            let parent = element.parentElement;

            while (parent && parent !== content) {
                const rect = parent.getBoundingClientRect();
                const activityRect = activityPanel.getBoundingClientRect();

                if (
                    rect.width >= 220 &&
                    rect.height >= 150 &&
                    rect.height <= 400 &&
                    rect.right < activityRect.left - 15
                ) {
                    return rect.bottom;
                }

                parent = parent.parentElement;
            }
        }

        return null;
    }

    function alignActivities() {
        if (window.innerWidth <= 1050) {
            activityPanel.style.removeProperty("height");
            activityPanel.style.removeProperty("min-height");
            activityPanel.style.removeProperty("max-height");
            section.style.removeProperty("--sc-activity-height");
            return;
        }

        const activityRect = activityPanel.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();

        const targetBottom =
            findLendeBottom() || activityRect.top + 500;

        const availableBottom = Math.min(
            contentRect.bottom,
            window.innerHeight
        );

        const availableHeight =
            availableBottom - activityRect.top - 106;

        const desiredHeight = Math.round(
            Math.min(
                targetBottom - activityRect.top,
                availableHeight
            )
        );

        if (desiredHeight < 300) {
            return;
        }

        activityPanel.style.setProperty(
            "height",
            desiredHeight + "px",
            "important"
        );

        activityPanel.style.setProperty(
            "min-height",
            desiredHeight + "px",
            "important"
        );

        activityPanel.style.setProperty(
            "max-height",
            desiredHeight + "px",
            "important"
        );

        section.style.setProperty(
            "--sc-activity-height",
            desiredHeight + "px"
        );
    }

    window.addEventListener("resize", function () {
        alignActivities();

        if (dialog.open && reports.length > 0) {
            renderReports();
        }
    });

    window.addEventListener("load", alignActivities);

    requestAnimationFrame(alignActivities);

    loadReports();
});
