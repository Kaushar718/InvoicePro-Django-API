
const COMPANY_ID = 8;
const API_BASE = `/api/companies/${COMPANY_ID}`;

const invoiceSelect = document.getElementById("invoiceSelect");
const paymentForm = document.getElementById("paymentForm");
const paymentsTable = document.getElementById("paymentsTable");
const messageBox = document.getElementById("messageBox");
const submitButton = document.getElementById("submitPayment");

let invoices = [];
let selectedInvoice = null;

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

function validateInvoices(data) {
    const rows = getArray(data);
    if (rows.some(invoice =>
        !invoice ||
        invoice.id === null ||
        invoice.id === undefined ||
        !Number.isFinite(Number(invoice.id)) ||
        typeof invoice.invoice_number !== "string" ||
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

function validatePayments(data) {
    const rows = getArray(data);
    if (rows.some(payment =>
        !payment ||
        payment.id === null ||
        payment.id === undefined ||
        !Number.isFinite(Number(payment.id)) ||
        typeof payment.invoice_number !== "string" ||
        payment.amount === null ||
        payment.amount === undefined ||
        !Number.isFinite(Number(payment.amount)) ||
        typeof payment.payment_method !== "string" ||
        typeof payment.payment_date !== "string"
    )) {
        throw new Error("Unexpected payment response.");
    }
    return rows;
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

function getLocalDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

document.getElementById("paymentDate").value = getLocalDate();

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
            throw new Error(`API request failed (${response.status}).`);
        }
        throw new Error("The API returned invalid JSON.");
    }

    if (!response.ok) {
        throw new Error(getApiError(data, response.status));
    }

    return data;
}

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

async function loadInvoices() {
    try {
        const data = await apiRequest(`${API_BASE}/invoices/`);
        invoices = validateInvoices(data);

        invoiceSelect.innerHTML =
            '<option value="">Select an invoice</option>';

        invoices.forEach(invoice => {
            const option = document.createElement("option");
            option.value = invoice.id;

            option.textContent =
                `${invoice.invoice_number} — ${invoice.status || "Invoice"}`;

            invoiceSelect.appendChild(option);
        });

        if (!invoices.length) {
            invoiceSelect.innerHTML =
                '<option value="">No invoices found</option>';
        }

        updateTotalReceived();

    } catch (error) {
        showMessage(error.message, "error");
    }
}

function updateTotalReceived() {
    const total = invoices.reduce((sum, invoice) => {
        return sum + Number(invoice.paid_amount);
    }, 0);

    document.getElementById("totalReceived").textContent =
        formatMoney(total);
}

function updateInvoiceSummary(invoice) {
    const total = Number(invoice.total_amount);
    const paid = Number(invoice.paid_amount);
    const remaining = Number(invoice.remaining_amount);

    document.getElementById("invoiceTotal").textContent =
        formatMoney(total);

    document.getElementById("paidAmount").textContent =
        formatMoney(paid);

    document.getElementById("remainingAmount").textContent =
        formatMoney(remaining);

    const amountInput = document.getElementById("amount");
    amountInput.max = remaining.toFixed(2);
    submitButton.disabled = !invoice.id || remaining <= 0;
}

async function loadPaymentHistory(invoiceId) {
    paymentsTable.innerHTML = `
        <tr>
            <td colspan="7" class="empty">Loading payment history...</td>
        </tr>
    `;

    try {
        const data = await apiRequest(
            `${API_BASE}/invoices/${invoiceId}/payments/`
        );
        const payments = validatePayments(data);

        paymentsTable.innerHTML = "";

        document.getElementById("historySubtitle").textContent =
            `${payments.length} payment record(s) found`;

        if (!payments.length) {
            paymentsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="empty">No payments recorded yet.</td>
                </tr>
            `;
            return;
        }

        payments.forEach(payment => {
            const row = document.createElement("tr");

            const values = [
                payment.id,
                payment.invoice_number,
                formatMoney(payment.amount),
                payment.payment_method,
                payment.transaction_reference || "—",
                payment.payment_date,
                payment.notes || "—"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            paymentsTable.appendChild(row);
        });

    } catch (error) {
        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">Unable to load payments.</td>
            </tr>
        `;

        showMessage(error.message, "error");
    }
}

invoiceSelect.addEventListener("change", async function () {
    const invoiceId = Number(this.value);

    selectedInvoice = invoices.find(
        invoice => Number(invoice.id) === invoiceId
    ) || null;

    if (!selectedInvoice) {
        updateInvoiceSummary({
            id: null,
            total_amount: 0,
            paid_amount: 0,
            remaining_amount: 0
        });
        paymentsTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty">Select an invoice.</td>
            </tr>
        `;
        return;
    }

    updateInvoiceSummary(selectedInvoice);
    await loadPaymentHistory(invoiceId);
});

paymentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!selectedInvoice) {
        showMessage("Please select an invoice first.", "error");
        return;
    }

    const amount = Number(document.getElementById("amount").value);

    const remaining = Number(
        selectedInvoice.remaining_amount
    );

    if (!Number.isFinite(amount) || amount <= 0) {
        showMessage("Payment amount must be greater than zero.", "error");
        return;
    }

    if (amount > remaining) {
        showMessage(
            `Payment cannot exceed the remaining balance of ${formatMoney(remaining)}.`,
            "error"
        );
        return;
    }

    const payload = {
        amount: amount.toFixed(2),
        payment_method: document.getElementById("paymentMethod").value,
        transaction_reference:
            document.getElementById("transactionReference").value.trim(),
        payment_date: document.getElementById("paymentDate").value,
        notes: document.getElementById("notes").value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = "Recording...";

    try {
        await apiRequest(
            `${API_BASE}/invoices/${selectedInvoice.id}/payments/`,
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );

        showMessage("Payment recorded successfully!", "success");

        paymentForm.reset();
        document.getElementById("paymentDate").value = getLocalDate();

        const selectedId = selectedInvoice.id;

        await loadInvoices();

        invoiceSelect.value = String(selectedId);

        selectedInvoice = invoices.find(
            invoice => Number(invoice.id) === Number(selectedId)
        ) || null;

        if (selectedInvoice) {
            updateInvoiceSummary(selectedInvoice);
            await loadPaymentHistory(selectedId);
        }

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        const remaining = selectedInvoice
            ? Number(selectedInvoice.remaining_amount)
            : 0;
        submitButton.disabled = !selectedInvoice || remaining <= 0;
        submitButton.textContent = "Record Payment";
    }
});

document.getElementById("refreshBtn").addEventListener("click", async () => {
    await loadInvoices();

    if (selectedInvoice) {
        selectedInvoice = invoices.find(
            invoice => Number(invoice.id) === Number(selectedInvoice.id)
        ) || null;

        if (selectedInvoice) {
            updateInvoiceSummary(selectedInvoice);
            await loadPaymentHistory(selectedInvoice.id);
        }
    }
});

async function initializePaymentsPage() {
    try {
        await loadInvoices();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

updateInvoiceSummary({
    id: null,
    total_amount: 0,
    paid_amount: 0,
    remaining_amount: 0
});
initializePaymentsPage();
