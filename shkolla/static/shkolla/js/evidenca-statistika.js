
document.addEventListener("DOMContentLoaded", async () => {
    const tipi = document.body.dataset.module;

    if (tipi !== "notat" && tipi !== "mungesat") {
        return;
    }

    const token = sessionStorage.getItem("schoolControlToken");

    if (!token) {
        return;
    }

    const eshteNota = tipi === "notat";
    const endpoint = `/api/statistika/${tipi}/`;

    const style = document.createElement("style");

    style.textContent = `
        .stat-panel {
            padding: 25px;
            background: #ffffff;
            border: 1px solid #dceaf3;
            border-radius: 22px;
            display: grid;
            gap: 20px;
        }

        .stat-heading h2 {
            color: #143f59;
            font-size: 21px;
            margin: 0 0 6px;
        }

        .stat-heading p {
            color: #708a9b;
            font-size: 13px;
            margin: 0;
        }

        .stat-filters {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 13px;
        }

        .stat-filters label {
            display: grid;
            gap: 7px;
            color: #926419;
            font-size: 12px;
            font-weight: 700;
        }

        .stat-filters select,
        .stat-filters input {
            width: 100%;
            min-width: 0;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid #e5d2a9;
            background: #fffdf8;
            color: #254c63;
            font: inherit;
        }

        .stat-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .stat-btn {
            border: 0;
            border-radius: 11px;
            padding: 12px 20px;
            background: linear-gradient(135deg, #edbd52, #b57b15);
            color: white;
            font-weight: 700;
            cursor: pointer;
        }

        .stat-btn-secondary {
            background: #eaf3f9;
            color: #18516d;
        }

        .stat-cards {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 13px;
        }

        .stat-card {
            background: linear-gradient(130deg, #f5faff, #fff9e9);
            border: 1px solid #e5edf2;
            border-radius: 15px;
            padding: 20px;
            display: grid;
            gap: 9px;
        }

        .stat-card span {
            font-size: 12px;
            color: #67849a;
        }

        .stat-card strong {
            color: #b37a16;
            font-size: 28px;
        }

        .stat-section h3 {
            color: #174c67;
            font-size: 17px;
            margin: 0 0 12px;
        }

        .stat-table-wrap {
            overflow: auto;
            max-height: 350px;
            border: 1px solid #e1edf5;
            border-radius: 13px;
        }

        .stat-table {
            width: 100%;
            min-width: 620px;
            border-collapse: collapse;
        }

        .stat-table th {
            position: sticky;
            top: 0;
            padding: 13px;
            background: #e8f3fa;
            color: #1c5e7e;
            text-align: left;
            font-size: 12px;
        }

        .stat-table td {
            padding: 13px;
            border-bottom: 1px solid #edf2f6;
            color: #34576c;
            font-size: 12px;
        }

        .stat-table tbody tr:hover {
            background: #f7fbfe;
        }

        .stat-message {
            color: #6d8495;
            font-size: 12px;
        }

        body[data-evidenca-director="true"] #evidence-add,
        body[data-evidenca-director="true"] .evidence-edit,
        body[data-evidenca-director="true"] .evidence-delete {
            display: none !important;
        }

        @media (max-width: 900px) {
            .stat-filters {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .stat-cards {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 560px) {
            .stat-panel {
                padding: 15px;
            }

            .stat-filters,
            .stat-cards {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);

    async function merrStatistikat(params = new URLSearchParams()) {
        const query = params.toString();
        const url = query ? `${endpoint}?${query}` : endpoint;

        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${token}`
            }
        });

        if (response.status === 403) {
            return null;
        }

        if (!response.ok) {
            throw new Error(
                `Statistikat nuk u ngarkuan. HTTP ${response.status}`
            );
        }

        return response.json();
    }

    let statistikatFillestare;

    try {
        statistikatFillestare = await merrStatistikat();
    } catch (error) {
        console.error(error);
        return;
    }

    if (!statistikatFillestare) {
        return;
    }

    document.body.dataset.evidencaDirector = "true";

    const panel = document.createElement("section");
    panel.className = "stat-panel";

    panel.innerHTML = `
        <div class="stat-heading">
            <h2>Statistikat e Drejtorit</h2>
            <p>
                Pasqyra sipas nxënësve, klasave dhe gjithë shkollës
            </p>
        </div>

        <div class="stat-filters">
            <label>
                Klasa
                <select id="stat-klasa">
                    <option value="">Të gjitha klasat</option>
                </select>
            </label>

            <label>
                Nxënësi
                <select id="stat-nxenesi">
                    <option value="">Të gjithë nxënësit</option>
                </select>
            </label>

            <label id="stat-lenda-group" hidden>
                Lënda
                <select id="stat-lenda">
                    <option value="">Të gjitha lëndët</option>
                </select>
            </label>

            <label>
                Nga data
                <input id="stat-nga" type="date">
            </label>

            <label>
                Deri më
                <input id="stat-deri" type="date">
            </label>
        </div>

        <div class="stat-actions">
            <button type="button" id="stat-apliko" class="stat-btn">
                Shfaq statistikat
            </button>

            <button type="button" id="stat-pastro"
                    class="stat-btn stat-btn-secondary">
                Pastro filtrat
            </button>
        </div>

        <div id="stat-cards" class="stat-cards"></div>

        <div class="stat-section">
            <h3>Statistikat sipas klasave</h3>
            <div id="stat-klasat" class="stat-table-wrap"></div>
        </div>

        <div class="stat-section">
            <h3>Statistikat sipas nxënësve</h3>
            <div id="stat-nxenesit" class="stat-table-wrap"></div>
        </div>

        <p id="stat-message" class="stat-message" role="status">
            Statistikat bazohen në regjistrimet aktuale të databazës.
        </p>
    `;

    const summary = document.querySelector(".evidence-summary");

    if (!summary) {
        return;
    }

    summary.parentElement.insertBefore(panel, summary);

    const $ = id => panel.querySelector(`#${id}`);

    const klasaSelect = $("stat-klasa");
    const nxenesiSelect = $("stat-nxenesi");
    const lendaSelect = $("stat-lenda");

    function shtoOpsion(select, value, label) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = label;
        select.appendChild(option);
    }

    statistikatFillestare.klasat.forEach(klasa => {
        shtoOpsion(
            klasaSelect,
            klasa.klasa_id,
            klasa.klasa
        );
    });

    function perditesoNxenesit() {
        const klasaId = klasaSelect.value;
        const previous = nxenesiSelect.value;

        nxenesiSelect.replaceChildren();
        shtoOpsion(nxenesiSelect, "", "Të gjithë nxënësit");

        const lista = statistikatFillestare.nxenesit.filter(nxenesi => {
            return !klasaId ||
                String(nxenesi.klasa_id) === klasaId;
        });

        lista.forEach(nxenesi => {
            shtoOpsion(
                nxenesiSelect,
                nxenesi.nxenesi_id,
                nxenesi.nxenesi
            );
        });

        if (lista.some(n => String(n.nxenesi_id) === previous)) {
            nxenesiSelect.value = previous;
        }
    }

    klasaSelect.addEventListener("change", perditesoNxenesit);
    perditesoNxenesit();

    if (eshteNota) {
        $("stat-lenda-group").hidden = false;

        try {
            const response = await fetch("/api/lendet/", {
                headers: {
                    Authorization: `Token ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const lendet = Array.isArray(data)
                    ? data
                    : data.results || [];

                lendet.forEach(lenda => {
                    shtoOpsion(lendaSelect, lenda.id, lenda.emri);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

    function formatoMesatare(value) {
        if (value === null || value === undefined) {
            return "—";
        }

        return Number(value).toFixed(2);
    }

    function krijoKarte(label, value) {
        const card = document.createElement("div");
        card.className = "stat-card";

        const span = document.createElement("span");
        span.textContent = label;

        const strong = document.createElement("strong");
        strong.textContent = String(value ?? "—");

        card.append(span, strong);
        return card;
    }

    function krijoTabele(container, headers, rows) {
        container.replaceChildren();

        const table = document.createElement("table");
        table.className = "stat-table";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");

        headers.forEach(header => {
            const th = document.createElement("th");
            th.textContent = header;
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");

        if (!rows.length) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = headers.length;
            td.textContent = "Nuk ka të dhëna për këtë përzgjedhje.";
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        rows.forEach(values => {
            const tr = document.createElement("tr");

            values.forEach(value => {
                const td = document.createElement("td");
                td.textContent = String(value ?? "—");
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.append(thead, tbody);
        container.appendChild(table);
    }

    function shfaqStatistikat(data) {
        const shkolla = data.shkolla;
        const cards = $("stat-cards");

        cards.replaceChildren();

        if (eshteNota) {
            cards.append(
                krijoKarte(
                    "Mesatarja",
                    formatoMesatare(shkolla.mesatarja)
                ),
                krijoKarte(
                    "Nota gjithsej",
                    shkolla.nota_gjithsej
                ),
                krijoKarte(
                    "Nxënës me nota",
                    shkolla.nxenes_me_nota
                ),
                krijoKarte(
                    "Klasa gjithsej",
                    shkolla.klasa_gjithsej
                )
            );

            krijoTabele(
                $("stat-klasat"),
                ["Klasa", "Nxënës me nota", "Nota", "Mesatarja"],
                data.klasat.map(k => [
                    k.klasa,
                    k.nxenes_me_nota,
                    k.nota_gjithsej,
                    formatoMesatare(k.mesatarja)
                ])
            );

            krijoTabele(
                $("stat-nxenesit"),
                ["Nxënësi", "Klasa", "Nota", "Mesatarja"],
                data.nxenesit.map(n => [
                    n.nxenesi,
                    n.klasa,
                    n.nota_gjithsej,
                    formatoMesatare(n.mesatarja)
                ])
            );

        } else {
            cards.append(
                krijoKarte("Mungesa gjithsej", shkolla.gjithsej),
                krijoKarte("Të arsyeshme", shkolla.e_arsyeshme),
                krijoKarte("Të paarsyeshme", shkolla.e_paarsyeshme),
                krijoKarte("Në shqyrtim", shkolla.ne_shqyrtim)
            );

            krijoTabele(
                $("stat-klasat"),
                [
                    "Klasa",
                    "Gjithsej",
                    "Të arsyeshme",
                    "Të paarsyeshme",
                    "Në shqyrtim"
                ],
                data.klasat.map(k => [
                    k.klasa,
                    k.gjithsej,
                    k.e_arsyeshme,
                    k.e_paarsyeshme,
                    k.ne_shqyrtim
                ])
            );

            krijoTabele(
                $("stat-nxenesit"),
                [
                    "Nxënësi",
                    "Klasa",
                    "Gjithsej",
                    "Të arsyeshme",
                    "Të paarsyeshme",
                    "Në shqyrtim"
                ],
                data.nxenesit.map(n => [
                    n.nxenesi,
                    n.klasa,
                    n.gjithsej,
                    n.e_arsyeshme,
                    n.e_paarsyeshme,
                    n.ne_shqyrtim
                ])
            );

            const ora = shkolla.sipas_ores || {};

            const ekzistuese = panel.querySelector("#stat-oret");

            if (ekzistuese) {
                ekzistuese.remove();
            }

            const seksioni = document.createElement("div");
            seksioni.id = "stat-oret";
            seksioni.className = "stat-section";

            const heading = document.createElement("h3");
            heading.textContent = "Mungesat sipas orëve mësimore";

            const holder = document.createElement("div");
            holder.className = "stat-table-wrap";

            const rows = Object.entries(ora)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([ore, total]) => [
                    `Ora ${ore}`,
                    total
                ]);

            krijoTabele(holder, ["Ora mësimore", "Mungesa"], rows);

            seksioni.append(heading, holder);
            $("stat-message").before(seksioni);
        }
    }

    async function aplikoFiltrat() {
        const params = new URLSearchParams();

        const filtrat = {
            klasa: klasaSelect.value,
            nxenesi: nxenesiSelect.value,
            lenda: eshteNota ? lendaSelect.value : "",
            data_nga: $("stat-nga").value,
            data_deri: $("stat-deri").value
        };

        Object.entries(filtrat).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        const button = $("stat-apliko");
        const message = $("stat-message");

        button.disabled = true;
        message.textContent = "Duke ngarkuar statistikat...";

        try {
            const data = await merrStatistikat(params);

            if (!data) {
                throw new Error("Nuk ke leje për statistikat.");
            }

            shfaqStatistikat(data);
            message.textContent = "Statistikat u përditësuan me sukses.";
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    }

    $("stat-apliko").addEventListener("click", aplikoFiltrat);

    $("stat-pastro").addEventListener("click", () => {
        klasaSelect.value = "";
        perditesoNxenesit();
        nxenesiSelect.value = "";
        lendaSelect.value = "";
        $("stat-nga").value = "";
        $("stat-deri").value = "";
        aplikoFiltrat();
    });

    shfaqStatistikat(statistikatFillestare);
});
