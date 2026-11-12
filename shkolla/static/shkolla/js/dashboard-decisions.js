
document.addEventListener("DOMContentLoaded", function () {
    const dashboard = document.querySelector(".dashboard-content");

    if (!dashboard || document.querySelector(".sc-decisions-actions")) {
        return;
    }

    const actions = document.createElement("div");
    actions.className = "sc-decisions-actions";

    actions.innerHTML = `
        <button type="button" class="sc-decisions-add">
            + Shto Vendim
        </button>

        <button type="button" class="sc-decisions-view">
            Vendimet e Drejtorit
            <span aria-hidden="true">&#8594;</span>
        </button>
    `;

    dashboard.appendChild(actions);

    const toast = document.createElement("p");
    toast.className = "sc-decision-toast";
    toast.setAttribute("role", "status");
    dashboard.appendChild(toast);

    let toastTimer;

    const addButton = actions.querySelector(".sc-decisions-add");
    const viewButton = actions.querySelector(".sc-decisions-view");

    const formDialog = document.createElement("dialog");
    formDialog.className = "sc-decision-dialog";

    formDialog.innerHTML = `
        <div class="sc-decision-modal-head">
            <div>
                <h2>Shto Vendim</h2>
                <p>Regjistro vendimin e drejtorit</p>
            </div>

            <button
                type="button"
                class="sc-decision-close"
                aria-label="Mbyll"
            >
                &times;
            </button>
        </div>

        <form class="sc-decision-form">

            <label for="sc-decision-title">
                Titulli i vendimit
            </label>

            <input
                id="sc-decision-title"
                maxlength="200"
                minlength="3"
                required
            >

            <label for="sc-decision-text">
                P\u00ebrmbajtja e vendimit
            </label>

            <textarea
                id="sc-decision-text"
                rows="4"
                minlength="5"
                required
            ></textarea>

            <label for="sc-decision-category">
                Vendimi \u00ebsht\u00eb p\u00ebr
            </label>

            <select id="sc-decision-category" required>
                <option value="shkolle">
                    Shkoll\u00ebn
                </option>

                <option value="mesimdhenes">
                    M\u00ebsimdh\u00ebn\u00ebsin
                </option>

                <option value="nxenes">
                    Nx\u00ebn\u00ebsin
                </option>
            </select>

            <div class="sc-decision-person-box" hidden>
                <label for="sc-decision-person">
                    Zgjidh personin
                </label>

                <select id="sc-decision-person">
                    <option value="">Zgjidh...</option>
                </select>
            </div>

            <label for="sc-decision-date">
                Data e vendimit
            </label>

            <input
                id="sc-decision-date"
                type="date"
                required
            >

            <p
                class="sc-decision-feedback"
                role="alert"
            ></p>

            <div class="sc-decision-form-actions">
                <button
                    type="button"
                    class="sc-decision-back"
                >
                    Anulo
                </button>

                <button
                    type="submit"
                    class="sc-decision-submit"
                >
                    Ruaj Vendimin
                </button>
            </div>
        </form>
    `;

    const listDialog = document.createElement("dialog");

    listDialog.className =
        "sc-decision-dialog sc-decisions-list-dialog";

    listDialog.innerHTML = `
        <div class="sc-decision-modal-head">
            <div>
                <h2>Vendimet e Drejtorit</h2>
                <p>Vendimet p\u00ebr shkoll\u00ebn, m\u00ebsimdh\u00ebn\u00ebsit dhe nx\u00ebn\u00ebsit</p>
            </div>

            <button
                type="button"
                class="sc-decision-close"
                aria-label="Mbyll"
            >
                &times;
            </button>
        </div>

        <p
            class="sc-decisions-list-message"
            role="status"
        ></p>

        <div
            class="sc-decisions-list"
            aria-live="polite"
        ></div>

        <div class="sc-decisions-pagination" hidden>
            <span class="sc-decisions-page"></span>

            <div>
                <button
                    type="button"
                    class="sc-decisions-prev"
                >
                    Prapa
                </button>

                <button
                    type="button"
                    class="sc-decisions-next"
                >
                    P\u00ebrpara
                </button>
            </div>
        </div>
    `;

    document.body.append(formDialog, listDialog);

    const form = formDialog.querySelector("form");

    const titleInput = form.querySelector("#sc-decision-title");
    const textInput = form.querySelector("#sc-decision-text");
    const categoryInput = form.querySelector("#sc-decision-category");
    const personBox = form.querySelector(".sc-decision-person-box");
    const personInput = form.querySelector("#sc-decision-person");
    const dateInput = form.querySelector("#sc-decision-date");

    const feedback = form.querySelector(".sc-decision-feedback");
    const submitButton = form.querySelector(".sc-decision-submit");

    const list = listDialog.querySelector(".sc-decisions-list");

    const dateFilterBar = document.createElement("div");
    dateFilterBar.className = "sc-decisions-date-filter";

    const dateFilterLabel = document.createElement("label");
    dateFilterLabel.htmlFor = "sc-decisions-filter-date";
    dateFilterLabel.textContent = "K\u00ebrko sipas dat\u00ebs:";

    const dateFilterInput = document.createElement("input");
    dateFilterInput.type = "date";
    dateFilterInput.id = "sc-decisions-filter-date";

    const dateFilterReset = document.createElement("button");
    dateFilterReset.type = "button";
    dateFilterReset.className = "sc-decisions-filter-reset";
    dateFilterReset.textContent = "T\u00eb gjitha";
    dateFilterReset.disabled = true;

    const dateFilterCount = document.createElement("span");
    dateFilterCount.className = "sc-decisions-filter-count";

    dateFilterBar.append(
        dateFilterLabel,
        dateFilterInput,
        dateFilterReset,
        dateFilterCount
    );

    list.before(dateFilterBar);

    dateFilterInput.addEventListener("change", function () {
        page = 0;
        renderList();
    });

    dateFilterReset.addEventListener("click", function () {
        dateFilterInput.value = "";
        page = 0;
        renderList();
    });


    const listMessage = listDialog.querySelector(
        ".sc-decisions-list-message"
    );

    const pagination = listDialog.querySelector(
        ".sc-decisions-pagination"
    );

    const pageLabel = listDialog.querySelector(".sc-decisions-page");
    const prev = listDialog.querySelector(".sc-decisions-prev");
    const next = listDialog.querySelector(".sc-decisions-next");

    let busy = false;
    let peopleRequest = 0;
    let decisions = [];
    let deleteBusy = false;
    let page = 0;

    const pageSize = 4;

    function localToday() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("-");
    }

    function dateLabel(value) {
        const parts = String(value).split("-").map(Number);

        if (
            parts.length !== 3 ||
            parts.some(Number.isNaN)
        ) {
            return String(value);
        }

        const date = new Date(
            parts[0],
            parts[1] - 1,
            parts[2],
            12
        );

        return new Intl.DateTimeFormat("sq-AL", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    async function requestJson(url, options = {}) {
        const token = sessionStorage.getItem(
            "schoolControlToken"
        );

        if (!token) {
            throw new Error(
                "Sesioni ka skaduar. Identifikohuni p\u00ebrs\u00ebri."
            );
        }

        const response = await fetch(url, {
            ...options,

            headers: {
                Authorization: "Token " + token,
                Accept: "application/json",

                ...(options.body ? {
                    "Content-Type": "application/json"
                } : {}),

                ...(options.headers || {})
            }
        });

        const result = await response.json().catch(
            function () {
                return null;
            }
        );

        if (!response.ok) {
            const detail = result && (
                result.gabim ||
                result.detail ||
                Object.values(result).flat().join(" ")
            );

            throw new Error(
                typeof detail === "string" && detail
                    ? detail
                    : "Veprimi nuk u realizua."
            );
        }

        return result;
    }

    async function changeCategory() {
        const requestId = ++peopleRequest;

        const category = categoryInput.value;
        const needsPerson = category !== "shkolle";

        personBox.hidden = !needsPerson;
        personInput.required = needsPerson;

        personInput.replaceChildren(
            new Option(
                needsPerson ? "Duke ngarkuar..." : "Zgjidh...",
                ""
            )
        );

        personInput.disabled = needsPerson;
        feedback.textContent = "";

        if (!needsPerson) {
            return;
        }

        try {
            const people = await requestJson(
                "/api/vendimet/personat/?kategoria=" +
                encodeURIComponent(category)
            );

            if (requestId !== peopleRequest) {
                return;
            }

            if (!Array.isArray(people)) {
                throw new Error(
                    "Lista e personave nuk u ngarkua."
                );
            }

            personInput.replaceChildren(
                new Option("Zgjidh personin...", "")
            );

            people.forEach(function (person) {
                personInput.add(
                    new Option(
                        person.emri,
                        String(person.id)
                    )
                );
            });

            personInput.disabled = false;

            if (!people.length) {
                feedback.textContent =
                    "Nuk ka persona t\u00eb regjistruar n\u00eb k\u00ebt\u00eb kategori.";
            }

        } catch (error) {
            if (requestId === peopleRequest) {
                feedback.textContent = error.message;
            }
        }
    }

    function closeForm() {
        if (!busy) {
            formDialog.close();
        }
    }

    formDialog.querySelector(".sc-decision-close")
        .addEventListener("click", closeForm);

    formDialog.querySelector(".sc-decision-back")
        .addEventListener("click", closeForm);

    formDialog.addEventListener("cancel", function (event) {
        if (busy) {
            event.preventDefault();
        }
    });

    categoryInput.addEventListener(
        "change",
        changeCategory
    );

    addButton.addEventListener("click", function () {
        form.reset();

        dateInput.value = localToday();
        feedback.textContent = "";

        changeCategory();

        formDialog.showModal();
        titleInput.focus();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (busy) {
            return;
        }

        const category = categoryInput.value;

        if (category !== "shkolle" && !personInput.value) {
            feedback.textContent =
                "Zgjidh personin p\u00ebrkat\u00ebs.";
            return;
        }

        const payload = {
            titulli: titleInput.value.trim(),
            permbajtja: textInput.value.trim(),
            kategoria: category,
            data_vendimit: dateInput.value,

            mesimdhenesi:
                category === "mesimdhenes"
                    ? Number(personInput.value)
                    : null,

            nxenesi:
                category === "nxenes"
                    ? Number(personInput.value)
                    : null
        };

        busy = true;
        submitButton.disabled = true;
        submitButton.textContent = "Duke ruajtur...";
        feedback.textContent = "";

        try {
            await requestJson(
                "/api/vendimet/",
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            formDialog.close();

            toast.textContent =
                "Vendimi u regjistrua me sukses.";

            toast.classList.add("is-visible");

            clearTimeout(toastTimer);

            toastTimer = setTimeout(function () {
                toast.classList.remove("is-visible");
            }, 4500);

        } catch (error) {
            feedback.textContent = error.message;

        } finally {
            busy = false;
            submitButton.disabled = false;
            submitButton.textContent = "Ruaj Vendimin";
        }
    });

    function renderList() {
        list.replaceChildren();

        const filteredDecisions = decisions.filter(function (item) {
            return !dateFilterInput.value ||
                item.data_vendimit === dateFilterInput.value;
        });

        dateFilterReset.disabled = !dateFilterInput.value;

        dateFilterCount.textContent =
            filteredDecisions.length === 1
                ? "1 vendim"
                : filteredDecisions.length + " vendime";



        if (!filteredDecisions.length) {
            listMessage.textContent = dateFilterInput.value
                ? "Nuk ka vendime p\u00ebr dat\u00ebn e zgjedhur."
                : "Ende nuk ka vendime t\u00eb regjistruara.";

            pagination.hidden = true;
            return;
        }

        listMessage.textContent = "";

        const pages = Math.ceil(
            filteredDecisions.length / pageSize
        );

        page = Math.min(page, pages - 1);

        filteredDecisions.slice(
            page * pageSize,
            (page + 1) * pageSize
        ).forEach(function (item) {
            const card = document.createElement("article");
            card.className = "sc-decision-item";

            const heading = document.createElement("strong");
            heading.textContent = item.titulli;

            const date = document.createElement("time");
            date.dateTime = item.data_vendimit;
            date.textContent = dateLabel(item.data_vendimit);

            const body = document.createElement("p");
            body.textContent = item.permbajtja;

            const target = document.createElement("span");
            target.className = "sc-decision-target";

            if (item.kategoria === "shkolle") {
                target.textContent = "P\u00ebr shkoll\u00ebn";

            } else if (item.kategoria === "mesimdhenes") {
                target.textContent =
                    "M\u00ebsimdh\u00ebn\u00ebsi: " +
                    (item.mesimdhenesi_etiketa || "I pap\u00ebrcaktuar");

            } else if (item.kategoria === "nxenes") {
                target.textContent =
                    "Nx\u00ebn\u00ebsi: " +
                    (item.nxenesi_etiketa || "I pap\u00ebrcaktuar");
            }

            const controls = document.createElement("div");
            controls.className = "sc-decision-item-actions";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "sc-decision-delete";
            deleteButton.textContent = "\u00d7 Fshi";

            deleteButton.setAttribute(
                "aria-label",
                "Fshi vendimin: " + item.titulli
            );

            deleteButton.addEventListener("click", async function () {

                if (deleteBusy) {
                    return;
                }

                const confirmed = window.confirm(
                    "A d\u00ebshironi ta fshini p\u00ebrfundimisht vendimin?\n\n" +
                    item.titulli +
                    "\n\nKy veprim nuk mund t\u00eb kthehet."
                );

                if (!confirmed) {
                    return;
                }

                deleteBusy = true;
                deleteButton.disabled = true;
                deleteButton.textContent = "Duke fshir\u00eb...";

                try {
                    await requestJson(
                        "/api/vendimet/" + item.id + "/",
                        {
                            method: "DELETE"
                        }
                    );

                    decisions = decisions.filter(function (decision) {
                        return decision.id !== item.id;
                    });

                    renderList();

                    listMessage.textContent =
                        "Vendimi u fshi me sukses.";

                } catch (error) {
                    listMessage.textContent = error.message;
                    deleteButton.disabled = false;
                    deleteButton.textContent = "\u00d7 Fshi";

                } finally {
                    deleteBusy = false;
                }
            });

            controls.appendChild(deleteButton);

            card.append(heading, target, date, body, controls);
            list.appendChild(card);
        });

        pageLabel.textContent =
            "Faqja " + (page + 1) + " nga " + pages;

        prev.disabled = page === 0;
        next.disabled = page === pages - 1;

        pagination.hidden = pages <= 1;
    }

    async function openSchoolDecisions() {
        dateFilterInput.value = "";
        dateFilterReset.disabled = true;
        dateFilterCount.textContent = "";

        listDialog.showModal();

        list.replaceChildren();

        listMessage.textContent =
            "Duke ngarkuar vendimet...";

        pagination.hidden = true;

        try {
            const data = await requestJson(
                "/api/vendimet/?kategoria=te_gjitha"
            );

            if (!Array.isArray(data)) {
                throw new Error(
                    "Formati i vendimeve nuk \u00ebsht\u00eb i sakt\u00eb."
                );
            }

            decisions = data;
            page = 0;

            renderList();

        } catch (error) {
            listMessage.textContent = error.message;
        }
    }

    viewButton.addEventListener(
        "click",
        openSchoolDecisions
    );

    listDialog.querySelector(".sc-decision-close")
        .addEventListener("click", function () {
            listDialog.close();
        });

    prev.addEventListener("click", function () {
        if (page > 0) {
            page--;
            renderList();
        }
    });

    next.addEventListener("click", function () {
        const filteredCount = decisions.filter(function (item) {
            return !dateFilterInput.value ||
                item.data_vendimit === dateFilterInput.value;
        }).length;

        if ((page + 1) * pageSize < filteredCount) {
            page++;
            renderList();
        }
    });

    function findCard(label) {
        for (const leaf of dashboard.querySelectorAll("*")) {
            if (
                leaf.children.length ||
                leaf.textContent.trim() !== label
            ) {
                continue;
            }

            if (leaf.getBoundingClientRect().width === 0) {
                continue;
            }

            let candidate = null;
            let parent = leaf.parentElement;

            while (parent && parent !== dashboard) {
                const rect = parent.getBoundingClientRect();

                if (
                    rect.width >= 220 &&
                    rect.width <= 550 &&
                    rect.height >= 150 &&
                    rect.height <= 400
                ) {
                    candidate = rect;
                }

                parent = parent.parentElement;
            }

            if (candidate) {
                return candidate;
            }
        }

        return null;
    }

    function positionActions() {
        if (window.innerWidth <= 1050) {
            actions.style.removeProperty("left");
            actions.style.removeProperty("top");
            actions.style.removeProperty("width");
            actions.style.removeProperty("grid-template-columns");
            return;
        }

        const leftCard = findCard("Klasa");
        const rightCard = findCard("L\u00ebnd\u00eb");

        if (!leftCard || !rightCard) {
            return;
        }

        const base = dashboard.getBoundingClientRect();

        dashboard.style.setProperty(
            "position",
            "relative",
            "important"
        );

        actions.style.left =
            (leftCard.left - base.left + dashboard.scrollLeft) +
            "px";

        actions.style.top =
            (
                Math.max(leftCard.bottom, rightCard.bottom) -
                base.top +
                dashboard.scrollTop +
                17
            ) + "px";

        actions.style.width =
            (rightCard.right - leftCard.left) + "px";

        actions.style.gridTemplateColumns =
            leftCard.width + "px " + rightCard.width + "px";

        actions.style.columnGap =
            (rightCard.left - leftCard.right) + "px";
    }

    window.addEventListener("resize", positionActions);
    window.addEventListener("load", positionActions);

    requestAnimationFrame(positionActions);
});
