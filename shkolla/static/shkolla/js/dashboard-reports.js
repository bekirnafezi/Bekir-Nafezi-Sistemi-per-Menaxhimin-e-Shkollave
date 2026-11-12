document.addEventListener("DOMContentLoaded", function () {
    const section = document.querySelector(
        ".dashboard-content .information-section"
    );

    if (!section || section.querySelector(".sc-reports-panel")) {
        return;
    }

    const token = sessionStorage.getItem("schoolControlToken");

    const panel = document.createElement("section");
    panel.className = "sc-reports-panel";

    const header = document.createElement("div");
    header.className = "sc-reports-header";

    const title = document.createElement("h3");
    title.textContent = "Raportet";

    const counter = document.createElement("span");
    counter.className = "sc-reports-count";
    counter.textContent = "0 raporte";

    header.appendChild(title);
    header.appendChild(counter);

    const list = document.createElement("div");
    list.className = "sc-reports-list";
    list.setAttribute("aria-live", "polite");

    panel.appendChild(header);
    panel.appendChild(list);

    section.appendChild(panel);

    let requestNumber = 0;

    function formatDate(value) {
        const parts = String(value).split("-").map(Number);

        if (
            parts.length !== 3 ||
            parts.some(Number.isNaN)
        ) {
            return value;
        }

        const date = new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat("sq-AL", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    function showMessage(message) {
        list.replaceChildren();

        const text = document.createElement("p");
        text.className = "sc-reports-message";
        text.textContent = message;

        list.appendChild(text);
    }

    function addReport(activity) {
        const row = document.createElement("article");
        row.className = "sc-report-row";

        const top = document.createElement("div");
        top.className = "sc-report-top";

        const name = document.createElement("strong");
        name.className = "sc-report-name";
        name.textContent = activity.emri;

        const badge = document.createElement("span");
        badge.className = "sc-report-badge";

        if (activity.statusi === "mbajtur") {
            badge.classList.add("held");
            badge.textContent = "\u2713 I mbajtur";
        } else {
            badge.classList.add("cancelled");
            badge.textContent = "\u00d7 I anuluar";
        }

        top.appendChild(name);
        top.appendChild(badge);

        const date = document.createElement("time");
        date.className = "sc-report-date";
        date.dateTime = activity.data;
        date.textContent = formatDate(activity.data);

        row.appendChild(top);
        row.appendChild(date);

        if (
            activity.statusi === "anuluar" &&
            activity.arsye_anulimi
        ) {
            const reason = document.createElement("p");
            reason.className = "sc-report-reason";

            reason.textContent =
                "Arsyeja: " + activity.arsye_anulimi;

            row.appendChild(reason);
        }

        list.appendChild(row);
    }

    async function loadReports() {
        const currentRequest = ++requestNumber;

        showMessage("Duke ngarkuar raportet...");

        try {
            if (!token) {
                throw new Error(
                    "Identifikohuni p\u00ebrs\u00ebri."
                );
            }

            const response = await fetch(
                "/api/aktivitetet/raportet/",
                {
                    method: "GET",
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
                const message = data && (
                    data.gabim || data.detail
                );

                throw new Error(
                    message || "Raportet nuk u ngarkuan."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error(
                    "Formati i raporteve nuk \u00ebsht\u00eb i sakt\u00eb."
                );
            }

            if (currentRequest !== requestNumber) {
                return;
            }

            const reports = data.filter(function (activity) {
                return (
                    activity.statusi === "mbajtur" ||
                    activity.statusi === "anuluar"
                );
            });

            reports.sort(function (a, b) {
                const dateOrder = String(b.data).localeCompare(
                    String(a.data)
                );

                if (dateOrder !== 0) {
                    return dateOrder;
                }

                return Number(b.id) - Number(a.id);
            });

            counter.textContent =
                reports.length === 1
                    ? "1 raport"
                    : reports.length + " raporte";

            list.replaceChildren();

            if (reports.length === 0) {
                showMessage(
                    "Ende nuk ka aktivitete t\u00eb mbajtura ose t\u00eb anuluara."
                );
                return;
            }

            reports.forEach(addReport);

        } catch (error) {
            if (currentRequest !== requestNumber) {
                return;
            }

            showMessage(error.message);
        }
    }

    window.addEventListener(
        "schoolcontrol:reports-refresh",
        loadReports
    );

    loadReports();
});
