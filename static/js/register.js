(function () {
    "use strict";

    const form = document.getElementById("registerForm");
    const messageBox = document.getElementById("registerMessage");
    const submitButton = document.getElementById("registerButton");

    function showMessage(message, type = "danger") {
        messageBox.textContent = message;
        messageBox.className = `alert alert-${type}`;
    }

    function getApiError(data, fallback) {
        if (typeof data.detail === "string") return data.detail;
        if (typeof data.error === "string") return data.error;

        const messages = Object.entries(data || {}).map(([field, errors]) => {
            const value = Array.isArray(errors) ? errors.join(", ") : String(errors);
            return `${field}: ${value}`;
        });

        return messages.join(" | ") || fallback;
    }

    async function postJson(url, payload, token = null) {
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(getApiError(data, `Request failed (${response.status}).`));
        }

        return data;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("accountEmail").value.trim();
        const password = document.getElementById("accountPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const companyName = document.getElementById("companyName").value.trim();
        const companyEmail = document.getElementById("companyEmail").value.trim();
        const companyPhone = document.getElementById("companyPhone").value.trim();

        messageBox.className = "alert d-none";

        if (password.length < 8) {
            showMessage("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("Passwords do not match. Please check and try again.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Creating your account...";

        try {
            // 1. Register the user. The backend assigns the COMPANY_OWNER role.
            await postJson("/api/auth/register/", {
                email,
                password,
                first_name: firstName,
                last_name: lastName
            });

            // 2. Obtain JWT tokens for the newly created account.
            const tokens = await postJson("/api/auth/login/", {
                email,
                password
            });

            if (!tokens.access || !tokens.refresh) {
                throw new Error("Account created, but the login service returned invalid tokens. Please sign in manually.");
            }

            // 3. Create the first company owned by this account.
            try {
                await postJson("/api/companies/", {
                    name: companyName,
                    email: companyEmail,
                    phone: companyPhone
                }, tokens.access);
            } catch (companyError) {
                // Keep tokens so the newly created user can sign in and recover.
                sessionStorage.setItem("access_token", tokens.access);
                sessionStorage.setItem("refresh_token", tokens.refresh);
                throw new Error(
                    `Your account was created, but company setup failed: ${companyError.message} Please sign in and contact support before using the dashboard.`
                );
            }

            // 4. Save tokens after account and company creation both succeed.
            sessionStorage.setItem("access_token", tokens.access);
            sessionStorage.setItem("refresh_token", tokens.refresh);

            showMessage("Your account and company workspace are ready. Redirecting to your dashboard...", "success");
            submitButton.textContent = "Account created";

            window.setTimeout(function () {
                window.location.replace("/dashboard/");
            }, 900);

        } catch (error) {
            showMessage(error.message || "Unable to create your account. Please try again.");
        } finally {
            if (!submitButton.textContent.includes("Account created")) {
                submitButton.disabled = false;
                submitButton.textContent = "Create Account";
            }
        }
    });
})();
