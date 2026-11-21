
document.addEventListener("DOMContentLoaded", async () => {
    const tipi = document.body.dataset.module;

    if (!["notat", "mungesat"].includes(tipi)) return;

    const token = sessionStorage.getItem("schoolControlToken");
    if (!token) return;

    const headers = {
        Authorization: `Token ${token}`
    };

    const kontrolli = await fetch(`/api/statistika/${tipi}/`, {
        headers
    }).catch(() => null);

    if (!kontrolli || !kontrolli.ok) return;

    const style = document.createElement("style");

    style.textContent = `
        .korrigjim-panel {
            background: #ffffff;
            border: 1px solid #e4d6b5;
            border-radius: 20px;
            padding: 24px;
            display: grid;
            gap: 17px;
        }

        .korrigjim-panel h2 {
            color: #a66f12;
            font-size: 20px;
            margin: 0;
        }

        .korrigjim-panel p {
            font-size: 13px;
            color: #668092;
            margin: 0;
        }

        .korrigjim-form {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 15px;
        }

        .korrigjim-field {
            display: grid;
            gap: 7px;
        }

        .korrigjim-field.full {
            grid-column: 1 / -1;
        }

        .korrigjim-field label {
            color: #896019;
            font-size: 12px;
            font-weight: 700;
        }

        .korrigjim-field select,
        .korrigjim-field input,
        .korrigjim-field textarea {
            width: 100%;
            min-width: 0;
            padding: 12px;
            border: 1px solid #dfc998;
            border-radius: 10px;
            background: #fffdf8;
            color: #23465d;
            font: inherit;
            font-size: 13px;
        }

        .korrigjim-actions {
            grid-column: 1 / -1;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .korrigjim-save,
        .korrigjim-delete {
            padding: 12px 18px;
            border-radius: 11px;
            border: none;
            font-weight: 700;
            cursor: pointer;
        }

        .korrigjim-save {
            background: linear-gradient(135deg, #ebbb50, #b67b16);
            color: white;
        }

        .korrigjim-delete {
            background: #ffe9e9;
            color: #a92c2c;
        }

        .korrigjim-save:disabled,
        .korrigjim-delete:disabled {
            opacity: .5;
            cursor: not-allowed;
        }

        .korrigjim-message {
            grid-column: 1 / -1;
            font-size: 13px;
            color: #476b80;
        }

        @media (max-width: 650px) {
            .korrigjim-panel {
                padding: 16px;
            }

            .korrigjim-form {
                grid-template-columns: 1fr;
            }

            .korrigjim-field.full,
            .korrigjim-actions,
            .korrigjim-message {
                grid-column: 1;
            }
        }
    `;

    document.head.appendChild(style);

    const panel = document.createElement("section");
    panel.className = "korrigjim-panel";

    panel.innerHTML = `
        <h2>Korrigjime të jashtëzakonshme</h2>
        <p>
            Kjo pjesë përdoret vetëm nga Drejtori.
            Çdo ndryshim ose fshirje kërkon arsyetim
            dhe regjistrohet në historikun e sistemit.
        </p>

        <form id="korrigjim-form" class="korrigjim-form">
            <div class="korrigjim-field full">
                <label for="korrigjim-record">
                    Zgjidh regjistrimin
                </label>
                <select id="korrigjim-record" required>
                    <option value="">Duke ngarkuar...</option>
                </select>
            </div>

            <div class="korrigjim-field" id="korrigjim-grade-group" hidden>
                <label for="korrigjim-grade">Nota e korrigjuar</label>
                <select id="korrigjim-grade">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>

            <div class="korrigjim-field" id="korrigjim-status-group" hidden>
                <label for="korrigjim-status">
                    Statusi i mungesës
                </label>
                <select id="korrigjim-status">
                    <option value="ne_shqyrtim">Në shqyrtim</option>
                    <option value="e_arsyeshme">E arsyeshme</option>
                    <option value="e_paarsyeshme">E paarsyeshme</option>
                </select>
            </div>

            <div class="korrigjim-field" id="korrigjim-hour-group" hidden>
                <label for="korrigjim-hour">Ora mësimore</label>
                <select id="korrigjim-hour">
                    <option value="">Zgjidh orën</option>
                </select>
            </div>

            <div class="korrigjim-field" id="korrigjim-date-group" hidden>
                <label for="korrigjim-date">Data e mungesës</label>
                <input id="korrigjim-date" type="date">
            </div>

            <div class="korrigjim-field full"
                 id="korrigjim-absence-reason-group" hidden>
                <label for="korrigjim-absence-reason">
                    Arsyetimi i mungesës
                </label>
                <textarea id="korrigjim-absence-reason" rows="3"></textarea>
            </div>

            <div class="korrigjim-field full">
                <label for="korrigjim-reason">
                    Arsyeja e ndërhyrjes së Drejtorit
                </label>
                <textarea id="korrigjim-reason"
                          rows="3"
                          minlength="8"
                          placeholder="Shkruaj pse nevojitet ky korrigjim..."
                          required></textarea>
            </div>

            <div class="korrigjim-actions">
                <button class="korrigjim-save"
                        id="korrigjim-save"
                        type="submit">
                    Ruaj korrigjimin
                </button>

                <button class="korrigjim-delete"
                        id="korrigjim-delete"
                        type="button">
                    Fshi me arsyetim
                </button>
            </div>

            <p id="korrigjim-message"
               class="korrigjim-message"
               role="status"
               aria-live="polite"></p>
        </form>
    `;

    const container = document.querySelector(".evidence-page");
    const evidenceCard = document.querySelector(".evidence-card");

    if (!container || !evidenceCard) return;

    container.insertBefore(panel, evidenceCard);

    const $ = id => document.getElementById(id);
    const select = $("korrigjim-record");
    const message = $("korrigjim-message");

    const isGrade = tipi === "notat";

    $("korrigjim-grade-group").hidden = !isGrade;
    $("korrigjim-status-group").hidden = isGrade;
    $("korrigjim-hour-group").hidden = isGrade;
    $("korrigjim-date-group").hidden = isGrade;
    $("korrigjim-absence-reason-group").hidden = isGrade;

    const hourSelect = $("korrigjim-hour");

    for (let hour = 1; hour <= 10; hour++) {
        const option = document.createElement("option");
        option.value = String(hour);
        option.textContent = `Ora ${hour}`;
        hourSelect.appendChild(option);
    }

    let records = [];

    async function api(url, method = "GET", data = null) {
        const options = {
            method,
            headers: { ...headers }
        };

        if (data !== null) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (response.status === 204) return null;

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            let detail = "Operacioni nuk u realizua.";

            if (typeof result === "object" && result !== null) {
                detail = Object.entries(result).map(([key, value]) => {
                    const tekst = Array.isArray(value)
                        ? value.join(", ")
                        : String(value);

                    return `${key}: ${tekst}`;
                }).join(" | ") || detail;
            }

            throw new Error(detail);
        }

        return result;
    }

    function selectedRecord() {
        return records.find(
            record => String(record.id) === select.value
        );
    }

    function setDisabled(disabled) {
        $("korrigjim-save").disabled = disabled;
        $("korrigjim-delete").disabled = disabled;
    }

    function fillValues() {
        const record = selectedRecord();

        if (!record) {
            setDisabled(true);
            return;
        }

        setDisabled(false);
        $("korrigjim-reason").value = "";
        message.textContent = "";

        if (isGrade) {
            $("korrigjim-grade").value = String(record.vleresimi);
        } else {
            $("korrigjim-status").value = record.statusi;
            $("korrigjim-hour").value = record.ora_mesimore == null
                ? ""
                : String(record.ora_mesimore);

            $("korrigjim-date").value = record.data || "";
            $("korrigjim-absence-reason").value =
                record.arsyetimi || "";
        }
    }

    try {
        records = await api(`/api/${tipi}/`);

        select.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = records.length
            ? "Zgjidh regjistrimin..."
            : "Nuk ka regjistrime për korrigjim";

        select.appendChild(placeholder);

        records.forEach(record => {
            const option = document.createElement("option");
            option.value = String(record.id);

            const detail = isGrade
                ? `Nota ${record.vleresimi}`
                : `Ora ${record.ora_mesimore || "?"}, ${record.statusi}`;

            option.textContent =
                `#${record.id} | Nxënësi ID ${record.nxenesi} | ` +
                `Angazhimi ID ${record.angazhimi} | ${detail}`;

            select.appendChild(option);
        });

        setDisabled(true);
    } catch (error) {
        message.textContent = error.message;
        setDisabled(true);
    }

    select.addEventListener("change", fillValues);

    $("korrigjim-form").addEventListener("submit", async event => {
        event.preventDefault();

        const record = selectedRecord();
        if (!record) return;

        const arsyeja = $("korrigjim-reason").value.trim();

        if (arsyeja.length < 8) {
            message.textContent =
                "Shkruaj arsyen e korrigjimit, së paku 8 karaktere.";
            return;
        }

        const payload = {
            arsye_nderhyrjeje: arsyeja
        };

        if (isGrade) {
            payload.vleresimi = Number(
                $("korrigjim-grade").value
            );
        } else {
            payload.statusi = $("korrigjim-status").value;
            payload.ora_mesimore = Number(
                $("korrigjim-hour").value
            );
            payload.data = $("korrigjim-date").value;
            payload.arsyetimi =
                $("korrigjim-absence-reason").value.trim();

            if (!payload.ora_mesimore || !payload.data) {
                message.textContent =
                    "Data dhe ora mësimore janë të detyrueshme.";
                return;
            }

            if (
                payload.statusi === "e_arsyeshme" &&
                !payload.arsyetimi
            ) {
                message.textContent =
                    "Mungesa e arsyeshme kërkon arsyetim.";
                return;
            }
        }

        setDisabled(true);
        message.textContent = "Duke ruajtur korrigjimin...";

        try {
            await api(
                `/api/${tipi}/${record.id}/`,
                "PATCH",
                payload
            );

            message.textContent =
                "Korrigjimi u ruajt dhe u regjistrua në historik.";

            window.location.reload();
        } catch (error) {
            message.textContent = error.message;
            setDisabled(false);
        }
    });

    $("korrigjim-delete").addEventListener("click", async () => {
        const record = selectedRecord();
        if (!record) return;

        const arsyeja = $("korrigjim-reason").value.trim();

        if (arsyeja.length < 8) {
            message.textContent =
                "Shkruaj arsyen e fshirjes, së paku 8 karaktere.";
            return;
        }

        const confirmed = confirm(
            `A je i sigurt që dëshiron ta fshish ` +
            `regjistrimin #${record.id}? ` +
            `Ky veprim regjistrohet në historik.`
        );

        if (!confirmed) return;

        setDisabled(true);
        message.textContent = "Duke fshirë regjistrimin...";

        try {
            await api(
                `/api/${tipi}/${record.id}/`,
                "DELETE",
                { arsye_nderhyrjeje: arsyeja }
            );

            message.textContent =
                "Regjistrimi u fshi dhe veprimi u ruajt në historik.";

            window.location.reload();
        } catch (error) {
            message.textContent = error.message;
            setDisabled(false);
        }
    });
});
