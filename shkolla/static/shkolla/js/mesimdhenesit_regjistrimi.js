document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");
    const tableHeader = document.querySelector(".students-table-header");

    if (!token || !tableHeader) {
        return;
    }

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.id = "open-teacher-form";
    addButton.className = "teacher-add-button";
    addButton.textContent = "+ Shto Mësimdhënës";

    tableHeader.appendChild(addButton);

    const modal = document.createElement("dialog");

    modal.id = "teacher-registration-modal";
    modal.className = "teacher-registration-modal";

    modal.innerHTML = `
        <div class="teacher-registration-header">

            <div>
                <h2>Shto Mësimdhënës</h2>
                <p>Plotësoni të dhënat e mësimdhënësit.</p>
            </div>

            <button
                type="button"
                id="close-teacher-form"
                class="teacher-close-button"
                aria-label="Mbyll formularin"
            >
                ×
            </button>

        </div>

        <form id="teacher-registration-form">

            <div class="teacher-form-grid">

                <div class="teacher-form-field">
                    <label for="teacher-first-name">
                        Emri
                    </label>

                    <input
                        type="text"
                        id="teacher-first-name"
                        name="emri"
                        placeholder="Shkruani emrin"
                        maxlength="150"
                        autocomplete="given-name"
                        required
                    >
                </div>

                <div class="teacher-form-field">
                    <label for="teacher-last-name">
                        Mbiemri
                    </label>

                    <input
                        type="text"
                        id="teacher-last-name"
                        name="mbiemri"
                        placeholder="Shkruani mbiemrin"
                        maxlength="150"
                        autocomplete="family-name"
                        required
                    >
                </div>

                <div class="teacher-form-field teacher-full-width">
                    <label for="teacher-email">
                        Email
                    </label>

                    <input
                        type="email"
                        id="teacher-email"
                        name="email"
                        placeholder="Shembull: emri@email.com"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="teacher-form-field teacher-full-width">
                    <label for="teacher-password">
                        Fjalëkalimi
                    </label>

                    <input
                        type="password"
                        id="teacher-password"
                        name="fjalekalimi"
                        placeholder="Shkruani fjalëkalimin"
                        autocomplete="new-password"
                        minlength="8"
                        required
                    >
                </div>

            </div>

            <p
                id="teacher-form-message"
                class="teacher-form-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="teacher-form-actions">

                <button
                    type="button"
                    id="cancel-teacher-form"
                    class="teacher-cancel-button"
                >
                    Anulo
                </button>

                <button
                    type="submit"
                    id="save-teacher-button"
                    class="teacher-save-button"
                >
                    Ruaj Mësimdhënësin
                </button>

            </div>

        </form>
    `;

    document.body.appendChild(modal);

    const style = document.createElement("style");

    style.textContent = `
        .teacher-add-button {
            min-height: 40px;
            padding: 10px 17px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(
                135deg,
                #9138ed,
                #6e2bd9
            );
            color: #ffffff;
            font: inherit;
            font-size: 13px;
            font-weight: 750;
            white-space: nowrap;
            cursor: pointer;
        }

        .teacher-add-button:hover {
            background: #6826cb;
        }

        .teacher-registration-modal:not([open]) {
            display: none;
        }

        .teacher-registration-modal[open] {
            box-sizing: border-box;
            width: min(650px, calc(100% - 32px));
            max-width: none;
            max-height: calc(100dvh - 40px);
            margin: auto;
            padding: 0;
            border: 1px solid #e7dcf7;
            border-radius: 20px;
            background: #ffffff;
            color: #281951;
            box-shadow: 0 20px 55px rgba(30, 16, 72, 0.25);
            overflow-y: auto;
        }

        .teacher-registration-modal::backdrop {
            background: rgba(23, 13, 52, 0.5);
        }

        .teacher-registration-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 24px 30px 20px;
            border-bottom: 1px solid #eee5fa;
        }

        .teacher-registration-header h2 {
            margin: 0 0 7px;
            color: #281951;
            font-size: 24px;
            font-weight: 800;
        }

        .teacher-registration-header p {
            margin: 0;
            color: #84749a;
            font-size: 13px;
        }

        .teacher-close-button {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            border: none;
            border-radius: 11px;
            background: #f4edff;
            color: #7130cf;
            font-size: 24px;
            cursor: pointer;
        }

        #teacher-registration-form {
            padding: 25px 30px 28px;
        }

        .teacher-form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 19px;
        }

        .teacher-form-field {
            display: flex;
            flex-direction: column;
            gap: 9px;
            min-width: 0;
        }

        .teacher-full-width {
            grid-column: 1 / -1;
        }

        .teacher-form-field label {
            color: #302452;
            font-size: 13px;
            font-weight: 750;
        }

        .teacher-form-field input {
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

        .teacher-form-field input:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        .teacher-form-message {
            margin: 17px 0 0;
            color: #c62d57;
            font-size: 13px;
            line-height: 1.5;
        }

        .teacher-form-message:empty {
            display: none;
        }

        .teacher-form-actions {
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
            background: #ffffff;
            color: #71558c;
        }

        .teacher-save-button {
            border: none;
            background: linear-gradient(
                135deg,
                #9138ed,
                #6e2bd9
            );
            color: #ffffff;
        }

        .teacher-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 650px) {
            .teacher-form-grid {
                grid-template-columns: 1fr;
            }

            .teacher-full-width {
                grid-column: auto;
            }

            .teacher-registration-header {
                padding: 20px;
            }

            #teacher-registration-form {
                padding: 20px;
            }

            .teacher-add-button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);

    const form = document.getElementById(
        "teacher-registration-form"
    );

    const closeButton = document.getElementById(
        "close-teacher-form"
    );

    const cancelButton = document.getElementById(
        "cancel-teacher-form"
    );

    const saveButton = document.getElementById(
        "save-teacher-button"
    );

    const formMessage = document.getElementById(
        "teacher-form-message"
    );

    const firstNameInput = document.getElementById(
        "teacher-first-name"
    );

    const lastNameInput = document.getElementById(
        "teacher-last-name"
    );

    const emailInput = document.getElementById(
        "teacher-email"
    );

    const passwordInput = document.getElementById(
        "teacher-password"
    );

    let dukeRuajtur = false;

    function openForm() {
        form.reset();
        formMessage.textContent = "";

        modal.showModal();

        firstNameInput.focus();
    }

    function closeForm() {
        if (dukeRuajtur) {
            return;
        }

        modal.close();
    }

    addButton.addEventListener("click", openForm);

    closeButton.addEventListener("click", closeForm);

    cancelButton.addEventListener("click", closeForm);

    modal.addEventListener("cancel", function (event) {
        if (dukeRuajtur) {
            event.preventDefault();
        }
    });

    modal.addEventListener("close", function () {
        if (!dukeRuajtur) {
            form.reset();
            formMessage.textContent = "";
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (dukeRuajtur) {
            return;
        }

        const emri = firstNameInput.value.trim();
        const mbiemri = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const fjalekalimi = passwordInput.value;

        if (!emri || !mbiemri || !email || !fjalekalimi) {
            formMessage.textContent =
                "Plotësoni të gjitha fushat.";

            return;
        }

        dukeRuajtur = true;

        saveButton.disabled = true;
        saveButton.textContent = "Duke ruajtur...";

        formMessage.textContent = "";

        try {
            const response = await fetch(
                "/api/mesimdhenesit/regjistro/",
                {
                    method: "POST",
                    headers: {
                        "Authorization": "Token " + token,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        emri: emri,
                        mbiemri: mbiemri,
                        email: email,
                        fjalekalimi: fjalekalimi
                    })
                }
            );

            const data = await response.json().catch(
                function () {
                    return {};
                }
            );

            if (response.status === 401) {
                window.location.replace("/login/");
                return;
            }

            if (!response.ok) {
                let gabimi = data.gabim || data.detail;

                if (!gabimi && typeof data === "object") {
                    gabimi = Object.values(data)
                        .flat()
                        .join(" ");
                }

                throw new Error(
                    gabimi ||
                    "Regjistrimi nuk u realizua."
                );
            }

            formMessage.style.color = "#268047";

            formMessage.textContent =
                "Mësimdhënësi u regjistrua me sukses.";

            setTimeout(function () {
                window.location.reload();
            }, 800);

        } catch (error) {
            formMessage.style.color = "#c62d57";
            formMessage.textContent = error.message;

            dukeRuajtur = false;
            saveButton.disabled = false;
            saveButton.textContent = "Ruaj Mësimdhënësin";
        }
    });
});