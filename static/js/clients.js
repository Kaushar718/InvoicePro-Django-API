
let API_URL = "";

let clients = [];
let editingClientId = null;

const form = document.getElementById("clientForm");
const rows = document.getElementById("clientRows");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = `alert alert-${type}`;
}

async function apiRequest(url, options = {}) {

    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const response = await InvoiceProAuth.apiFetch(url, {
        ...options,
        headers
    });

    const data = response.status === 204
        ? null
        : await response.json();

    if (!response.ok) {
        const error = data?.detail ||
            Object.entries(data || {})
                .map(([key, value]) =>
                    `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
                )
                .join(" | ");

        throw new Error(error || "Something went wrong.");
    }

    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

async function loadClients() {

    try {
        const result = await apiRequest(API_URL);
        clients = Array.isArray(result)
            ? result
            : (result.results || []);
        renderClients();

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

function renderClients() {

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const filteredClients = clients.filter(client =>
        [
            client.name,
            client.email,
            client.phone,
            client.city
        ].some(value =>
            String(value ?? "").toLowerCase().includes(search)
        )
    );

    document.getElementById("clientCount").textContent =
        `${filteredClients.length} client(s) found`;

    if (filteredClients.length === 0) {
        rows.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    No clients found.
                </td>
            </tr>
        `;
        return;
    }

    rows.innerHTML = filteredClients.map(client => `
        <tr>
            <td class="client-name">${escapeHTML(client.name)}</td>
            <td>${escapeHTML(client.email || "-")}</td>
            <td>${escapeHTML(client.phone || "-")}</td>
            <td>${escapeHTML(client.city || "-")}</td>

            <td>
                <button
                    class="client-action-btn edit-btn"
                    data-action="edit"
                    data-id="${client.id}">
                    Edit
                </button>

                <button
                    class="client-action-btn delete-btn"
                    data-action="delete"
                    data-id="${client.id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

function getFormData() {

    return {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim() || null,
        phone: document.getElementById("phone").value.trim(),
        gst_number: document.getElementById("gst_number").value.trim() || null,
        address: document.getElementById("address").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        pincode: document.getElementById("pincode").value.trim()
    };
}

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const payload = getFormData();

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {

        if (editingClientId) {

            await apiRequest(`${API_URL}${editingClientId}/`, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });

            showMessage("Client updated successfully!");

        } else {

            await apiRequest(API_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            showMessage("Client created successfully!");

        }

        resetForm();
        await loadClients();

    } catch (error) {

        showMessage(error.message, "danger");

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = editingClientId
            ? "Update Client"
            : "Add Client";
    }
});

function editClient(id) {

    const client = clients.find(item => item.id === id);

    if (!client) return;

    editingClientId = id;

    document.getElementById("name").value = client.name || "";
    document.getElementById("email").value = client.email || "";
    document.getElementById("phone").value = client.phone || "";
    document.getElementById("gst_number").value = client.gst_number || "";
    document.getElementById("address").value = client.address || "";
    document.getElementById("city").value = client.city || "";
    document.getElementById("state").value = client.state || "";
    document.getElementById("pincode").value = client.pincode || "";

    document.getElementById("formTitle").textContent = "Edit Client";

    submitButton.textContent = "Update Client";

    document.getElementById("cancelEdit").classList.remove("d-none");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deleteClient(id) {

    const confirmed = window.confirm(
        "Are you sure you want to delete this client?"
    );

    if (!confirmed) return;

    try {

        await apiRequest(`${API_URL}${id}/`, {
            method: "DELETE"
        });

        showMessage("Client deleted successfully!");

        if (editingClientId === id) {
            resetForm();
        }

        await loadClients();

    } catch (error) {

        showMessage(error.message, "danger");

    }
}

rows.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editClient(id);
    }

    if (button.dataset.action === "delete") {
        deleteClient(id);
    }
});

function resetForm() {

    form.reset();
    editingClientId = null;

    document.getElementById("formTitle").textContent = "Add New Client";

    submitButton.textContent = "Add Client";

    document.getElementById("cancelEdit").classList.add("d-none");
}

document.getElementById("cancelEdit").addEventListener("click", resetForm);

document.getElementById("searchInput").addEventListener("input", renderClients);

async function initializeClientsPage() {
    try {
        const companyId = await InvoiceProAuth.getCompanyId();
        API_URL = `/api/companies/${companyId}/clients/`;
        await loadClients();
    } catch (error) {
        showMessage(error.message, "danger");
    }
}

initializeClientsPage();