document.addEventListener("DOMContentLoaded", function () {
    const panel = document.querySelector(
        ".dashboard-content .information-section .activity-panel"
    );

    if (!panel || panel.dataset.activitiesReady === "1") {
        return;
    }

    panel.dataset.activitiesReady = "1";

    const token = sessionStorage.getItem("schoolControlToken");
    const header = panel.querySelector(".panel-header");
    const title = header ? header.querySelector("h3") : null;

    if (!header || !title) {
        return;
    }

    title.textContent = "Aktivitetet";

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "sc-add-activity";
    addButton.textContent = "+ Shto Aktivitet";

    header.appendChild(addButton);

    const toolbar = document.createElement("div");
    toolbar.className = "sc-activity-toolbar";

    toolbar.innerHTML = `
        <label for="sc-activity-filter">Shiko dat\u00ebn:</label>
        <input
            id="sc-activity-filter"
            class="sc-activity-date-input"
            type="date"
            aria-label="Data e aktiviteteve"
        >
        <button
            id="sc-activity-today"
            class="sc-today-button"
            type="button"
        >
            Sot
        </button>
    `;

    const dateHeading = document.createElement("div");
    dateHeading.className = "sc-activities-date-heading";

    const list = document.createElement("div");
    list.className = "sc-activities-list";
    list.setAttribute("aria-live", "polite");

    const statusText = document.createElement("p");
    statusText.className = "sc-activity-status";
    statusText.setAttribute("role", "status");

    panel.appendChild(toolbar);
    panel.appendChild(dateHeading);
    panel.appendChild(list);
    panel.appendChild(statusText);

    const dialog = document.createElement("dialog");
    dialog.className = "sc-activity-dialog";
    dialog.setAttribute("aria-labelledby", "sc-activity-form-title");

    dialog.innerHTML = `
        <div class="sc-dialog-header">
            <div>
                <h2 id="sc-activity-form-title">Shto Aktivitet</h2>
                <p>Regjistroni nj\u00eb aktivitet n\u00eb kalendarin e shkoll\u00ebs.</p>
            </div>

            <button
                type="button"
                class="sc-dialog-close"
                aria-label="Mbyll formularin"
            >\u00d7</button>
        </div>

        <form class="sc-activity-form" id="sc-activity-form">
            <div class="sc-activity-field">
                <label for="sc-activity-name">Emri i aktivitetit</label>
                <input
                    id="sc-activity-name"
                    type="text"
                    minlength="3"
                    maxlength="160"
                    placeholder="Shembull: Mbledhje me prind\u00ebr"
                    required
                >
            </div>

            <div class="sc-activity-field">
                <label for="sc-activity-date">Data e aktivitetit</label>
                <input
                    id="sc-activity-date"
                    type="date"
                    required
                >
            </div>

            <p class="sc-form-message" id="sc-activity-error"
               role="status" aria-live="polite"></p>

            <div class="sc-form-actions">
                <button type="button" class="sc-form-cancel">
                    Anulo
                </button>

                <button type="submit" class="sc-form-save">
                    Ruaj Aktivitetin
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);

    const cancelDialog = document.createElement("dialog");
    cancelDialog.className = "sc-activity-cancel-dialog";

    cancelDialog.setAttribute(
        "aria-labelledby",
        "sc-cancel-title"
    );

    cancelDialog.innerHTML = `
        <div class="sc-cancel-header">
            <div>
                <h2 id="sc-cancel-title">Anulo Aktivitetin</h2>
                <p id="sc-cancel-activity-name"></p>
            </div>

            <button
                type="button"
                class="sc-cancel-close"
                aria-label="Mbyll formularin"
            >
                &times;
            </button>
        </div>

        <form id="sc-cancel-form">

            <label for="sc-cancel-reason">
                Arsyeja e anulimit
            </label>

            <textarea
                id="sc-cancel-reason"
                minlength="3"
                maxlength="500"
                rows="4"
                placeholder="Shkruani pse po anulohet aktiviteti..."
                required
            ></textarea>

            <p
                id="sc-cancel-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="sc-cancel-actions">

                <button
                    type="button"
                    class="sc-cancel-back"
                >
                    Kthehu
                </button>

                <button
                    type="submit"
                    class="sc-cancel-confirm"
                >
                    Konfirmo Anulimin
                </button>

            </div>
        </form>
    `;

    document.body.appendChild(cancelDialog);

    const cancelForm = document.getElementById("sc-cancel-form");
    const cancelReason = document.getElementById("sc-cancel-reason");
    const cancelMessage = document.getElementById("sc-cancel-message");
    const cancelSave = cancelDialog.querySelector(".sc-cancel-confirm");

    let currentCancel = null;
    let actionBusy = false;

    function openCancellation(activity) {
        if (actionBusy || cancelDialog.open) {
            return;
        }

        currentCancel = activity;

        cancelForm.reset();
        cancelMessage.textContent = "";

        document.getElementById(
            "sc-cancel-activity-name"
        ).textContent = activity.emri;

        cancelDialog.showModal();
        cancelReason.focus();
    }

    function closeCancellation() {
        if (!actionBusy) {
            cancelDialog.close();
        }
    }

    cancelDialog.querySelector(".sc-cancel-close")
        .addEventListener("click", closeCancellation);

    cancelDialog.querySelector(".sc-cancel-back")
        .addEventListener("click", closeCancellation);

    cancelDialog.addEventListener("cancel", function (event) {
        if (actionBusy) {
            event.preventDefault();
        }
    });

    cancelDialog.addEventListener("close", function () {
        currentCancel = null;
    });

    async function markActivityHeld(activity) {
        if (actionBusy) {
            return;
        }

        const confirmed = window.confirm(
            "A konfirmoni se aktiviteti u mbajt?\n\n" +
            activity.emri
        );

        if (!confirmed) {
            return;
        }

        actionBusy = true;

        try {
            await apiRequest(
                "/api/aktivitetet/" + activity.id + "/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        statusi: "mbajtur"
                    })
                }
            );

            await loadActivities();
            window.dispatchEvent(new Event("schoolcontrol:reports-refresh"));

            statusText.textContent =
                "Aktiviteti u sh\u00ebnua si i mbajtur.";

        } catch (error) {
            statusText.textContent = error.message;

        } finally {
            actionBusy = false;
        }
    }

    cancelForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!currentCancel || actionBusy) {
            return;
        }

        const arsye = cancelReason.value.trim();

        if (arsye.length < 3) {
            cancelMessage.textContent =
                "Shkruani arsyen me t\u00eb pakt\u00ebn 3 karaktere.";
            return;
        }

        if (arsye.length > 500) {
            cancelMessage.textContent =
                "Arsyeja nuk mund t\u00eb kaloj\u00eb 500 karaktere.";
            return;
        }

        const activityId = currentCancel.id;

        actionBusy = true;
        cancelSave.disabled = true;
        cancelSave.textContent = "Duke anuluar...";
        cancelMessage.textContent = "";

        try {
            await apiRequest(
                "/api/aktivitetet/" + activityId + "/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        statusi: "anuluar",
                        arsye_anulimi: arsye
                    })
                }
            );

            cancelDialog.close();

            await loadActivities();
            window.dispatchEvent(new Event("schoolcontrol:reports-refresh"));

            statusText.textContent =
                "Aktiviteti u anulua dhe arsyeja u ruajt.";

        } catch (error) {
            cancelMessage.textContent = error.message;

        } finally {
            actionBusy = false;
            cancelSave.disabled = false;
            cancelSave.textContent = "Konfirmo Anulimin";
        }
    });


    const filterInput = document.getElementById("sc-activity-filter");
    const todayButton = document.getElementById("sc-activity-today");
    const form = document.getElementById("sc-activity-form");
    const nameInput = document.getElementById("sc-activity-name");
    const dateInput = document.getElementById("sc-activity-date");
    const errorText = document.getElementById("sc-activity-error");
    const saveButton = form.querySelector(".sc-form-save");

    let selectedDate = localToday();
    let requestNumber = 0;
    let saving = false;

    function localToday() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return year + "-" + month + "-" + day;
    }

    function formatDate(value) {
        const parts = String(value).split("-").map(Number);

        if (parts.length !== 3 || parts.some(Number.isNaN)) {
            return value;
        }

        const date = new Date(parts[0], parts[1] - 1, parts[2]);

        return new Intl.DateTimeFormat("sq-AL", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    function updateHeading() {
        const today = localToday();

        title.textContent = "Aktivitetet";

        dateHeading.textContent = selectedDate === today
            ? "Sot, " + formatDate(selectedDate)
            : formatDate(selectedDate);

        filterInput.value = selectedDate;
    }

    function apiError(data, fallback) {
        if (data && typeof data === "object") {
            if (typeof data.gabim === "string") {
                return data.gabim;
            }

            if (typeof data.detail === "string") {
                return data.detail;
            }

            if (Array.isArray(data.emri)) {
                return data.emri.join(" ");
            }

            if (Array.isArray(data.data)) {
                return data.data.join(" ");
            }
        }

        return fallback;
    }

    async function apiRequest(url, options = {}) {
        if (!token) {
            throw new Error("Ju duhet t\u00eb identifikoheni p\u00ebrs\u00ebri.");
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                Authorization: "Token " + token,
                Accept: "application/json",
                ...options.headers
            }
        });

        const data = await response.json().catch(function () {
            return null;
        });

        if (response.status === 401) {
            throw new Error("Sesioni ka skaduar. Identifikohuni p\u00ebrs\u00ebri.");
        }

        if (response.status === 403) {
            throw new Error("Nuk keni leje p\u00ebr k\u00ebt\u00eb veprim.");
        }

        if (!response.ok) {
            throw new Error(
                apiError(data, "Veprimi nuk u realizua.")
            );
        }

        return data;
    }

    function showEmpty() {
        list.replaceChildren();

        const empty = document.createElement("div");
        empty.className = "sc-activity-empty";

        empty.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5"
                 stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                <path d="M7 3v4M17 3v4M3 10h18"></path>
                <path d="m9 16 2 2 4-4"></path>
            </svg>

            <p>Nuk ka aktivitete t\u00eb regjistruara p\u00ebr k\u00ebt\u00eb dat\u00eb.</p>
        `;

        list.appendChild(empty);
    }

    function showActivity(activity) {
        const row = document.createElement("article");
        row.className = "sc-activity-item";

        const content = document.createElement("div");
        content.className = "sc-activity-item-content";

        const name = document.createElement("strong");
        name.textContent = activity.emri;

        const time = document.createElement("time");
        time.dateTime = activity.data;
        time.textContent = formatDate(activity.data);

        content.appendChild(name);
        content.appendChild(time);

        const actions = document.createElement("div");
        actions.className = "sc-activity-actions";

        const heldButton = document.createElement("button");
        heldButton.type = "button";
        heldButton.className = "sc-activity-held-button";
        heldButton.textContent = "\u2713";

        heldButton.setAttribute(
            "aria-label",
            "Sh\u00ebno si i mbajtur: " + activity.emri
        );

        heldButton.title = "Sh\u00ebno si i mbajtur";

        heldButton.addEventListener("click", function () {
            markActivityHeld(activity);
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "sc-activity-cancel-button";
        cancelButton.textContent = "\u00d7";

        cancelButton.setAttribute(
            "aria-label",
            "Anulo aktivitetin: " + activity.emri
        );

        cancelButton.title = "Anulo aktivitetin";

        cancelButton.addEventListener("click", function () {
            openCancellation(activity);
        });

        actions.appendChild(heldButton);
        actions.appendChild(cancelButton);

        row.appendChild(content);
        row.appendChild(actions);

        list.appendChild(row);
    }

    async function loadActivities() {
        const currentRequest = ++requestNumber;
        const dateToLoad = selectedDate;

        updateHeading();

        list.replaceChildren();
        statusText.textContent = "Duke ngarkuar aktivitetet...";

        try {
            const data = await apiRequest(
                "/api/aktivitetet/?data=" +
                encodeURIComponent(dateToLoad)
            );

            if (currentRequest !== requestNumber) {
                return;
            }

            if (!Array.isArray(data)) {
                throw new Error("Formati i aktiviteteve nuk \u00ebsht\u00eb i sakt\u00eb.");
            }

            list.replaceChildren();

            if (data.length === 0) {
                showEmpty();
            } else {
                data.forEach(showActivity);
            }

            statusText.textContent = data.length
                ? data.length + (data.length === 1 ? " aktivitet i regjistruar." : " aktivitete t\u00eb regjistruara.")
                : "";

        } catch (error) {
            if (currentRequest !== requestNumber) {
                return;
            }

            list.replaceChildren();
            statusText.textContent = error.message;
        }
    }

    function openForm() {
        form.reset();
        errorText.textContent = "";
        dateInput.value = selectedDate;

        dialog.showModal();
        nameInput.focus();
    }

    function closeForm() {
        if (!saving) {
            dialog.close();
        }
    }

    addButton.addEventListener("click", openForm);

    dialog.querySelector(".sc-dialog-close")
        .addEventListener("click", closeForm);

    dialog.querySelector(".sc-form-cancel")
        .addEventListener("click", closeForm);

    dialog.addEventListener("cancel", function (event) {
        if (saving) {
            event.preventDefault();
        }
    });

    filterInput.addEventListener("change", function () {
        if (!filterInput.value) {
            return;
        }

        selectedDate = filterInput.value;
        loadActivities();
    });

    todayButton.addEventListener("click", function () {
        selectedDate = localToday();
        loadActivities();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (saving) {
            return;
        }

        const name = nameInput.value.trim();
        const date = dateInput.value;

        if (name.length < 3) {
            errorText.textContent =
                "Emri duhet t\u00eb ket\u00eb t\u00eb pakt\u00ebn 3 karaktere.";
            return;
        }

        if (!date) {
            errorText.textContent =
                "Zgjidhni dat\u00ebn e aktivitetit.";
            return;
        }

        saving = true;
        saveButton.disabled = true;
        saveButton.textContent = "Duke ruajtur...";
        errorText.textContent = "";

        try {
            await apiRequest("/api/aktivitetet/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    emri: name,
                    data: date
                })
            });

            dialog.close();

            if (date === selectedDate) {
                await loadActivities();
            }

            statusText.textContent = date === selectedDate
                ? "Aktiviteti u regjistrua me sukses."
                : "Aktiviteti u ruajt p\u00ebr " + formatDate(date) +
                  ". P\u00ebr ta par\u00eb, zgjidhni dat\u00ebn.";

        } catch (error) {
            errorText.textContent = error.message;

        } finally {
            saving = false;
            saveButton.disabled = false;
            saveButton.textContent = "Ruaj Aktivitetin";
        }
    });

    filterInput.value = selectedDate;
    loadActivities();
});
