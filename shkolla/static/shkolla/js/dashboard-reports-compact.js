document.addEventListener("DOMContentLoaded", function () {

    const section = document.querySelector(
        ".dashboard-content .information-section"
    );

    if (!section) {
        return;
    }

    const panel = section.querySelector(".sc-reports-panel");

    if (!panel || panel.dataset.collapsible === "true") {
        return;
    }

    const header = panel.querySelector(".sc-reports-header");

    const list = panel.querySelector(".sc-reports-list");

    if (!header || !list) {
        return;
    }

    const toggleButton = document.createElement("button");

    toggleButton.type = "button";

    toggleButton.className =
        "sc-reports-header sc-reports-toggle";

    toggleButton.setAttribute(
        "aria-expanded",
        "false"
    );

    toggleButton.setAttribute(
        "aria-controls",
        "sc-reports-items"
    );

    toggleButton.setAttribute(
        "aria-label",
        "Hap raportet"
    );

    while (header.firstChild) {
        toggleButton.appendChild(header.firstChild);
    }

    header.replaceWith(toggleButton);

    list.id = "sc-reports-items";

    list.hidden = true;

    panel.dataset.collapsible = "true";

    panel.classList.add("sc-reports-compact");

    function changeReportsState(open) {

        panel.classList.toggle(
            "sc-reports-open",
            open
        );

        section.classList.toggle(
            "sc-reports-open",
            open
        );

        list.hidden = !open;

        toggleButton.setAttribute(
            "aria-expanded",
            String(open)
        );

        toggleButton.setAttribute(
            "aria-label",
            open ? "Mbyll raportet" : "Hap raportet"
        );
    }

    toggleButton.addEventListener(
        "click",
        function () {

            const isOpen = panel.classList.contains(
                "sc-reports-open"
            );

            changeReportsState(!isOpen);
        }
    );

    panel.addEventListener(
        "click",
        function (event) {

            if (
                !panel.classList.contains("sc-reports-open") &&
                !event.target.closest(".sc-reports-toggle")
            ) {
                changeReportsState(true);
            }
        }
    );

    changeReportsState(false);
});
