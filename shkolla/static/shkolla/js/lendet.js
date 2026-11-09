document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");

    if (!token) {
        window.location.replace("/login/");
        return;
    }

    const subjectsCount = document.getElementById("subjects-count");
    const subjectsTableBody = document.getElementById("subjects-table-body");
    const subjectsStatus = document.getElementById("subjects-status");
    const tableHeader = document.querySelector(".students-table-header");

    let lendet = [];
    let kerkimi = "";
    let faqjaAktuale = 1;
    let lendaAktuale = null;
    let dukeRuajtur = false;

    const perFaqe = 10;

    const toolbar = document.createElement("div");

    toolbar.className = "subject-list-tools";

    toolbar.innerHTML = `
        <input
            id="subject-search"
            class="subject-search"
            type="search"
            placeholder="Kërko lëndë..."
            aria-label="Kërko lëndë"
        >

        <button
            id="open-subjects-list"
            class="subject-list-button"
            type="button"
        >
            Shiko listën e plotë
        </button>
    `;

    tableHeader.appendChild(toolbar);

    const fullListModal = document.createElement("dialog");

    fullListModal.className = "subjects-list-modal";

    fullListModal.setAttribute(
        "aria-labelledby",
        "subjects-list-title"
    );

    fullListModal.innerHTML = `
        <div class="subjects-modal-header">

            <div>
                <h2 id="subjects-list-title">
                    Të gjitha lëndët
                </h2>

                <p>
                    Kërkoni dhe menaxhoni lëndët.
                </p>
            </div>

            <button
                id="close-subjects-list"
                type="button"
                aria-label="Mbyll listën"
            >
                ×
            </button>

        </div>

        <div class="subjects-modal-search">

            <input
                id="subjects-full-search"
                class="subject-search"
                type="search"
                placeholder="Kërko sipas emrit të lëndës..."
                aria-label="Kërko lëndë"
            >

            <span id="subjects-filtered-count"></span>

        </div>

        <p
            id="subjects-list-message"
            class="subjects-list-message"
            role="status"
            aria-live="polite"
        ></p>

        <div class="subjects-modal-table">

            <table class="students-table">

                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Emri i lëndës</th>
                        <th>Veprimet</th>
                    </tr>
                </thead>

                <tbody id="subjects-full-table-body"></tbody>

            </table>

        </div>

        <div class="subjects-modal-footer">

            <span id="subjects-page-info"></span>

            <div>
                <button
                    id="subjects-previous-page"
                    type="button"
                >
                    ← Para
                </button>

                <button
                    id="subjects-next-page"
                    type="button"
                >
                    Pas →
                </button>
            </div>

        </div>
    `;

    document.body.appendChild(fullListModal);

    const editModal = document.createElement("dialog");

    editModal.className = "subject-edit-modal";

    editModal.setAttribute(
        "aria-labelledby",
        "subject-edit-title"
    );

    editModal.innerHTML = `
        <div class="subject-edit-header">

            <div>
                <h2 id="subject-edit-title">
                    Ndrysho Lëndën
                </h2>

                <p>
                    Përditësoni emrin e lëndës.
                </p>
            </div>

            <button
                id="close-subject-edit"
                type="button"
                aria-label="Mbyll formularin"
            >
                ×
            </button>

        </div>

        <form id="subject-edit-form">

            <div class="subject-edit-field">

                <label for="edit-subject-name">
                    Emri i lëndës
                </label>

                <input
                    id="edit-subject-name"
                    type="text"
                    maxlength="100"
                    required
                >

            </div>

            <p
                id="subject-edit-message"
                class="subject-edit-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="subject-edit-actions">

                <button
                    id="cancel-subject-edit"
                    class="subject-cancel-button"
                    type="button"
                >
                    Anulo
                </button>

                <button
                    id="save-subject-edit"
                    class="subject-save-button"
                    type="submit"
                >
                    Ruaj Ndryshimin
                </button>

            </div>

        </form>
    `;

    document.body.appendChild(editModal);

    const style = document.createElement("style");

    style.textContent = `
        .students-table-header {
            flex-wrap: wrap;
            gap: 12px;
        }

        .subject-list-tools {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
            margin-left: auto;
        }

        .subject-search {
            box-sizing: border-box;
            width: 220px;
            min-height: 40px;
            padding: 10px 13px;
            border: 1px solid #e3d7f5;
            border-radius: 11px;
            background: #faf8ff;
            color: #302452;
            font: inherit;
            font-size: 12px;
            outline: none;
        }

        .subject-search:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .subject-list-button {
            min-height: 40px;
            padding: 9px 14px;
            border: 1px solid #dcc7fa;
            border-radius: 11px;
            background: #f5eeff;
            color: #7130cf;
            font: inherit;
            font-size: 12px;
            font-weight: 750;
            cursor: pointer;
        }

        .subject-list-button:hover {
            background: #ebddff;
        }

        .subjects-list-modal:not([open]),
        .subject-edit-modal:not([open]) {
            display: none;
        }

        .subjects-list-modal[open] {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            width: min(950px, calc(100% - 32px));
            height: min(700px, calc(100dvh - 48px));
            max-width: none;
            max-height: none;
            margin: auto;
            padding: 0;
            border: 1px solid #e8def8;
            border-radius: 19px;
            background: #fff;
            color: #281951;
            box-shadow: 0 20px 55px rgba(30, 16, 72, 0.25);
            overflow: hidden;
        }

        .subjects-list-modal::backdrop,
        .subject-edit-modal::backdrop {
            background: rgba(23, 13, 52, 0.5);
        }

        .subjects-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 23px 15px;
            border-bottom: 1px solid #efe6fa;
        }

        .subjects-modal-header h2 {
            margin: 0 0 5px;
            color: #281951;
            font-size: 22px;
        }

        .subjects-modal-header p {
            margin: 0;
            color: #817397;
            font-size: 12px;
        }

        #close-subjects-list {
            width: 35px;
            height: 35px;
            border: 0;
            border-radius: 10px;
            background: #f3ecff;
            color: #7130cf;
            font-size: 23px;
            cursor: pointer;
        }

        .subjects-modal-search {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            padding: 15px 23px;
        }

        .subjects-modal-search .subject-search {
            width: min(360px, 100%);
        }

        #subjects-filtered-count {
            color: #817397;
            font-size: 12px;
        }

        .subjects-list-message {
            margin: 0;
            padding: 0 23px 12px;
            color: #7130cf;
            font-size: 12px;
            line-height: 1.5;
        }

        .subjects-list-message:empty {
            display: none;
        }

        .subjects-modal-table {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 23px;
        }

        .subjects-modal-table .students-table {
            width: 100%;
            min-width: 550px;
        }

        .subjects-modal-table .students-table td {
            padding: 12px 15px;
        }

        .subjects-modal-table .students-table th:first-child {
            width: 15%;
        }

        .subjects-modal-table .students-table th:nth-child(2) {
            width: 55%;
        }

        .subjects-modal-table .students-table th:nth-child(3) {
            width: 30%;
        }

        .subject-row-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .subject-edit-button,
        .subject-delete-button {
            min-height: 34px;
            padding: 8px 13px;
            border: 0;
            border-radius: 9px;
            font: inherit;
            font-size: 11px;
            font-weight: 750;
            cursor: pointer;
        }

        .subject-edit-button {
            background: #eee0ff;
            color: #7130cf;
        }

        .subject-edit-button:hover {
            background: #dec3ff;
        }

        .subject-delete-button {
            background: #ffe7ed;
            color: #c62d57;
        }

        .subject-delete-button:hover {
            background: #ffd4df;
        }

        .subject-edit-button:focus-visible,
        .subject-delete-button:focus-visible {
            outline: 2px solid #7130cf;
            outline-offset: 2px;
        }

        .subjects-modal-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            padding: 14px 23px 18px;
            border-top: 1px solid #efe6fa;
            color: #716283;
            font-size: 12px;
        }

        .subjects-modal-footer > div {
            display: flex;
            gap: 8px;
        }

        .subjects-modal-footer button {
            min-height: 37px;
            padding: 8px 14px;
            border: 1px solid #dcc7fa;
            border-radius: 9px;
            background: #f5eeff;
            color: #7130cf;
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }

        .subjects-modal-footer button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .subject-edit-modal[open] {
            box-sizing: border-box;
            width: min(580px, calc(100% - 32px));
            max-width: none;
            max-height: calc(100dvh - 40px);
            margin: auto;
            padding: 0;
            border: 1px solid #e7dcf7;
            border-radius: 20px;
            background: #fff;
            color: #281951;
            box-shadow: 0 20px 55px rgba(30, 16, 72, 0.25);
            overflow-y: auto;
        }

        .subject-edit-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 24px 30px 20px;
            border-bottom: 1px solid #eee5fa;
        }

        .subject-edit-header h2 {
            margin: 0 0 7px;
            color: #281951;
            font-size: 24px;
            font-weight: 800;
        }

        .subject-edit-header p {
            margin: 0;
            color: #84749a;
            font-size: 13px;
        }

        #close-subject-edit {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            border: 0;
            border-radius: 11px;
            background: #f4edff;
            color: #7130cf;
            font-size: 24px;
            cursor: pointer;
        }

        #subject-edit-form {
            padding: 26px 30px 28px;
        }

        .subject-edit-field {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .subject-edit-field label {
            font-size: 13px;
            font-weight: 750;
            color: #302452;
        }

        .subject-edit-field input {
            box-sizing: border-box;
            width: 100%;
            min-height: 48px;
            padding: 12px 15px;
            border: 1px solid #e2d5f5;
            border-radius: 11px;
            background: #faf8ff;
            color: #302452;
            font: inherit;
            font-size: 13px;
            outline: none;
        }

        .subject-edit-field input:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .subject-edit-message {
            margin: 16px 0 0;
            color: #c62d57;
            font-size: 13px;
            line-height: 1.5;
        }

        .subject-edit-message:empty {
            display: none;
        }

        .subject-edit-actions {
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 25px;
        }

        .subject-cancel-button,
        .subject-save-button {
            min-height: 43px;
            padding: 11px 18px;
            border-radius: 11px;
            font: inherit;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
        }

        .subject-cancel-button {
            border: 1px solid #e3d7f5;
            background: white;
            color: #71558c;
        }

        .subject-save-button {
            border: 0;
            background: linear-gradient(135deg, #9138ed, #6e2bd9);
            color: white;
        }

        .subject-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 850px) {
            .subject-list-tools {
                margin-left: 0;
            }
        }

        @media (max-width: 600px) {
            .subject-edit-header,
            #subject-edit-form {
                padding: 20px;
            }
        }

        @media (max-width: 520px) {
            .subject-list-tools,
            .subject-search,
            .subject-list-button {
                width: 100%;
            }

            .subjects-modal-header,
            .subjects-modal-search,
            .subjects-modal-footer {
                padding-left: 14px;
                padding-right: 14px;
            }
        }
    `;

    document.head.appendChild(style);

    const subjectSearch = document.getElementById("subject-search");
    const fullSearch = document.getElementById("subjects-full-search");

    const fullTableBody = document.getElementById(
        "subjects-full-table-body"
    );

    const filteredCount = document.getElementById(
        "subjects-filtered-count"
    );

    const pageInfo = document.getElementById(
        "subjects-page-info"
    );

    const listMessage = document.getElementById(
        "subjects-list-message"
    );

    const previousButton = document.getElementById(
        "subjects-previous-page"
    );

    const nextButton = document.getElementById(
        "subjects-next-page"
    );

    const editForm = document.getElementById("subject-edit-form");
    const editName = document.getElementById("edit-subject-name");
    const editMessage = document.getElementById("subject-edit-message");
    const saveEditButton = document.getElementById("save-subject-edit");

    let riktheListen = false;

    function redirectToLogin() {
        sessionStorage.removeItem("schoolControlToken");
        sessionStorage.removeItem("schoolControlRole");
        sessionStorage.removeItem("schoolControlEmail");

        window.location.replace("/login/");
    }

    async function apiRequest(url, options = {}) {
        const target = new URL(url, window.location.origin);

        if (target.origin !== window.location.origin) {
            throw new Error("Adresa e API-së nuk është e vlefshme.");
        }

        const response = await fetch(target.href, {
            ...options,
            headers: {
                Authorization: "Token " + token,
                Accept: "application/json",
                ...options.headers
            }
        });

        if (response.status === 401) {
            redirectToLogin();
            throw new Error("Identifikimi ka skaduar.");
        }

        if (response.status === 403) {
            throw new Error("Nuk keni leje për këtë veprim.");
        }

        const body = await response.text();

        let data = null;

        if (body) {
            try {
                data = JSON.parse(body);
            } catch (error) {
                data = null;
            }
        }

        if (!response.ok) {
            if (data && typeof data === "object") {
                const detail =
                    data.gabim ||
                    data.detail ||
                    Object.values(data).flat().join(" ");

                if (detail) {
                    throw new Error(
                        Array.isArray(detail)
                            ? detail.join(" ")
                            : String(detail)
                    );
                }
            }

            if (response.status === 404) {
                throw new Error("Lënda nuk u gjet.");
            }

            throw new Error(
                "Veprimi nuk u realizua. Provoni përsëri."
            );
        }

        return data;
    }

    async function loadAllSubjects() {
        const items = [];
        const visited = new Set();

        let next = "/api/lendet/";

        while (next) {
            const target = new URL(next, window.location.origin);

            if (
                target.origin !== window.location.origin ||
                visited.has(target.href) ||
                visited.size >= 200
            ) {
                throw new Error(
                    "Lista nuk mund të ngarkohet plotësisht."
                );
            }

            visited.add(target.href);

            const data = await apiRequest(target.href);

            if (Array.isArray(data)) {
                items.push(...data);
                break;
            }

            if (!data || !Array.isArray(data.results)) {
                throw new Error(
                    "Formati i të dhënave është i pasaktë."
                );
            }

            items.push(...data.results);

            next = data.next || null;
        }

        return items;
    }

    function normalizeText(value) {
        return String(value ?? "")
            .toLocaleLowerCase("sq")
            .replace(/ë/g, "e")
            .replace(/ç/g, "c")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function filteredSubjects() {
        const query = normalizeText(kerkimi);

        if (!query) {
            return lendet;
        }

        return lendet.filter(function (lenda) {
            return normalizeText(lenda.emri).includes(query);
        });
    }

    function openEditSubject(lenda) {
        if (dukeRuajtur) {
            return;
        }

        lendaAktuale = lenda;

        editName.value = lenda.emri || "";
        editMessage.textContent = "";

        riktheListen = fullListModal.open;

        if (fullListModal.open) {
            fullListModal.close();
        }

        editModal.showModal();
        editName.focus();
    }

    function addSubjectRow(tbody, lenda, showActions) {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = lenda.id;

        const nameCell = document.createElement("td");
        nameCell.textContent = lenda.emri;

        row.appendChild(idCell);
        row.appendChild(nameCell);

        if (showActions) {
            const actionCell = document.createElement("td");

            const actionContainer = document.createElement("div");
            actionContainer.className = "subject-row-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "subject-edit-button";
            editButton.textContent = "Ndrysho";

            editButton.addEventListener("click", function () {
                openEditSubject(lenda);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "subject-delete-button";
            deleteButton.textContent = "Fshi";

            deleteButton.addEventListener("click", function () {
                deleteSubject(lenda);
            });

            actionContainer.appendChild(editButton);
            actionContainer.appendChild(deleteButton);

            actionCell.appendChild(actionContainer);
            row.appendChild(actionCell);
        }

        tbody.appendChild(row);
    }

    function renderSubjects() {
        const filtered = filteredSubjects();

        subjectsCount.textContent = lendet.length;

        subjectsTableBody.replaceChildren();

        filtered.slice(0, 5).forEach(function (lenda) {
            addSubjectRow(subjectsTableBody, lenda, false);
        });

        if (!lendet.length) {
            subjectsStatus.textContent =
                "Nuk ka ende lëndë të regjistruara.";

        } else if (!filtered.length) {
            subjectsStatus.textContent =
                "Nuk u gjet asnjë lëndë për këtë kërkim.";

        } else if (filtered.length > 5) {
            subjectsStatus.textContent =
                "Po shfaqen 5 nga " +
                filtered.length +
                " lëndë. Klikoni «Shiko listën e plotë».";

        } else {
            subjectsStatus.textContent = "";
        }

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / perFaqe)
        );

        faqjaAktuale = Math.min(faqjaAktuale, totalPages);

        const start = (faqjaAktuale - 1) * perFaqe;

        fullTableBody.replaceChildren();

        filtered
            .slice(start, start + perFaqe)
            .forEach(function (lenda) {
                addSubjectRow(fullTableBody, lenda, true);
            });

        if (!filtered.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 3;
            cell.textContent = "Nuk u gjet asnjë lëndë.";
            cell.style.textAlign = "center";

            row.appendChild(cell);
            fullTableBody.appendChild(row);
        }

        filteredCount.textContent = filtered.length + " lëndë";

        pageInfo.textContent =
            "Faqja " + faqjaAktuale + " nga " + totalPages;

        previousButton.disabled = faqjaAktuale === 1;
        nextButton.disabled = faqjaAktuale === totalPages;
    }

    function updateSearch(value) {
        kerkimi = value;

        subjectSearch.value = value;
        fullSearch.value = value;

        faqjaAktuale = 1;

        renderSubjects();
    }

    async function deleteSubject(lenda) {
        if (dukeRuajtur) {
            return;
        }

        const confirmed = window.confirm(
            'A dëshironi të fshini lëndën "' +
            lenda.emri +
            '"?\n\n' +
            "Ky veprim nuk mund të zhbëhet."
        );

        if (!confirmed) {
            return;
        }

        dukeRuajtur = true;

        listMessage.textContent = "Duke fshirë lëndën...";

        try {
            await apiRequest(
                "/api/lendet/" + lenda.id + "/",
                {
                    method: "DELETE"
                }
            );

            try {
                await loadSubjects();

                listMessage.textContent =
                    "Lënda u fshi me sukses.";

                subjectsStatus.textContent =
                    "Lënda u fshi me sukses.";

            } catch (error) {
                listMessage.textContent =
                    "Lënda u fshi, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            listMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;
        }
    }

    subjectSearch.addEventListener("input", function () {
        updateSearch(subjectSearch.value);
    });

    fullSearch.addEventListener("input", function () {
        updateSearch(fullSearch.value);
    });

    document.getElementById("open-subjects-list")
        .addEventListener("click", function () {
            faqjaAktuale = 1;

            listMessage.textContent = "";

            renderSubjects();

            fullListModal.showModal();
            fullSearch.focus();
        });

    document.getElementById("close-subjects-list")
        .addEventListener("click", function () {
            if (!dukeRuajtur) {
                fullListModal.close();
            }
        });

    previousButton.addEventListener("click", function () {
        if (faqjaAktuale > 1) {
            faqjaAktuale--;
            renderSubjects();
        }
    });

    nextButton.addEventListener("click", function () {
        const totalPages = Math.ceil(
            filteredSubjects().length / perFaqe
        );

        if (faqjaAktuale < totalPages) {
            faqjaAktuale++;
            renderSubjects();
        }
    });

    document.getElementById("close-subject-edit")
        .addEventListener("click", function () {
            if (!dukeRuajtur) {
                editModal.close();
            }
        });

    document.getElementById("cancel-subject-edit")
        .addEventListener("click", function () {
            if (!dukeRuajtur) {
                editModal.close();
            }
        });

    editModal.addEventListener("cancel", function (event) {
        if (dukeRuajtur) {
            event.preventDefault();
        }
    });

    fullListModal.addEventListener("cancel", function (event) {
        if (dukeRuajtur) {
            event.preventDefault();
        }
    });

    editModal.addEventListener("close", function () {
        if (riktheListen) {
            riktheListen = false;

            if (!fullListModal.open) {
                fullListModal.showModal();
            }
        }

        lendaAktuale = null;
    });

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!lendaAktuale || dukeRuajtur) {
            return;
        }

        const emri = editName.value.trim();

        if (!emri) {
            editMessage.textContent =
                "Shkruani emrin e lëndës.";
            return;
        }

        if (emri === lendaAktuale.emri) {
            editMessage.textContent =
                "Nuk keni bërë asnjë ndryshim.";
            return;
        }

        dukeRuajtur = true;

        saveEditButton.disabled = true;
        saveEditButton.textContent = "Duke ruajtur...";

        editMessage.textContent = "";

        try {
            await apiRequest(
                "/api/lendet/" + lendaAktuale.id + "/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        emri: emri
                    })
                }
            );

            editModal.close();

            try {
                await loadSubjects();

                listMessage.textContent =
                    "Emri i lëndës u ndryshua me sukses.";

                subjectsStatus.textContent =
                    "Emri i lëndës u ndryshua me sukses.";

            } catch (error) {
                listMessage.textContent =
                    "Ndryshimi u ruajt, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            editMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;

            saveEditButton.disabled = false;
            saveEditButton.textContent = "Ruaj Ndryshimin";
        }
    });

    async function loadSubjects() {
        subjectsStatus.textContent = "Duke ngarkuar lëndët...";

        lendet = await loadAllSubjects();

        renderSubjects();
    }

    loadSubjects().catch(function (error) {
        subjectsCount.textContent = "—";
        subjectsTableBody.replaceChildren();
        subjectsStatus.textContent = error.message;
    });
});