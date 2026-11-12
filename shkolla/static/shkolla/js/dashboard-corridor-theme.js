
document.addEventListener("DOMContentLoaded", function () {
    const dashboard = document.querySelector(".dashboard-content");

    if (!dashboard) {
        return;
    }

    const labels = [
        "Nx?n?s",
        "M?simdh?n?s",
        "Klasa",
        "L?nd?"
    ];

    labels.forEach(function (label, index) {
        const leaves = dashboard.querySelectorAll("*");

        for (const leaf of leaves) {
            if (
                leaf.children.length !== 0 ||
                leaf.textContent.trim() !== label
            ) {
                continue;
            }

            let parent = leaf.parentElement;
            let card = null;

            while (parent && parent !== dashboard) {
                const rect = parent.getBoundingClientRect();

                if (
                    rect.width >= 210 &&
                    rect.width <= 550 &&
                    rect.height >= 140 &&
                    rect.height <= 420
                ) {
                    card = parent;
                    break;
                }

                parent = parent.parentElement;
            }

            if (!card) {
                continue;
            }

            card.classList.add(
                "sc-corridor-stat",
                "sc-corridor-stat-" + index
            );

            card.querySelectorAll("*").forEach(function (element) {
                if (
                    element.children.length === 0 &&
                    /^\d+$/.test(element.textContent.trim())
                ) {
                    element.classList.add("sc-corridor-number");
                }
            });

            const icon = card.querySelector("svg");

            if (icon) {
                let wrapper = icon.parentElement;

                while (wrapper && wrapper !== card) {
                    const rect = wrapper.getBoundingClientRect();

                    if (
                        rect.width >= 45 &&
                        rect.width <= 110 &&
                        rect.height >= 45 &&
                        rect.height <= 110
                    ) {
                        wrapper.classList.add("sc-corridor-icon");
                        break;
                    }

                    wrapper = wrapper.parentElement;
                }
            }

            break;
        }
    });

    document.querySelectorAll(
        ".dashboard-content button"
    ).forEach(function (button) {
        if (
            button.textContent.trim().includes("Shto Aktivitet")
        ) {
            button.classList.add("sc-corridor-primary");
        }
    });
});
