document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");

    if (!token) {
        window.location.replace("/login/");
        return;
    }

    const teachersCount = document.getElementById("teachers-count");
    const teachersTableBody = document.getElementById("teachers-table-body");
    const teachersStatus = document.getElementById("teachers-status");
    const tableHeader = document.querySelector(".students-table-header");

    let mesimdhenesit = [];
    let kerkimi = "";
    let faqjaAktuale = 1;
    let mesimdhenesiAktual = null;
    let dukeRuajtur = false;

    const perFaqe = 10;

    const toolbar = document.createElement("div");
    toolbar.className = "teacher-list-tools";

    toolbar.innerHTML = `
        <input
            id="teacher-search"
            class="teacher-search"
            type="search"
            placeholder="Kërko mësimdhënës..."
            aria-label="Kërko mësimdhënës"
        >

        <button
            id="open-teachers-list"
            class="teacher-list-button"
            type="button"
        >
            Shiko listën e plotë
        </button>
    `;

    tableHeader.appendChild(toolbar);

    const fullListModal = document.createElement("dialog");

    fullListModal.className = "teachers-list-modal";

    fullListModal.setAttribute(
        "aria-labelledby",
        "teachers-list-title"
    );

    fullListModal.innerHTML = `
        <div class="teachers-modal-header">
            <div>
                <h2 id="teachers-list-title">
                    Të gjithë mësimdhënësit
                </h2>

                <p>
                    Kërkoni dhe menaxhoni mësimdhënësit.
                </p>
            </div>

            <button
                id="close-teachers-list"
                type="button"
                aria-label="Mbyll listën"
            >
                ×
            </button>
        </div>

        <div class="teachers-modal-search">
            <input
                id="teachers-full-search"
                class="teacher-search"
                type="search"
                placeholder="Kërko sipas emrit ose mbiemrit..."
                aria-label="Kërko mësimdhënës"
            >

            <span id="teachers-filtered-count"></span>
        </div>

        <p
            id="teachers-list-message"
            class="teachers-list-message"
            role="status"
            aria-live="polite"
        ></p>

        <div class="teachers-modal-table">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Emri</th>
                        <th>Mbiemri</th>
                        <th>Email</th>
                        <th>Veprimet</th>
                    </tr>
                </thead>

                <tbody id="teachers-full-table-body"></tbody>
            </table>
        </div>

        <div class="teachers-modal-footer">
            <span id="teachers-page-info"></span>

            <div>
                <button
                    id="teachers-previous-page"
                    type="button"
                >
                    ← Para
                </button>

                <button
                    id="teachers-next-page"
                    type="button"
                >
                    Pas →
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(fullListModal);

    const editModal = document.createElement("dialog");

    editModal.className = "teacher-edit-modal";

    editModal.setAttribute(
        "aria-labelledby",
        "teacher-edit-title"
    );

    editModal.innerHTML = `
        <div class="teacher-edit-header">
            <div>
                <h2 id="teacher-edit-title">
                    Ndrysho Mësimdhënësin
                </h2>

                <p>
                    Përditësoni të dhënat e mësimdhënësit.
                </p>
            </div>

            <button
                id="close-teacher-edit"
                type="button"
                aria-label="Mbyll formularin"
            >
                ×
            </button>
        </div>

        <form id="teacher-edit-form">

            <div class="teacher-edit-grid">

                <div class="teacher-edit-field">
                    <label for="edit-teacher-first-name">
                        Emri
                    </label>

                    <input
                        id="edit-teacher-first-name"
                        type="text"
                        maxlength="150"
                        required
                    >
                </div>

                <div class="teacher-edit-field">
                    <label for="edit-teacher-last-name">
                        Mbiemri
                    </label>

                    <input
                        id="edit-teacher-last-name"
                        type="text"
                        maxlength="150"
                        required
                    >
                </div>

                <div class="teacher-edit-field teacher-edit-full">
                    <label for="edit-teacher-email">
                        Email
                    </label>

                    <input
                        id="edit-teacher-email"
                        type="email"
                        required
                    >
                </div>

            </div>

            <p
                id="teacher-edit-message"
                class="teacher-edit-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="teacher-edit-actions">

                <button
                    id="cancel-teacher-edit"
                    class="teacher-cancel-button"
                    type="button"
                >
                    Anulo
                </button>

                <button
                    id="save-teacher-edit"
                    class="teacher-save-button"
                    type="submit"
                >
                    Ruaj Ndryshimet
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

        .teacher-list-tools {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
            margin-left: auto;
        }

        .teacher-search {
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

        .teacher-search:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .teacher-list-button {
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

        .teacher-list-button:hover {
            background: #ebddff;
        }

        .teachers-list-modal:not([open]),
        .teacher-edit-modal:not([open]) {
            display: none;
        }

        .teachers-list-modal[open] {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            width: min(1070px, calc(100% - 32px));
            height: min(730px, calc(100dvh - 48px));
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

        .teachers-list-modal::backdrop,
        .teacher-edit-modal::backdrop {
            background: rgba(23, 13, 52, 0.5);
        }

        .teachers-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 20px 23px 15px;
            border-bottom: 1px solid #efe6fa;
        }

        .teachers-modal-header h2 {
            margin: 0 0 5px;
            color: #281951;
            font-size: 22px;
        }

        .teachers-modal-header p {
            margin: 0;
            color: #817397;
            font-size: 12px;
        }

        #close-teachers-list {
            width: 35px;
            height: 35px;
            border: 0;
            border-radius: 10px;
            background: #f3ecff;
            color: #7130cf;
            font-size: 23px;
            cursor: pointer;
        }

        .teachers-modal-search {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            padding: 15px 23px;
        }

        .teachers-modal-search .teacher-search {
            width: min(360px, 100%);
        }

        #teachers-filtered-count {
            color: #817397;
            font-size: 12px;
        }

        .teachers-list-message {
            margin: 0;
            padding: 0 23px 12px;
            color: #7130cf;
            font-size: 12px;
            line-height: 1.5;
        }

        .teachers-list-message:empty {
            display: none;
        }

        .teachers-modal-table {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 23px;
        }

        .teachers-modal-table .students-table {
            width: 100%;
            min-width: 850px;
        }

        .teachers-modal-table .students-table td {
            padding: 12px 15px;
        }

        .teachers-modal-table .students-table th:nth-child(1) {
            width: 7%;
        }

        .teachers-modal-table .students-table th:nth-child(2) {
            width: 17%;
        }

        .teachers-modal-table .students-table th:nth-child(3) {
            width: 17%;
        }

        .teachers-modal-table .students-table th:nth-child(4) {
            width: 35%;
        }

        .teachers-modal-table .students-table th:nth-child(5) {
            width: 24%;
        }

        .teacher-row-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .teacher-edit-button,
        .teacher-delete-button {
            min-height: 34px;
            padding: 8px 13px;
            border: 0;
            border-radius: 9px;
            font: inherit;
            font-size: 11px;
            font-weight: 750;
            cursor: pointer;
        }

        .teacher-edit-button {
            background: #eee0ff;
            color: #7130cf;
        }

        .teacher-edit-button:hover {
            background: #dec3ff;
        }

        .teacher-delete-button {
            background: #ffe7ed;
            color: #c62d57;
        }

        .teacher-delete-button:hover {
            background: #ffd4df;
        }

        .teachers-modal-footer {
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

        .teachers-modal-footer > div {
            display: flex;
            gap: 8px;
        }

        .teachers-modal-footer button {
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

        .teachers-modal-footer button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .teacher-edit-modal[open] {
            box-sizing: border-box;
            width: min(650px, calc(100% - 32px));
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

        .teacher-edit-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 24px 30px 20px;
            border-bottom: 1px solid #eee5fa;
        }

        .teacher-edit-header h2 {
            margin: 0 0 7px;
            color: #281951;
            font-size: 24px;
            font-weight: 800;
        }

        .teacher-edit-header p {
            margin: 0;
            color: #84749a;
            font-size: 13px;
        }

        #close-teacher-edit {
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

        #teacher-edit-form {
            padding: 25px 30px 28px;
        }

        .teacher-edit-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 19px;
        }

        .teacher-edit-field {
            display: flex;
            flex-direction: column;
            gap: 9px;
            min-width: 0;
        }

        .teacher-edit-full {
            grid-column: 1 / -1;
        }

        .teacher-edit-field label {
            color: #302452;
            font-size: 13px;
            font-weight: 750;
        }

        .teacher-edit-field input {
            box-sizing: border-box;
            width: 100%;
            min-height: 47px;
            padding: 12px 15px;
            border: 1px solid #e2d5f5;
            border-radius: 11px;
            background: #faf8ff;
            color: #302452;
            font: inherit;
            font-size: 13px;
            outline: none;
        }

        .teacher-edit-field input:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .teacher-edit-message {
            margin: 17px 0 0;
            color: #c62d57;
            font-size: 13px;
            line-height: 1.5;
        }

        .teacher-edit-message:empty {
            display: none;
        }

        .teacher-edit-actions {
            display: flex;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 24px;
        }

        .teacher-cancel-button,
        .teacher-save-button {
            min-height: 43px;
            padding: 11px 18px;
            border-radius: 11px;
            font: inherit;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
        }

        .teacher-cancel-button {
            border: 1px solid #e3d7f5;
            background: #fff;
            color: #71558c;
        }

        .teacher-save-button {
            border: 0;
            background: linear-gradient(135deg, #9138ed, #6e2bd9);
            color: #fff;
        }

        .teacher-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 850px) {
            .teacher-list-tools {
                margin-left: 0;
            }

            .teachers-modal-search {
                flex-wrap: wrap;
            }
        }

        @media (max-width: 650px) {
            .teacher-edit-grid {
                grid-template-columns: 1fr;
            }

            .teacher-edit-full {
                grid-column: auto;
            }

            .teacher-edit-header,
            #teacher-edit-form {
                padding: 20px;
            }
        }

        @media (max-width: 520px) {
            .teacher-list-tools,
            .teacher-search,
            .teacher-list-button {
                width: 100%;
            }

            .teachers-modal-header,
            .teachers-modal-search,
            .teachers-modal-footer {
                padding-left: 14px;
                padding-right: 14px;
            }
        }
    `;

    document.head.appendChild(style);

    const teacherSearch = document.getElementById("teacher-search");
    const fullSearch = document.getElementById("teachers-full-search");
    const fullTableBody = document.getElementById("teachers-full-table-body");
    const filteredCount = document.getElementById("teachers-filtered-count");
    const pageInfo = document.getElementById("teachers-page-info");
    const listMessage = document.getElementById("teachers-list-message");

    const previousButton = document.getElementById(
        "teachers-previous-page"
    );

    const nextButton = document.getElementById(
        "teachers-next-page"
    );

    const editForm = document.getElementById("teacher-edit-form");
    const editFirstName = document.getElementById("edit-teacher-first-name");
    const editLastName = document.getElementById("edit-teacher-last-name");
    const editEmail = document.getElementById("edit-teacher-email");
    const editMessage = document.getElementById("teacher-edit-message");
    const saveEditButton = document.getElementById("save-teacher-edit");

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
                throw new Error("Mësimdhënësi nuk u gjet.");
            }

            throw new Error(
                "Veprimi nuk u realizua. Provoni përsëri."
            );
        }

        return data;
    }

    async function loadAllTeachers() {
        const items = [];
        const visited = new Set();

        let next = "/api/mesimdhenesit/";

        while (next) {
            const target = new URL(next, window.location.origin);

            if (visited.has(target.href) || visited.size >= 200) {
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

    function filteredTeachers() {
        const query = normalizeText(kerkimi);

        if (!query) {
            return mesimdhenesit;
        }

        return mesimdhenesit.filter(function (teacher) {
            const emri = normalizeText(teacher.emri);
            const mbiemri = normalizeText(teacher.mbiemri);

            if (query.length === 1) {
                return (
                    emri.startsWith(query) ||
                    mbiemri.startsWith(query)
                );
            }

            return [
                emri,
                mbiemri,
                emri + " " + mbiemri,
                normalizeText(teacher.email)
            ].some(function (value) {
                return value.includes(query);
            });
        });
    }

    function openEditTeacher(teacher) {
        if (dukeRuajtur) {
            return;
        }

        mesimdhenesiAktual = teacher;

        editFirstName.value = teacher.emri || "";
        editLastName.value = teacher.mbiemri || "";
        editEmail.value = teacher.email || "";

        editMessage.textContent = "";

        editModal.showModal();

        editFirstName.focus();
    }

    function addTeacherRow(tbody, teacher, showActions) {
        const row = document.createElement("tr");

        [
            teacher.id,
            teacher.emri,
            teacher.mbiemri,
            teacher.email
        ].forEach(function (value) {
            const cell = document.createElement("td");

            cell.textContent = value ?? "—";

            row.appendChild(cell);
        });

        if (showActions) {
            const actionCell = document.createElement("td");
            const actionContainer = document.createElement("div");

            actionContainer.className = "teacher-row-actions";

            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.className = "teacher-edit-button";
            editButton.textContent = "Ndrysho";

            editButton.addEventListener("click", function () {
                openEditTeacher(teacher);
            });

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "teacher-delete-button";
            deleteButton.textContent = "Fshi";

            deleteButton.addEventListener("click", function () {
                deleteTeacher(teacher);
            });

            actionContainer.appendChild(editButton);
            actionContainer.appendChild(deleteButton);

            actionCell.appendChild(actionContainer);

            row.appendChild(actionCell);
        }

        tbody.appendChild(row);
    }

    function renderTeachers() {
        const filtered = filteredTeachers();

        teachersCount.textContent = mesimdhenesit.length;

        teachersTableBody.replaceChildren();

        filtered.slice(0, 5).forEach(function (teacher) {
            addTeacherRow(teachersTableBody, teacher, false);
        });

        if (!mesimdhenesit.length) {
            teachersStatus.textContent =
                "Nuk ka ende mësimdhënës të regjistruar.";

        } else if (!filtered.length) {
            teachersStatus.textContent =
                "Nuk u gjet asnjë mësimdhënës për këtë kërkim.";

        } else if (filtered.length > 5) {
            teachersStatus.textContent =
                "Po shfaqen 5 nga " +
                filtered.length +
                " mësimdhënës. Klikoni «Shiko listën e plotë».";

        } else {
            teachersStatus.textContent = "";
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
            .forEach(function (teacher) {
                addTeacherRow(fullTableBody, teacher, true);
            });

        if (!filtered.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.textContent = "Nuk u gjet asnjë mësimdhënës.";
            cell.style.textAlign = "center";

            row.appendChild(cell);
            fullTableBody.appendChild(row);
        }

        filteredCount.textContent =
            filtered.length + " mësimdhënës";

        pageInfo.textContent =
            "Faqja " + faqjaAktuale + " nga " + totalPages;

        previousButton.disabled = faqjaAktuale === 1;
        nextButton.disabled = faqjaAktuale === totalPages;
    }

    function updateSearch(value) {
        kerkimi = value;

        teacherSearch.value = value;
        fullSearch.value = value;

        faqjaAktuale = 1;

        renderTeachers();
    }

    async function deleteTeacher(teacher) {
        if (dukeRuajtur) {
            return;
        }

        const fullName = [
            teacher.emri,
            teacher.mbiemri
        ].filter(Boolean).join(" ");

        const confirmed = window.confirm(
            'A dëshironi të fshini mësimdhënësin "' +
            fullName +
            '"?\n\n' +
            "Do të fshihet edhe llogaria e tij e përdoruesit.\n" +
            "Ky veprim nuk mund të zhbëhet."
        );

        if (!confirmed) {
            return;
        }

        dukeRuajtur = true;

        listMessage.textContent =
            "Duke fshirë mësimdhënësin...";

        try {
            await apiRequest(
                "/api/mesimdhenesit/" + teacher.id + "/",
                {
                    method: "DELETE"
                }
            );

            try {
                await loadTeachers();

                listMessage.textContent =
                    "Mësimdhënësi u fshi me sukses.";

                teachersStatus.textContent =
                    "Mësimdhënësi u fshi me sukses.";

            } catch (error) {
                listMessage.textContent =
                    "Mësimdhënësi u fshi, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            listMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;
        }
    }

    teacherSearch.addEventListener("input", function () {
        updateSearch(teacherSearch.value);
    });

    fullSearch.addEventListener("input", function () {
        updateSearch(fullSearch.value);
    });

    document.getElementById("open-teachers-list")
        .addEventListener("click", function () {
            faqjaAktuale = 1;

            listMessage.textContent = "";

            renderTeachers();

            fullListModal.showModal();
            fullSearch.focus();
        });

    document.getElementById("close-teachers-list")
        .addEventListener("click", function () {
            if (!dukeRuajtur) {
                fullListModal.close();
            }
        });

    previousButton.addEventListener("click", function () {
        if (faqjaAktuale > 1) {
            faqjaAktuale--;

            renderTeachers();
        }
    });

    nextButton.addEventListener("click", function () {
        const totalPages = Math.ceil(
            filteredTeachers().length / perFaqe
        );

        if (faqjaAktuale < totalPages) {
            faqjaAktuale++;

            renderTeachers();
        }
    });

    document.getElementById("close-teacher-edit")
        .addEventListener("click", function () {
            if (!dukeRuajtur) {
                editModal.close();
            }
        });

    document.getElementById("cancel-teacher-edit")
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

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!mesimdhenesiAktual || dukeRuajtur) {
            return;
        }

        const emri = editFirstName.value.trim();
        const mbiemri = editLastName.value.trim();
        const email = editEmail.value.trim();

        if (!emri || !mbiemri || !email) {
            editMessage.textContent =
                "Plotësoni të gjitha fushat.";

            return;
        }

        if (
            emri === mesimdhenesiAktual.emri &&
            mbiemri === mesimdhenesiAktual.mbiemri &&
            email === mesimdhenesiAktual.email
        ) {
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
                "/api/mesimdhenesit/" +
                mesimdhenesiAktual.id +
                "/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        emri: emri,
                        mbiemri: mbiemri,
                        email: email
                    })
                }
            );

            editModal.close();

            try {
                await loadTeachers();

                listMessage.textContent =
                    "Të dhënat e mësimdhënësit u ndryshuan me sukses.";

                teachersStatus.textContent =
                    "Të dhënat u ndryshuan me sukses.";

            } catch (error) {
                listMessage.textContent =
                    "Ndryshimet u ruajtën, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            editMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;

            saveEditButton.disabled = false;
            saveEditButton.textContent = "Ruaj Ndryshimet";
        }
    });

    async function loadTeachers() {
        teachersStatus.textContent =
            "Duke ngarkuar mësimdhënësit...";

        mesimdhenesit = await loadAllTeachers();

        renderTeachers();
    }

    loadTeachers().catch(function (error) {
        teachersCount.textContent = "—";

        teachersTableBody.replaceChildren();

        teachersStatus.textContent = error.message;
    });
});