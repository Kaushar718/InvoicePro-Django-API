
const COMPANY_ID = 8;
const API_BASE = `/api/companies/${COMPANY_ID}`;

const messageBox = document.getElementById("messageBox");
const invoiceTable = document.getElementById("invoiceTable");
const revenueChart = document.getElementById("revenueChart");

function formatMoney(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) {
        throw new Error("Unexpected monetary value in API response.");
    }

    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    });
}

function getArray(data) {
    if (Array.isArray(data)) return data;
    throw new Error("Unexpected API response: expected an array.");
}

function showError(message) {
    messageBox.textContent = message;
    messageBox.className = "message error";
}

async function apiGet(url) {
    const response = await InvoiceProAuth.apiFetch(url, {
        headers: { "Accept": "application/json" }
    });
    let data;
    try {
        data = await response.json();
    } catch (error) {
        if (!response.ok) {
            throw new Error(`API request failed (${response.status}).`);
        }
        throw new Error("The API returned invalid JSON.");
    }

    if (!response.ok) {
        throw new Error(getApiError(data, response.status));
    }

    return data;
}

function getApiError(data, status) {
    if (data && typeof data === "object") {
        if (typeof data.detail === "string") return data.detail;
        const messages = Object.entries(data)
            .map(([field, errors]) => {
                const text = Array.isArray(errors)
                    ? errors.join(", ")
                    : String(errors);
                return `${field}: ${text}`;
            })
            .filter(Boolean);

        if (messages.length) return messages.join(" | ");
    }

    return `API request failed (${status}).`;
}

function setText(id, value) {
    document.getElementById(id).textContent = value;
}

function extractRevenueRows(data) {
    return getArray(data).map(item => {
        if (!item) {
            throw new Error("Unexpected monthly revenue response.");
        }

        const revenue = Number(item.revenue);
        if (
            typeof item.month !== "string" ||
            item.revenue === null ||
            item.revenue === undefined ||
            !Number.isFinite(revenue)
        ) {
            throw new Error("Unexpected monthly revenue response.");
        }
        return { month: item.month, revenue };
    });
}

function validateInvoices(data) {
    const rows = getArray(data);
    if (rows.some(invoice =>
        !invoice ||
        typeof invoice.invoice_number !== "string" ||
        invoice.client === null ||
        invoice.client === undefined ||
        !Number.isFinite(Number(invoice.client)) ||
        typeof invoice.issue_date !== "string" ||
        typeof invoice.status !== "string" ||
        invoice.total_amount === null ||
        invoice.total_amount === undefined ||
        !Number.isFinite(Number(invoice.total_amount)) ||
        invoice.paid_amount === null ||
        invoice.paid_amount === undefined ||
        !Number.isFinite(Number(invoice.paid_amount)) ||
        invoice.remaining_amount === null ||
        invoice.remaining_amount === undefined ||
        !Number.isFinite(Number(invoice.remaining_amount))
    )) {
        throw new Error("Unexpected invoice response.");
    }
    return rows;
}

function renderRevenueChart(data) {
    const rows = extractRevenueRows(data);

    revenueChart.innerHTML = "";

    if (!rows.length) {
        revenueChart.innerHTML =
            '<p class="empty">No monthly revenue data available.</p>';
        return;
    }

    const maximum = Math.max(
        ...rows.map(item => item.revenue),
        1
    );

    rows.forEach(item => {
        const revenue = item.revenue;

        const group = document.createElement("div");
        group.className = "bar-group";

        const value = document.createElement("div");
        value.className = "bar-value";
        value.textContent = formatMoney(revenue);

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height =
            `${Math.max(4, (revenue / maximum) * 150)}px`;

        const month = document.createElement("div");
        month.className = "bar-label";
        month.textContent = item.month;

        group.append(value, bar, month);
        revenueChart.appendChild(group);
    });
}

function renderInvoices(invoices) {
    invoiceTable.innerHTML = "";

    if (!invoices.length) {
        invoiceTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">No invoices found.</td>
            </tr>
        `;
        return;
    }

    invoices.forEach(invoice => {
        const row = document.createElement("tr");

        const status = invoice.status.toUpperCase();

        const values = [
            invoice.invoice_number || "—",
            invoice.client,
            invoice.issue_date || "—"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `status ${status}`;
        badge.textContent = status;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        [
            invoice.total_amount,
            invoice.paid_amount,
            invoice.remaining_amount
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = formatMoney(value);
            row.appendChild(cell);
        });

        invoiceTable.appendChild(row);
    });
}

async function loadReports() {
    try {
        const [dashboard, revenueData, invoiceData] = await Promise.all([
            apiGet(`${API_BASE}/dashboard/`),
            apiGet(`${API_BASE}/monthly-revenue/`),
            apiGet(`${API_BASE}/invoices/`)
        ]);

        const invoices = validateInvoices(invoiceData);
        const dashboardFields = [
            "total_invoices",
            "total_invoiced",
            "total_received",
            "outstanding",
            "total_clients",
            "total_products",
            "paid_invoices",
            "pending_invoices",
            "overdue_invoices"
        ];
        if (
            !dashboard ||
            typeof dashboard !== "object" ||
            dashboardFields.some(field =>
                dashboard[field] === null ||
                dashboard[field] === undefined ||
                !Number.isFinite(Number(dashboard[field]))
            )
        ) {
            throw new Error("Unexpected dashboard response.");
        }

        setText("totalInvoices", dashboard.total_invoices);
        setText("totalRevenue", formatMoney(dashboard.total_invoiced));
        setText("totalPayments", formatMoney(dashboard.total_received));
        setText("outstanding", formatMoney(dashboard.outstanding));
        setText("totalClients", dashboard.total_clients);
        setText("totalProducts", dashboard.total_products);
        setText("paidInvoices", dashboard.paid_invoices);
        setText("pendingInvoices", dashboard.pending_invoices);
        setText("overdueInvoices", dashboard.overdue_invoices);

        renderRevenueChart(revenueData);
        renderInvoices(invoices);

    } catch (error) {
        showError(error.message);
    }
}

document.getElementById("refreshBtn").addEventListener(
    "click",
    loadReports
);

loadReports();
