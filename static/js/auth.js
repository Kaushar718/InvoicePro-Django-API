
(function () {
    const ACCESS_TOKEN_KEY = "access_token";
    const REFRESH_TOKEN_KEY = "refresh_token";
    const PREFERRED_COMPANY_ID = 8;

    let refreshPromise = null;
    let companyIdPromise = null;

    function logout() {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.replace("/");
    }

    async function refreshAccessToken() {
        const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            logout();
            throw new Error("Please sign in again.");
        }

        if (!refreshPromise) {
            refreshPromise = (async function () {
                const response = await fetch("/api/auth/refresh/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ refresh: refreshToken })
                });

                const data = await response.json().catch(() => ({}));

                if (response.status === 400 || response.status === 401) {
                    logout();
                    throw new Error(
                        "Your session expired. Please sign in again."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to refresh your session. Please retry."
                    );
                }

                if (!data.access) {
                    throw new Error(
                        "The token refresh service returned an invalid response."
                    );
                }

                sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access);

                if (data.refresh) {
                    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
                }

                return data.access;
            })().finally(function () {
                refreshPromise = null;
            });
        }

        return refreshPromise;
    }

    async function apiFetch(url, options = {}) {
        const headers = new Headers(options.headers || {});
        let token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

        if (!token) {
            token = await refreshAccessToken();
        }

        async function sendRequest(accessToken) {
            const requestHeaders = new Headers(headers);
            requestHeaders.set("Authorization", `Bearer ${accessToken}`);

            return fetch(url, {
                ...options,
                headers: requestHeaders
            });
        }

        let response = await sendRequest(token);

        if (response.status === 401) {
            token = await refreshAccessToken();
            response = await sendRequest(token);

            if (response.status === 401) {
                logout();
                throw new Error(
                    "Your session expired. Please sign in again."
                );
            }
        }

        return response;
    }

    async function getCompanyId() {
        if (!companyIdPromise) {
            companyIdPromise = (async function () {
                const response = await apiFetch("/api/companies/");
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.detail || "Unable to load your company."
                    );
                }

                const companies = Array.isArray(data)
                    ? data
                    : (data.results || []);

                if (!companies.length) {
                    throw new Error(
                        "No company is linked to this account."
                    );
                }

                const selectedCompany = companies.find(
                    company =>
                        Number(company.id) === PREFERRED_COMPANY_ID = 8;
                );

                if (!selectedCompany) {
                    throw new Error(
                        "Your account does not have access to Company ID 8. " +
                        "Available IDs: " +
                        companies.map(company => company.id).join(", ")
                    );
                }

                return selectedCompany.id;
            })().catch(function (error) {
                companyIdPromise = null;
                throw error;
            });
        }

        return companyIdPromise;
    }

    window.InvoiceProAuth = {
        apiFetch: apiFetch,
        getCompanyId: getCompanyId,
        logout: logout
    };

    document.querySelectorAll("#logoutButton").forEach(function (button) {
        button.addEventListener("click", logout);
    });
})();
