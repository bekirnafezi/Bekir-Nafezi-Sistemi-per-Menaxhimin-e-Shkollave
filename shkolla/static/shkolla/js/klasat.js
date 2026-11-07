document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");

    const classesCount = document.getElementById("classes-count");
    const classesTableBody = document.getElementById("classes-table-body");
    const classesStatus = document.getElementById("classes-status");

    const classCreatePanel = document.getElementById("class-create-panel");
    const classCreateForm = document.getElementById("class-create-form");
    const className = document.getElementById("class-name");
    const classTeacher = document.getElementById("class-teacher");
    const classFormMessage = document.getElementById("class-form-message");
    const saveClassButton = document.getElementById("save-class-button");

    const formTitle = classCreatePanel.querySelector("summary span:first-child");
    const formActions = classCreateForm.querySelector(".class-form-actions");

    let mesimdhenesit = [];
    let editingClassId = null;
    let isSaving = false;

    if (!token) {
        window.location.replace("/login/");
        return;
    }

    const extraStyles = document.createElement("style");

    extraStyles.textContent = `
        .classes-table th:first-child {
            width: 9%;
        }

        .classes-table th:nth-child(2) {
            width: 28%;
        }

        .classes-table th:nth-child(3) {
            width: auto;
        }

        .classes-table th:nth-child(4) {
            width: 170px;
            text-align: center;
        }

        .classes-table td:last-child {
            text-align: center;
        }

        .class-actions-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .class-action-button {
            min-height: 32px;
            padding: 7px 12px;
            border: none;
            border-radius: 9px;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
        }

        .class-edit-button {
            background: #eee0ff;
            color: #7130cf;
        }

        .class-edit-button:hover {
            background: #dfc7ff;
        }

        .class-delete-button {
            background: #ffe6eb;
            color: #d33e60;
        }

        .class-delete-button:hover {
            background: #ffd0da;
        }

        .class-cancel-button {
            min-height: 35px;
            padding: 9px 16px;
            border: 1px solid #ded0f2;
            border-radius: 11px;
            background: #ffffff;
            color: #66557f;
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }

        .class-cancel-button:hover {
            background: #f5efff;
        }

        .class-cancel-button[hidden] {
            display: none;
        }

        .class-action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .class-action-button:focus-visible,
        .class-cancel-button:focus-visible {
            outline: 2px solid #7938e8;
            outline-offset: 2px;
        }
    `;

    document.head.appendChild(extraStyles);

    const tableHeader = document.querySelector(".classes-table thead tr");

    if (tableHeader) {
        const actionsHeader = document.createElement("th");
        actionsHeader.textContent = "Veprimet";
        tableHeader.appendChild(actionsHeader);
    }

    const cancelEditButton = document.createElement("button");

    cancelEditButton.type = "button";
    cancelEditButton.className = "class-cancel-button";
    cancelEditButton.textContent = "Anulo";
    cancelEditButton.hidden = true;

    formActions.insertBefore(cancelEditButton, saveClassButton);

    function redirectToLogin() {
        sessionStorage.removeItem("schoolControlToken");
        sessionStorage.removeItem("schoolControlRole");
        sessionStorage.removeItem("schoolControlEmail");

        window.location.replace("/login/");
    }

    async function apiRequest(url, options = {}) {
        const headers = {
            Authorization: "Token " + token,
            Accept: "application/json",
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            redirectToLogin();
            throw new Error("Identifikimi ka skaduar.");
        }

        if (response.status === 403) {
            throw new Error("Nuk keni leje për këtë veprim.");
        }

        let data = null;

        const responseText = await response.text();

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                data = null;
            }
        }

        if (!response.ok) {
            if (data && typeof data === "object") {
                const messages = [];

                Object.values(data).forEach(function (value) {
                    if (Array.isArray(value)) {
                        messages.push(value.join(" "));
                    } else if (typeof value === "string") {
                        messages.push(value);
                    }
                });

                if (messages.length > 0) {
                    throw new Error(messages.join(" "));
                }
            }

            if (response.status === 404) {
                throw new Error("Klasa nuk u gjet në databazë.");
            }

            throw new Error("Veprimi nuk u realizua. Provoni përsëri.");
        }

        return data;
    }

    function getItems(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.results)) {
            return data.results;
        }

        return [];
    }

    function getTeacherName(teacher) {
        if (!teacher) {
            return "Nuk është caktuar";
        }

        const fullName = [
            teacher.emri,
            teacher.mbiemri
        ].filter(Boolean).join(" ");

        if (fullName) {
            return fullName;
        }

        if (teacher.email) {
            return teacher.email;
        }

        return "Mësimdhënësi " + teacher.id;
    }

    async function loadTeachers() {
        const data = await apiRequest("/api/mesimdhenesit/");

        mesimdhenesit = getItems(data);

        classTeacher.innerHTML = "";

        const defaultOption = document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent = "Pa kujdestar";

        classTeacher.appendChild(defaultOption);

        mesimdhenesit.forEach(function (teacher) {
            const option = document.createElement("option");

            option.value = String(teacher.id);
            option.textContent = getTeacherName(teacher);

            classTeacher.appendChild(option);
        });
    }

    function getClassTeacherId(klasa) {
        if (
            klasa.kujdestari === null ||
            klasa.kujdestari === undefined ||
            klasa.kujdestari === ""
        ) {
            return "";
        }

        if (typeof klasa.kujdestari === "object") {
            return String(klasa.kujdestari.id);
        }

        return String(klasa.kujdestari);
    }

    function getClassTeacherName(klasa) {
        const teacherId = getClassTeacherId(klasa);

        if (!teacherId) {
            return "Nuk është caktuar";
        }

        const teacher = mesimdhenesit.find(function (item) {
            return String(item.id) === teacherId;
        });

        if (teacher) {
            return getTeacherName(teacher);
        }

        return "ID: " + teacherId;
    }

    function resetForm() {
        editingClassId = null;

        classCreateForm.reset();

        formTitle.textContent = "＋ Shto Klasë të Re";

        saveClassButton.textContent = "Ruaj Klasën";

        cancelEditButton.hidden = true;

        classFormMessage.textContent =
            "Plotësoni të dhënat e klasës.";
    }

    function startEditing(klasa) {
        if (isSaving) {
            return;
        }

        editingClassId = klasa.id;

        classCreatePanel.open = true;

        formTitle.textContent = "✎ Ndrysho Klasën";

        className.value = klasa.emri;

        const teacherId = getClassTeacherId(klasa);

        if (
            teacherId &&
            !Array.from(classTeacher.options).some(function (option) {
                return option.value === teacherId;
            })
        ) {
            const option = document.createElement("option");

            option.value = teacherId;
            option.textContent = "Kujdestari ID: " + teacherId;

            classTeacher.appendChild(option);
        }

        classTeacher.value = teacherId;

        saveClassButton.textContent = "Ruaj Ndryshimet";

        cancelEditButton.hidden = false;

        classFormMessage.textContent =
            "Ndryshoni të dhënat dhe ruani përditësimin.";

        className.focus();
    }

    function createActionButton(text, classNameValue) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = text;
        button.className = "class-action-button " + classNameValue;

        return button;
    }

    function renderClasses(klasat, totalCount = klasat.length) {
        classesTableBody.innerHTML = "";

        classesCount.textContent = totalCount;

        if (klasat.length === 0) {
            classesStatus.textContent =
                "Nuk ka ende klasa të regjistruara.";
            return;
        }

        klasat.forEach(function (klasa) {
            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            const nameCell = document.createElement("td");
            const teacherCell = document.createElement("td");
            const actionsCell = document.createElement("td");

            idCell.textContent = klasa.id;
            nameCell.textContent = klasa.emri;
            teacherCell.textContent = getClassTeacherName(klasa);

            const actionsContainer = document.createElement("div");

            actionsContainer.className = "class-actions-cell";

            const editButton = createActionButton(
                "Ndrysho",
                "class-edit-button"
            );

            const deleteButton = createActionButton(
                "Fshi",
                "class-delete-button"
            );

            editButton.addEventListener("click", function () {
                startEditing(klasa);
            });

            deleteButton.addEventListener("click", function () {
                deleteClass(klasa);
            });

            actionsContainer.appendChild(editButton);
            actionsContainer.appendChild(deleteButton);

            actionsCell.appendChild(actionsContainer);

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(teacherCell);
            row.appendChild(actionsCell);

            classesTableBody.appendChild(row);
        });

        classesStatus.textContent = "";
    }

    async function loadClasses() {
        classesStatus.textContent = "Duke ngarkuar klasat...";

        const data = await apiRequest("/api/klasat/");

        const klasat = getItems(data);

        const totalCount = data && typeof data.count === "number"
            ? data.count
            : klasat.length;

        renderClasses(klasat, totalCount);
    }

    async function deleteClass(klasa) {
        if (isSaving) {
            return;
        }

        const confirmed = window.confirm(
            'A jeni të sigurt që dëshironi të fshini klasën "' +
            klasa.emri +
            '"?\n\nKy veprim nuk mund të zhbëhet.'
        );

        if (!confirmed) {
            return;
        }

        isSaving = true;

        classesStatus.textContent = "Duke fshirë klasën...";

        try {
            await apiRequest("/api/klasat/" + klasa.id + "/", {
                method: "DELETE"
            });

            if (String(editingClassId) === String(klasa.id)) {
                resetForm();
                classCreatePanel.open = false;
            }

            await loadClasses();

            classesStatus.textContent =
                "Klasa u fshi me sukses.";

        } catch (error) {
            classesStatus.textContent = error.message;
        } finally {
            isSaving = false;
        }
    }

    async function initializePage() {
        try {
            await loadTeachers();
        } catch (error) {
            classFormMessage.textContent =
                "Mësimdhënësit nuk u ngarkuan. Mund të shtoni klasë pa kujdestar.";
        }

        try {
            await loadClasses();
        } catch (error) {
            classesCount.textContent = "—";
            classesStatus.textContent = error.message;
        }
    }

    cancelEditButton.addEventListener("click", function () {
        if (isSaving) {
            return;
        }

        resetForm();
    });

    classCreateForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        const emri = className.value.trim();
        const kujdestari = classTeacher.value;

        if (!emri) {
            classFormMessage.textContent =
                "Ju lutem shkruani emrin e klasës.";

            className.focus();
            return;
        }

        const classData = {
            emri: emri,
            kujdestari: kujdestari ? Number(kujdestari) : null
        };

        const isEditing = editingClassId !== null;

        const url = isEditing
            ? "/api/klasat/" + editingClassId + "/"
            : "/api/klasat/";

        const method = isEditing ? "PATCH" : "POST";

        isSaving = true;

        saveClassButton.disabled = true;

        saveClassButton.textContent = isEditing
            ? "Duke ndryshuar..."
            : "Duke ruajtur...";

        classFormMessage.textContent =
            "Duke ruajtur të dhënat në sistem...";

        try {
            await apiRequest(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(classData)
            });

            resetForm();

            classCreatePanel.open = false;

            await loadClasses();

            classesStatus.textContent = isEditing
                ? "Klasa u përditësua me sukses."
                : "Klasa u regjistrua me sukses.";

        } catch (error) {
            classFormMessage.textContent = error.message;
        } finally {
            isSaving = false;

            saveClassButton.disabled = false;

            saveClassButton.textContent = editingClassId !== null
                ? "Ruaj Ndryshimet"
                : "Ruaj Klasën";
        }
    });

    saveClassButton.disabled = false;

    initializePage();
});