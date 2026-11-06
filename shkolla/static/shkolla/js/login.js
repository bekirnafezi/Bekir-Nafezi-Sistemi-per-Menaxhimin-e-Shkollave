document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("login-message");
    const loginButton = document.querySelector(".login-button");

    if (!form || !emailInput || !passwordInput || !message || !loginButton) {
        return;
    }

    const originalButtonContent = loginButton.innerHTML;

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        message.textContent = "";
        message.style.color = "#b42336";

        if (!email || !password) {
            message.textContent = "Plotëso email-in dhe fjalëkalimin.";
            return;
        }

        if (!emailInput.checkValidity()) {
            message.textContent = "Shkruaj një email të vlefshëm.";
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Duke u identifikuar...";

        try {

            const csrfToken = form.querySelector(
                'input[name="csrfmiddlewaretoken"]'
            )?.value;

            const headers = {
                "Content-Type": "application/json"
            };

            if (csrfToken) {
                headers["X-CSRFToken"] = csrfToken;
            }

            const response = await fetch("/api/auth/login/", {
                method: "POST",
                headers: headers,
                credentials: "same-origin",
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                message.textContent =
                    data.gabim ||
                    data.detail ||
                    "Identifikimi nuk u realizua. Provo përsëri.";

                return;
            }

            if (!data.token || !data.perdoruesi) {
                message.textContent =
                    "Përgjigjja e serverit nuk është e plotë.";

                return;
            }

            sessionStorage.setItem(
                "schoolControlToken",
                data.token
            );

            sessionStorage.setItem(
                "schoolControlRole",
                data.perdoruesi.roli
            );

            sessionStorage.setItem(
                "schoolControlEmail",
                data.perdoruesi.email
            );

            message.style.color = "#16804a";
            message.textContent = "Hyrja u realizua me sukses!";

            passwordInput.value = "";

            setTimeout(function () {
                window.location.assign("/dashboard/");
            }, 900);

        } catch (error) {

            message.style.color = "#b42336";

            message.textContent =
                "Nuk mund të lidhemi me serverin. Provo përsëri.";

        } finally {

            loginButton.disabled = false;
            loginButton.innerHTML = originalButtonContent;

        }

    });

});