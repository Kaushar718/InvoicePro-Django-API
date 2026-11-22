
// InvoicePro Dashboard
// Actual business data is stored under Company ID 8.
const INVOICEPRO_COMPANY_ID = 8;

async function apiRequest(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await InvoiceProAuth.apiFetch(url, {
        ...options,
        headers
    });

    let data;

    try {
        data = await response.json();
    } catch (error) {
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        throw new Error("The API returned invalid JSON.");
    }

    if (!response.ok) {
        if (typeof data.detail === "string") {
            throw new Error(data.detail);
        }

        if (typeof data.error === "string") {
            throw new Error(data.error);
        }

        const messages = Object.entries(data)
            .map(([field, errors]) => {
                const readableErrors = Array.isArray(errors)
                    ? errors.join(", ")
                    : typeof errors === "string"
                        ? errors
                        : JSON.stringify(errors);

                return `${field}: ${readableErrors}`;
            });

        throw new Error(
            messages.join(" | ") || `API request failed: ${response.status}`
        );
    }

    return data;
}

function formatMoney(value) {
    return "Rs. " + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

async function loadDashboard() {
    const errorBox = document.getElementById("errorMessage");

    try {
        errorBox.classList.add("d-none");

        // Always load the verified business company.
        const companyId = INVOICEPRO_COMPANY_ID;

        const [dashboard, revenue, invoices, user] = await Promise.all([
            apiRequest(`/api/companies/${companyId}/dashboard/`),
            apiRequest(`/api/companies/${companyId}/monthly-revenue/`),
            apiRequest(`/api/companies/${companyId}/invoices/`),
            apiRequest("/api/auth/me/")
        ]);

        // Prevent silently displaying data from another company.
        if (Number(dashboard.company_id) !== companyId) {
            throw new Error(
                "Dashboard returned data for an unexpected company."
            );
        }

        document.getElementById("userEmail").textContent = user.email;

        document.getElementById("totalInvoices").textContent =
            dashboard.total_invoices;

        document.getElementById("totalReceived").textContent =
            formatMoney(dashboard.total_received);

        document.getElementById("outstanding").textContent =
            formatMoney(dashboard.outstanding);

        document.getElementById("totalClients").textContent =
            dashboard.total_clients;

        document.getElementById("totalProducts").textContent =
            dashboard.total_products;

        document.getElementById("paidInvoices").textContent =
            dashboard.paid_invoices;

        document.getElementById("pendingInvoices").textContent =
            dashboard.pending_invoices;

        document.getElementById("overdueInvoices").textContent =
            dashboard.overdue_invoices;

        document.getElementById("companyName").textContent =
            dashboard.company_name;

        document.getElementById("totalInvoiced").textContent =
            formatMoney(dashboard.total_invoiced);

        document.getElementById("receivedAmount").textContent =
            formatMoney(dashboard.total_received);

        document.getElementById("issuedInvoiceAmount").textContent =
            formatMoney(dashboard.issued_invoice_amount);

        document.getElementById("draftInvoiceAmount").textContent =
            formatMoney(dashboard.draft_invoice_amount);

        renderInvoices(invoices);
        renderRevenueChart(revenue);

        console.info("InvoicePro Dashboard loaded:", {
            companyId: companyId,
            invoices: dashboard.total_invoices,
            clients: dashboard.total_clients,
            products: dashboard.total_products,
            revenue: dashboard.total_received
        });

    } catch (error) {
        console.error("Dashboard loading failed:", error);

        errorBox.textContent = error.message;
        errorBox.classList.remove("d-none");
    }
}

function renderInvoices(responseData) {
    const table = document.getElementById("invoiceRows");

    // Support both normal arrays and paginated DRF responses.
    const invoices = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.results)
            ? responseData.results
            : [];

    if (invoices.length === 0) {
        table.innerHTML =
            '<tr><td colspan="5">No invoices found.</td></tr>';
        return;
    }

    table.innerHTML = invoices.slice(0, 5).map(invoice => {
        const status = invoice.status || "UNKNOWN";
        let badgeClass = "status-badge";

        if (status === "PAID") {
            badgeClass += " status-paid";
        } else if (status === "OVERDUE") {
            badgeClass += " status-overdue";
        }

        return `
            <tr>
                <td>${escapeHTML(invoice.invoice_number)}</td>
                <td>${escapeHTML(invoice.client)}</td>
                <td>${escapeHTML(invoice.issue_date)}</td>
                <td>${formatMoney(invoice.total_amount)}</td>
                <td>
                    <span class="${badgeClass}">
                        ${escapeHTML(status)}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

let revenueChartInstance = null;

function renderRevenueChart(revenue) {
    const canvas = document.getElementById("revenueChart");

    if (!Array.isArray(revenue) || revenue.length === 0) {
        if (revenueChartInstance) {
            revenueChartInstance.destroy();
            revenueChartInstance = null;
        }

        canvas.parentElement.innerHTML =
            "<p>No revenue data available yet.</p>";

        return;
    }

    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    revenueChartInstance = new Chart(canvas, {
        type: "bar",

        data: {
            labels: revenue.map(item => item.month),

            datasets: [{
                label: "Revenue",
                data: revenue.map(item => Number(item.revenue)),
                backgroundColor: "#3b82f6",
                borderRadius: 7
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


/* -------------------------------------------------------
   InvoicePro AI Financial Assistant
------------------------------------------------------- */

const assistantHistory = [];
const MAX_ASSISTANT_HISTORY = 8;

let assistantIsBusy = false;

function getAssistantElements() {
    return {
        form: document.getElementById("assistantForm"),
        input: document.getElementById("assistantInput"),
        sendButton: document.getElementById("assistantSendButton"),
        messages: document.getElementById("assistantMessages"),
        status: document.getElementById("assistantStatus"),
        characterCount: document.getElementById("assistantCharacterCount"),
        clearButton: document.getElementById("clearAssistantChat")
    };
}


function appendAssistantMessage(role, message) {
    const elements = getAssistantElements();
    const isUser = role === "user";

    const messageRow = document.createElement("div");
    messageRow.className = isUser
        ? "assistant-message assistant-message-user"
        : "assistant-message assistant-message-bot";

    const avatar = document.createElement("div");
    avatar.className = "assistant-message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = isUser ? "You" : "AI";

    const content = document.createElement("div");
    content.className = "assistant-message-content";

    const name = document.createElement("div");
    name.className = "assistant-message-name";
    name.textContent = isUser ? "You" : "InvoicePro AI";

    const bubble = document.createElement("div");
    bubble.className = "assistant-message-bubble";

    const text = String(message ?? "");

    if (
        !isUser &&
        window.marked &&
        window.DOMPurify
    ) {
        const html = window.marked.parse(text, {
            gfm: true,
            breaks: true
        });

        bubble.innerHTML = window.DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true }
        });
    } else {
        bubble.textContent = text;
    }

    content.append(name, bubble);

    if (isUser) {
        messageRow.append(content, avatar);
    } else {
        messageRow.append(avatar, content);
    }

    elements.messages.appendChild(messageRow);
    elements.messages.scrollTop = elements.messages.scrollHeight;

    return messageRow;
}


function setAssistantBusy(isBusy) {
    const elements = getAssistantElements();

    assistantIsBusy = isBusy;

    elements.input.disabled = isBusy;
    elements.sendButton.disabled = isBusy;
    elements.clearButton.disabled = isBusy;

    elements.sendButton.textContent = isBusy
        ? "Thinking..."
        : "Send";
}

function updateAssistantCharacterCount() {
    const elements = getAssistantElements();

    elements.characterCount.textContent =
        `${elements.input.value.length} / 1000`;
}

function resetAssistantChat() {
    if (assistantIsBusy) {
        return;
    }

    assistantHistory.length = 0;

    const elements = getAssistantElements();

    elements.messages.innerHTML = "";

    appendAssistantMessage(
        "assistant",
        "Hi! I'm your financial assistant. Ask me anything about your company's invoices, received payments, outstanding balance or revenue. You can type naturally in English, Hindi or Hinglish."
    );

    elements.status.textContent = "New conversation started.";

    elements.input.value = "";

    updateAssistantCharacterCount();
    elements.input.focus();
}

async function sendAssistantMessage(event) {
    event.preventDefault();

    const elements = getAssistantElements();
    const message = elements.input.value.trim();

    if (!message || assistantIsBusy) {
        return;
    }

    if (message.length > 1000) {
        elements.status.textContent =
            "Please keep your question under 1,000 characters.";
        return;
    }

    appendAssistantMessage("user", message);

    elements.input.value = "";
    updateAssistantCharacterCount();

    elements.status.textContent =
        "InvoicePro AI is analysing your company data...";

    setAssistantBusy(true);

    try {
        // Use the same verified company for the AI request.
        const companyId = INVOICEPRO_COMPANY_ID;

        const result = await apiRequest(
            `/api/companies/${companyId}/financial-assistant/`,
            {
                method: "POST",

                body: JSON.stringify({
                    message: message,
                    history: assistantHistory.slice(-MAX_ASSISTANT_HISTORY)
                })
            }
        );

        if (
            typeof result.answer !== "string" ||
            !result.answer.trim()
        ) {
            throw new Error(
                "The assistant returned an empty or invalid response."
            );
        }

        appendAssistantMessage("assistant", result.answer);

        assistantHistory.push(
            { role: "user", content: message },
            { role: "assistant", content: result.answer }
        );

        if (assistantHistory.length > MAX_ASSISTANT_HISTORY) {
            assistantHistory.splice(
                0,
                assistantHistory.length - MAX_ASSISTANT_HISTORY
            );
        }

        elements.status.textContent =
            "Reply generated from your company financial data.";

    } catch (error) {
        console.error("Financial Assistant error:", error);

        appendAssistantMessage(
            "assistant",
            `I couldn't answer that right now. ${error.message}`
        );

        elements.status.textContent =
            "Message failed. You can try again.";

    } finally {
        setAssistantBusy(false);
        elements.input.focus();
        elements.messages.scrollTop =
            elements.messages.scrollHeight;
    }
}

function initialiseFinancialAssistant() {
    const elements = getAssistantElements();

    if (!elements.form || !elements.input) {
        console.error("Financial Assistant elements were not found.");
        return;
    }

    elements.form.addEventListener(
        "submit",
        sendAssistantMessage
    );

    elements.input.addEventListener(
        "input",
        updateAssistantCharacterCount
    );

    elements.clearButton.addEventListener(
        "click",
        resetAssistantChat
    );

    elements.input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            elements.form.requestSubmit();
        }
    });

    updateAssistantCharacterCount();
}

document.addEventListener("DOMContentLoaded", () => {
    initialiseFinancialAssistant();
    loadDashboard();
});
