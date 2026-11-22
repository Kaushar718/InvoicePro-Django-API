
const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("message");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    messageBox.className = "alert d-none";

    try {

        const response = await fetch("/api/auth/login/", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {

            const errorMessage =
                data.detail ||
                Object.entries(data)
                    .map(([field, errors]) =>
                        `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`
                    )
                    .join(" | ") ||
                "Login failed.";

            throw new Error(errorMessage);
        }

        sessionStorage.setItem("access_token", data.access);
        sessionStorage.setItem("refresh_token", data.refresh);

        window.location.href = "/dashboard/";

    } catch (error) {

        messageBox.textContent = error.message;
        messageBox.className = "alert alert-danger";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});
