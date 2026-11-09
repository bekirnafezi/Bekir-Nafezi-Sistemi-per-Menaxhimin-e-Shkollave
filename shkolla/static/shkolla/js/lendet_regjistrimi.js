document.addEventListener("DOMContentLoaded", function () {
    const token = sessionStorage.getItem("schoolControlToken");
    const tableHeader = document.querySelector(".students-table-header");

    if (!token || !tableHeader) {
        return;
    }

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.id = "open-subject-form";
    addButton.className = "subject-add-button";
    addButton.textContent = "+ Shto Lëndë";

    tableHeader.appendChild(addButton);

    const modal = document.createElement("dialog");

    modal.className = "subject-registration-modal";
    modal.setAttribute("aria-labelledby", "subject-form-title");

    modal.innerHTML = `
        <div class="subject-registration-header">
            <div>
                <h2 id="subject-form-title">Shto Lëndë</h2>
                <p>Regjistroni një lëndë të re në sistem.</p>
            </div>

            <button
                id="close-subject-form"
                type="button"
                aria-label="Mbyll formularin"
            >
                ×
            </button>
        </div>

        <form id="subject-registration-form">
            <div class="subject-form-field">
                <label for="subject-name">Emri i lëndës</label>

                <input
                    id="subject-name"
                    name="emri"
                    type="text"
                    placeholder="Shembull: Biologji"
                    maxlength="100"
                    required
                >
            </div>

            <p
                id="subject-form-message"
                role="status"
                aria-live="polite"
            ></p>

            <div class="subject-form-actions">
                <button
                    id="cancel-subject-form"
                    type="button"
                    class="subject-cancel-button"
                >
                    Anulo
                </button>

                <button
                    id="save-subject-button"
                    type="submit"
                    class="subject-save-button"
                >
                    Ruaj Lëndën
                </button>
            </div>
        </form>
    `;

    document.body.appendChild(modal);

    const style = document.createElement("style");

    style.textContent = `
        .subject-add-button {
            min-height: 40px;
            padding: 10px 17px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #9138ed, #6e2bd9);
            color: white;
            font: inherit;
            font-size: 13px;
            font-weight: 750;
            white-space: nowrap;
            cursor: pointer;
        }

        .subject-add-button:hover {
            background: #6826cb;
        }

        .subject-registration-modal:not([open]) {
            display: none;
        }

        .subject-registration-modal[open] {
            box-sizing: border-box;
            width: min(580px, calc(100% - 32px));
            max-width: none;
            max-height: calc(100dvh - 40px);
            margin: auto;
            padding: 0;
            border: 1px solid #e7dcf7;
            border-radius: 20px;
            background: white;
            color: #281951;
            box-shadow: 0 20px 55px rgba(30, 16, 72, 0.25);
            overflow-y: auto;
        }

        .subject-registration-modal::backdrop {
            background: rgba(23, 13, 52, 0.5);
        }

        .subject-registration-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 24px 30px 20px;
            border-bottom: 1px solid #eee5fa;
        }

        .subject-registration-header h2 {
            margin: 0 0 7px;
            font-size: 24px;
            font-weight: 800;
            color: #281951;
        }

        .subject-registration-header p {
            margin: 0;
            font-size: 13px;
            color: #84749a;
        }

        #close-subject-form {
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

        #subject-registration-form {
            padding: 26px 30px 28px;
        }

        .subject-form-field {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .subject-form-field label {
            font-size: 13px;
            font-weight: 750;
            color: #302452;
        }

        .subject-form-field input {
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

        .subject-form-field input:focus {
            border-color: #8c42e6;
            box-shadow: 0 0 0 3px rgba(140, 66, 230, 0.1);
        }

        #subject-form-message {
            margin: 16px 0 0;
            font-size: 13px;
            line-height: 1.5;
            color: #c62d57;
        }

        #subject-form-message:empty {
            display: none;
        }

        .subject-form-actions {
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
            border: none;
            background: linear-gradient(135deg, #9138ed, #6e2bd9);
            color: white;
        }

        .subject-save-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        @media (max-width: 600px) {
            .subject-registration-header,
            #subject-registration-form {
                padding: 20px;
            }

            .subject-add-button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);

    const form = document.getElementById("subject-registration-form");
    const nameInput = document.getElementById("subject-name");
    const formMessage = document.getElementById("subject-form-message");
    const saveButton = document.getElementById("save-subject-button");
    const closeButton = document.getElementById("close-subject-form");
    const cancelButton = document.getElementById("cancel-subject-form");

    let dukeRuajtur = false;

    function openForm() {
        form.reset();
        formMessage.textContent = "";

        modal.showModal();
        nameInput.focus();
    }

    function closeForm() {
        if (!dukeRuajtur) {
            modal.close();
        }
    }

    addButton.addEventListener("click", openForm);
    closeButton.addEventListener("click", closeForm);
    cancelButton.addEventListener("click", closeForm);

    modal.addEventListener("cancel", function (event) {
        if (dukeRuajtur) {
            event.preventDefault();
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (dukeRuajtur) {
            return;
        }

        const emri = nameInput.value.trim();

        if (!emri) {
            formMessage.textContent = "Shkruani emrin e lëndës.";
            return;
        }

        dukeRuajtur = true;
        saveButton.disabled = true;
        saveButton.textContent = "Duke ruajtur...";
        formMessage.textContent = "";

        try {
            const response = await fetch("/api/lendet/", {
                method: "POST",
                headers: {
                    "Authorization": "Token " + token,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    emri: emri
                })
            });

            const data = await response.json().catch(function () {
                return {};
            });

            if (response.status === 401) {
                window.location.replace("/login/");
                return;
            }

            if (!response.ok) {
                let gabimi = data.gabim || data.detail;

                if (!gabimi && typeof data === "object") {
                    gabimi = Object.values(data).flat().join(" ");
                }

                throw new Error(
                    gabimi || "Lënda nuk u regjistrua."
                );
            }

            formMessage.style.color = "#268047";
            formMessage.textContent = "Lënda u regjistrua me sukses.";

            setTimeout(function () {
                window.location.reload();
            }, 700);

        } catch (error) {
            formMessage.style.color = "#c62d57";
            formMessage.textContent = error.message;

            dukeRuajtur = false;
            saveButton.disabled = false;
            saveButton.textContent = "Ruaj Lëndën";
        }
    });
});