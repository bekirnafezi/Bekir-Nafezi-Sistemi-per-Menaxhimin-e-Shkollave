document.addEventListener("DOMContentLoaded", () => {
    const faqet = new Map([
        ["Angazhimet", "/angazhimet/"],
        ["Notat", "/notat/"],
        ["Mungesat", "/mungesat/"]
    ]);

    const rrugaAktuale = window.location.pathname;

    document.querySelectorAll(".sidebar-menu .menu-item").forEach(item => {
        const emri = item.lastElementChild?.textContent.trim();
        const adresa = faqet.get(emri);

        if (!adresa) {
            return;
        }

        let lidhja = item;

        if (item.tagName !== "A") {
            lidhja = document.createElement("a");

            for (const atribut of item.attributes) {
                lidhja.setAttribute(atribut.name, atribut.value);
            }

            lidhja.innerHTML = item.innerHTML;
            item.replaceWith(lidhja);
        }

        lidhja.href = adresa;

        const aktive = rrugaAktuale === adresa;
        lidhja.classList.toggle("active", aktive);

        if (aktive) {
            lidhja.setAttribute("aria-current", "page");
        } else {
            lidhja.removeAttribute("aria-current");
        }
    });
});
