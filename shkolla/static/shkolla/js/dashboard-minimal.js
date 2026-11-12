document.addEventListener("DOMContentLoaded", function () {
    const panel = document.querySelector(
        ".dashboard-content .activity-panel"
    );

    if (!panel || document.getElementById("dashboard-today")) {
        return;
    }

    const header = panel.querySelector(".panel-header");

    if (!header) {
        return;
    }

    const todayContainer = document.createElement("div");
    todayContainer.className = "dashboard-today";
    todayContainer.id = "dashboard-today";

    const dateElement = document.createElement("time");
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateElement.dateTime = year + "-" + month + "-" + day;

    dateElement.textContent = "Sot, " + today.toLocaleDateString(
        "sq-AL",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    todayContainer.appendChild(dateElement);
    header.insertAdjacentElement("afterend", todayContainer);
});
