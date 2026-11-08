document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");

    if (!token) {
        window.location.replace("/login/");
        return;
    }

    const studentsCount = document.getElementById("students-count");
    const studentsTableBody = document.getElementById("students-table-body");
    const studentsStatus = document.getElementById("students-status");
    const studentsTableHeader = document.querySelector(".students-table-header");
    const addStudentButton = document.getElementById("open-student-form");

    const studentModal = document.getElementById("student-modal");
    const studentForm = document.getElementById("student-create-form");
    const studentFirstName = document.getElementById("student-first-name");
    const studentLastName = document.getElementById("student-last-name");
    const studentEmail = document.getElementById("student-email");
    const studentPassword = document.getElementById("student-password");
    const studentClass = document.getElementById("student-class");
    const studentFormMessage = document.getElementById("student-form-message");
    const saveStudentButton = document.getElementById("save-student-button");

    let klasat = [];
    let nxenesit = [];
    let kerkimi = "";
    let faqjaAktuale = 1;
    let dukeRuajtur = false;
    let editingStudent = null;

    const perFaqe = 10;

    studentFormMessage.textContent = "";

    const toolbar = document.createElement("div");
    toolbar.className = "student-list-tools";

    toolbar.innerHTML = `
        <input
            id="student-quick-search"
            class="student-search"
            type="search"
            placeholder="Kërko nxënës..."
            aria-label="Kërko nxënës"
        >

        <button
            id="open-all-students"
            class="student-all-button"
            type="button"
        >
            Shiko listën e plotë
        </button>
    `;

    studentsTableHeader.insertBefore(toolbar, addStudentButton);

    const fullListModal = document.createElement("dialog");
    fullListModal.className = "students-list-modal";
    fullListModal.setAttribute("aria-labelledby", "all-students-title");

    fullListModal.innerHTML = `
        <div class="students-list-modal-header">
            <div>
                <h2 id="all-students-title">Të gjithë nxënësit</h2>
                <p>Kërkoni dhe shikoni nxënësit sipas faqeve.</p>
            </div>

            <button
                id="close-all-students"
                type="button"
                aria-label="Mbyll listën"
            >
                ×
            </button>
        </div>

        <div class="students-list-modal-toolbar">
            <input
                id="all-students-search"
                class="student-search"
                type="search"
                placeholder="Kërko sipas emrit ose mbiemrit..."
                aria-label="Kërko nxënës"
            >

            <span id="all-students-count"></span>
        </div>

        <p
            id="all-students-message"
            class="all-students-message"
            role="status"
            aria-live="polite"
        ></p>

        <div class="students-list-modal-table">
            <table class="students-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Emri</th>
                        <th>Mbiemri</th>
                        <th>Email</th>
                        <th>Klasa</th>
                        <th>Veprimet</th>
                    </tr>
                </thead>

                <tbody id="all-students-table-body"></tbody>
            </table>
        </div>

        <div class="students-list-modal-footer">
            <span id="all-students-page"></span>

            <div>
                <button id="all-students-prev" type="button">
                    ← Para
                </button>

                <button id="all-students-next" type="button">
                    Pas →
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(fullListModal);

    const editModal = document.createElement("dialog");
    editModal.className = "student-modal";
    editModal.setAttribute("aria-labelledby", "edit-student-title");

    editModal.innerHTML = `
        <div class="student-modal-header">
            <div>
                <h2 id="edit-student-title">Ndrysho klasën</h2>
                <p id="edit-student-name"></p>
            </div>

            <button
                id="close-edit-student"
                type="button"
                class="student-close-button"
                aria-label="Mbyll formularin"
            >
                ×
            </button>
        </div>

        <form id="edit-student-form" class="student-form">
            <div class="student-form-field">
                <label for="edit-student-class">Klasa e re</label>

                <select
                    id="edit-student-class"
                    required
                ></select>
            </div>

            <p
                id="edit-student-message"
                class="student-form-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="student-form-actions">
                <button
                    id="cancel-edit-student"
                    type="button"
                    class="student-cancel-button"
                >
                    Anulo
                </button>

                <button
                    id="save-edit-student"
                    type="submit"
                    class="student-save-button"
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

        .student-list-tools {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
            margin-left: auto;
        }

        .student-search {
            box-sizing: border-box;
            width: 210px;
            min-height: 39px;
            padding: 9px 13px;
            border: 1px solid #e3d7f5;
            border-radius: 11px;
            background: #faf8ff;
            color: #302452;
            font: inherit;
            font-size: 12px;
            outline: none;
        }

        .student-search:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .student-all-button {
            min-height: 39px;
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

        .student-all-button:hover {
            background: #ebddff;
        }

        .students-list-modal:not([open]) {
            display: none;
        }

        .students-list-modal[open] {
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

        .students-list-modal::backdrop,
        .student-modal::backdrop {
            background: rgba(23, 13, 52, 0.5);
        }

        .students-list-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            padding: 20px 23px 13px;
            border-bottom: 1px solid #efe6fa;
        }

        .students-list-modal-header h2 {
            margin: 0 0 4px;
            font-size: 22px;
        }

        .students-list-modal-header p {
            margin: 0;
            font-size: 12px;
            color: #817397;
        }

        #close-all-students {
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 10px;
            background: #f3ecff;
            color: #7130cf;
            font-size: 23px;
            cursor: pointer;
        }

        .students-list-modal-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 14px 23px;
        }

        .students-list-modal-toolbar .student-search {
            width: min(360px, 100%);
        }

        #all-students-count {
            color: #817397;
            font-size: 12px;
        }

        .all-students-message {
            margin: 0;
            padding: 0 23px 12px;
            color: #7130cf;
            font-size: 12px;
            line-height: 1.5;
        }

        .all-students-message:empty {
            display: none;
        }

        .students-list-modal-table {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 23px;
        }

        .students-list-modal-table .students-table {
            min-width: 850px;
        }

        .students-list-modal-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            padding: 14px 23px 18px;
            border-top: 1px solid #efe6fa;
            color: #716283;
            font-size: 12px;
        }

        .students-list-modal-footer > div {
            display: flex;
            gap: 8px;
        }

        .students-list-modal-footer button {
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

        .students-list-modal-footer button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .students-list-modal-table .students-table td {
            padding: 12px 15px;
        }

        .students-list-modal-table .students-table th:nth-child(1) {
            width: 7%;
        }

        .students-list-modal-table .students-table th:nth-child(2) {
            width: 12%;
        }

        .students-list-modal-table .students-table th:nth-child(3) {
            width: 12%;
        }

        .students-list-modal-table .students-table th:nth-child(4) {
            width: 27%;
        }

        .students-list-modal-table .students-table th:nth-child(5) {
            width: 17%;
        }

        .students-list-modal-table .students-table th:nth-child(6) {
            width: 25%;
        }

        .student-row-actions {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .student-edit-button,
        .student-delete-button {
            min-height: 32px;
            padding: 7px 12px;
            border: 0;
            border-radius: 9px;
            font: inherit;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }

        .student-edit-button {
            background: #eee0ff;
            color: #7130cf;
        }

        .student-edit-button:hover {
            background: #dec3ff;
        }

        .student-delete-button {
            background: #ffe7ed;
            color: #c62d57;
        }

        .student-delete-button:hover {
            background: #ffd4df;
        }

        .student-edit-button:focus-visible,
        .student-delete-button:focus-visible {
            outline: 2px solid #7130cf;
            outline-offset: 2px;
        }

        @media (max-width: 850px) {
            .student-list-tools {
                margin-left: 0;
            }

            .students-list-modal-toolbar {
                flex-wrap: wrap;
            }
        }

        @media (max-width: 520px) {
            .student-list-tools,
            .student-search,
            .student-all-button {
                width: 100%;
            }

            .students-list-modal-header,
            .students-list-modal-toolbar,
            .students-list-modal-footer {
                padding-left: 14px;
                padding-right: 14px;
            }

            .students-list-modal-footer {
                flex-wrap: wrap;
            }
        }
    `;

    document.head.appendChild(style);

    const quickSearch = document.getElementById("student-quick-search");
    const allSearch = document.getElementById("all-students-search");
    const allTableBody = document.getElementById("all-students-table-body");
    const allCount = document.getElementById("all-students-count");
    const allPage = document.getElementById("all-students-page");
    const allMessage = document.getElementById("all-students-message");

    const prevPageButton = document.getElementById("all-students-prev");
    const nextPageButton = document.getElementById("all-students-next");

    const editForm = document.getElementById("edit-student-form");
    const editClass = document.getElementById("edit-student-class");
    const editMessage = document.getElementById("edit-student-message");
    const saveEditButton = document.getElementById("save-edit-student");

    function redirectToLogin() {
        [
            "schoolControlToken",
            "schoolControlRole",
            "schoolControlEmail"
        ].forEach(function (key) {
            sessionStorage.removeItem(key);
        });

        window.location.replace("/login/");
    }

    async function apiRequest(url, options = {}) {
        const target = new URL(url, window.location.origin);

        if (target.origin !== window.location.origin) {
            throw new Error("Adresa e kërkesës nuk është e vlefshme.");
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
                throw new Error("Nxënësi nuk u gjet.");
            }

            throw new Error(
                "Veprimi nuk u realizua. Provoni përsëri."
            );
        }

        return data;
    }

    async function fetchAllPages(url) {
        const items = [];
        const visited = new Set();

        let next = url;

        while (next) {
            const target = new URL(next, window.location.origin);

            if (visited.has(target.href) || visited.size >= 200) {
                throw new Error(
                    "Lista është shumë e madhe për t'u ngarkuar plotësisht."
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
                    "Formati i të dhënave nuk është i vlefshëm."
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

    function getClassName(student) {
        if (!student.klasa) {
            return "Pa klasë";
        }

        const classId =
            typeof student.klasa === "object"
                ? student.klasa.id
                : student.klasa;

        const foundClass = klasat.find(function (item) {
            return String(item.id) === String(classId);
        });

        return foundClass ? foundClass.emri : "ID: " + classId;
    }

    function filteredStudents() {
        const query = normalizeText(kerkimi);

        if (!query) {
            return nxenesit;
        }

        return nxenesit.filter(function (student) {
            const firstName = normalizeText(student.emri);
            const lastName = normalizeText(student.mbiemri);

            if (query.length === 1) {
                return (
                    firstName.startsWith(query) ||
                    lastName.startsWith(query)
                );
            }

            return [
                firstName,
                lastName,
                firstName + " " + lastName,
                normalizeText(student.email),
                normalizeText(getClassName(student))
            ].some(function (value) {
                return value.includes(query);
            });
        });
    }

    function openEditStudent(student) {
        if (dukeRuajtur) {
            return;
        }

        editingStudent = student;

        document.getElementById("edit-student-name").textContent =
            [student.emri, student.mbiemri]
                .filter(Boolean)
                .join(" ");

        editClass.replaceChildren();

        klasat.forEach(function (klasa) {
            const option = document.createElement("option");

            option.value = String(klasa.id);
            option.textContent = klasa.emri;

            editClass.appendChild(option);
        });

        editClass.value = String(
            typeof student.klasa === "object"
                ? student.klasa.id
                : student.klasa
        );

        editMessage.textContent = "";

        if (fullListModal.open) {
            fullListModal.close();
        }

        editModal.showModal();
    }

    function addRow(tbody, student, showActions) {
        const row = document.createElement("tr");

        [
            student.id,
            student.emri,
            student.mbiemri,
            student.email,
            getClassName(student)
        ].forEach(function (value) {
            const cell = document.createElement("td");

            cell.textContent = value ?? "—";
            row.appendChild(cell);
        });

        if (showActions) {
            const actionCell = document.createElement("td");
            const actionContainer = document.createElement("div");

            actionContainer.className = "student-row-actions";

            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.className = "student-edit-button";
            editButton.textContent = "Ndrysho";

            editButton.addEventListener("click", function () {
                openEditStudent(student);
            });

            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "student-delete-button";
            deleteButton.textContent = "Fshi";

            deleteButton.addEventListener("click", function () {
                deleteStudent(student);
            });

            actionContainer.appendChild(editButton);
            actionContainer.appendChild(deleteButton);

            actionCell.appendChild(actionContainer);
            row.appendChild(actionCell);
        }

        tbody.appendChild(row);
    }

    function renderLists() {
        const filtered = filteredStudents();

        studentsCount.textContent = nxenesit.length;

        studentsTableBody.replaceChildren();

        filtered.slice(0, 5).forEach(function (student) {
            addRow(studentsTableBody, student, false);
        });

        if (!nxenesit.length) {
            studentsStatus.textContent =
                "Nuk ka ende nxënës të regjistruar.";

        } else if (!filtered.length) {
            studentsStatus.textContent =
                "Nuk u gjet asnjë nxënës për këtë kërkim.";

        } else if (filtered.length > 5) {
            studentsStatus.textContent =
                "Po shfaqen 5 nga " +
                filtered.length +
                " nxënës. Klikoni «Shiko listën e plotë» për të tjerët.";

        } else {
            studentsStatus.textContent = "";
        }

        const totalPages = Math.max(
            1,
            Math.ceil(filtered.length / perFaqe)
        );

        faqjaAktuale = Math.min(faqjaAktuale, totalPages);

        const start = (faqjaAktuale - 1) * perFaqe;

        allTableBody.replaceChildren();

        filtered
            .slice(start, start + perFaqe)
            .forEach(function (student) {
                addRow(allTableBody, student, true);
            });

        if (!filtered.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 6;
            cell.textContent = "Nuk u gjet asnjë nxënës.";
            cell.style.textAlign = "center";

            row.appendChild(cell);
            allTableBody.appendChild(row);
        }

        allCount.textContent = filtered.length + " nxënës";

        allPage.textContent =
            "Faqja " + faqjaAktuale + " nga " + totalPages;

        prevPageButton.disabled = faqjaAktuale === 1;
        nextPageButton.disabled = faqjaAktuale === totalPages;
    }

    function updateSearch(value) {
        kerkimi = value;

        quickSearch.value = value;
        allSearch.value = value;

        faqjaAktuale = 1;

        renderLists();
    }

    async function deleteStudent(student) {
        if (dukeRuajtur) {
            return;
        }

        const fullName = [
            student.emri,
            student.mbiemri
        ].filter(Boolean).join(" ");

        const confirmed = window.confirm(
            'A dëshironi të fshini nxënësin "' +
            fullName +
            '"?\n\n' +
            "Do të fshihet edhe llogaria e tij e përdoruesit.\n" +
            "Ky veprim nuk mund të zhbëhet."
        );

        if (!confirmed) {
            return;
        }

        dukeRuajtur = true;

        allMessage.textContent = "Duke fshirë nxënësin...";

        try {
            await apiRequest(
                "/api/nxenesit/" + student.id + "/",
                {
                    method: "DELETE"
                }
            );

            try {
                await loadStudents();

                allMessage.textContent =
                    "Nxënësi u fshi me sukses.";

                studentsStatus.textContent =
                    "Nxënësi u fshi me sukses.";

            } catch (error) {
                allMessage.textContent =
                    "Nxënësi u fshi, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            allMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;
        }
    }

    quickSearch.addEventListener("input", function () {
        updateSearch(quickSearch.value);
    });

    allSearch.addEventListener("input", function () {
        updateSearch(allSearch.value);
    });

    document.getElementById("open-all-students")
        .addEventListener("click", function () {
            faqjaAktuale = 1;

            allMessage.textContent = "";

            renderLists();

            fullListModal.showModal();
            allSearch.focus();
        });

    document.getElementById("close-all-students")
        .addEventListener("click", function () {
            fullListModal.close();
        });

    prevPageButton.addEventListener("click", function () {
        if (faqjaAktuale > 1) {
            faqjaAktuale--;
            renderLists();
        }
    });

    nextPageButton.addEventListener("click", function () {
        const totalPages = Math.ceil(
            filteredStudents().length / perFaqe
        );

        if (faqjaAktuale < totalPages) {
            faqjaAktuale++;
            renderLists();
        }
    });

    document.getElementById("close-edit-student")
        .addEventListener("click", function () {
            editModal.close();
        });

    document.getElementById("cancel-edit-student")
        .addEventListener("click", function () {
            editModal.close();
        });

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!editingStudent || dukeRuajtur) {
            return;
        }

        if (!editClass.value) {
            editMessage.textContent = "Zgjidhni klasën.";
            return;
        }

        const previousClass =
            typeof editingStudent.klasa === "object"
                ? editingStudent.klasa.id
                : editingStudent.klasa;

        if (String(previousClass) === editClass.value) {
            editMessage.textContent =
                "Kjo është klasa aktuale e nxënësit.";

            return;
        }

        dukeRuajtur = true;

        saveEditButton.disabled = true;
        saveEditButton.textContent = "Duke ruajtur...";

        try {
            const [notat, mungesat] = await Promise.all([
                fetchAllPages("/api/notat/"),
                fetchAllPages("/api/mungesat/")
            ]);

            const kaShenime = [...notat, ...mungesat].some(
                function (entry) {
                    const nxenesiId =
                        typeof entry.nxenesi === "object"
                            ? entry.nxenesi.id
                            : entry.nxenesi;

                    return (
                        String(nxenesiId) ===
                        String(editingStudent.id)
                    );
                }
            );

            if (kaShenime) {
                throw new Error(
                    "Ky nxënës ka nota ose mungesa. Klasa nuk mund të ndryshohet pa rishikuar të dhënat shkollore."
                );
            }

            await apiRequest(
                "/api/nxenesit/" + editingStudent.id + "/",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        klasa: Number(editClass.value)
                    })
                }
            );

            editModal.close();

            await loadStudents();

            studentsStatus.textContent =
                "Klasa e nxënësit u ndryshua me sukses.";

        } catch (error) {
            editMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;

            saveEditButton.disabled = false;
            saveEditButton.textContent = "Ruaj Ndryshimin";
        }
    });

    function loadClassOptions() {
        studentClass.replaceChildren();

        const first = document.createElement("option");

        first.value = "";
        first.textContent = "Zgjidhni klasën";

        studentClass.appendChild(first);

        klasat.forEach(function (klasa) {
            const option = document.createElement("option");

            option.value = String(klasa.id);
            option.textContent = klasa.emri;

            studentClass.appendChild(option);
        });

        studentClass.disabled = klasat.length === 0;
        saveStudentButton.disabled = klasat.length === 0;
    }

    async function loadStudents() {
        studentsStatus.textContent = "Duke ngarkuar nxënësit...";

        const results = await Promise.all([
            fetchAllPages("/api/nxenesit/"),
            fetchAllPages("/api/klasat/")
        ]);

        nxenesit = results[0];
        klasat = results[1];

        loadClassOptions();
        renderLists();
    }

    studentForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (dukeRuajtur) {
            return;
        }

        const emri = studentFirstName.value.trim();
        const mbiemri = studentLastName.value.trim();
        const email = studentEmail.value.trim();
        const fjalekalimi = studentPassword.value;
        const klasa = studentClass.value;

        if (!emri || !mbiemri || !email || !fjalekalimi || !klasa) {
            studentFormMessage.textContent =
                "Plotësoni të gjitha fushat.";

            return;
        }

        dukeRuajtur = true;

        saveStudentButton.disabled = true;
        saveStudentButton.textContent = "Duke ruajtur...";

        studentFormMessage.textContent =
            "Duke regjistruar nxënësin...";

        try {
            await apiRequest("/api/nxenesit/regjistro/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    emri,
                    mbiemri,
                    email,
                    fjalekalimi,
                    klasa: Number(klasa)
                })
            });

            studentForm.reset();
            studentModal.close();

            updateSearch("");

            try {
                await loadStudents();

                studentsStatus.textContent =
                    "Nxënësi u regjistrua me sukses.";

            } catch (error) {
                studentsStatus.textContent =
                    "Nxënësi u regjistrua, por lista nuk u rifreskua. Rifreskoni faqen.";
            }

        } catch (error) {
            studentFormMessage.textContent = error.message;

        } finally {
            dukeRuajtur = false;

            saveStudentButton.disabled = klasat.length === 0;
            saveStudentButton.textContent = "Ruaj Nxënësin";
        }
    });

    studentModal.addEventListener("close", function () {
        if (!dukeRuajtur) {
            studentForm.reset();
        }

        studentFormMessage.textContent = "";
    });

    loadStudents().catch(function (error) {
        studentsCount.textContent = "—";

        studentsTableBody.replaceChildren();

        studentsStatus.textContent = error.message;

        saveStudentButton.disabled = true;
    });
});