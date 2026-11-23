
let CLIENT_API = "";
let PRODUCT_API = "";
let INVOICE_API = "";

let clients = [];
let products = [];

const invoiceForm = document.getElementById("invoiceForm");
const itemsContainer = document.getElementById("invoiceItems");
const invoiceRows = document.getElementById("invoiceRows");
const messageBox = document.getElementById("message");


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
        : await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data?.detail ||
            JSON.stringify(data) ||
            `API request failed (${response.status}).`
        );
    }

    return data;
}


function showMessage(text, type = "success") {
    messageBox.textContent = text;
    messageBox.className = `alert alert-${type}`;
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


function formatMoney(value) {
    return "Rs. " + Number(value || 0).toFixed(2);
}


function getArray(data) {
    if (Array.isArray(data)) return data;
    return data?.results || [];
}


// ========================================
// INITIAL DATA LOADING
// ========================================

async function loadInitialData() {
    try {
        const companyId = await InvoiceProAuth.getCompanyId();

        if (!companyId) {
            throw new Error(
                "No company workspace found. Please log in again."
            );
        }

        CLIENT_API = `/api/companies/${companyId}/clients/`;
        PRODUCT_API = `/api/companies/${companyId}/products/`;
        INVOICE_API = `/api/companies/${companyId}/invoices/`;

        const [clientData, productData] = await Promise.all([
            apiRequest(CLIENT_API),
            apiRequest(PRODUCT_API)
        ]);

        clients = getArray(clientData);
        products = getArray(productData).filter(
            product => product.is_active
        );

        const clientSelect = document.getElementById("client");

        clientSelect.innerHTML =
            '<option value="">Select a client</option>';

        clients.forEach(client => {
            const option = document.createElement("option");

            option.value = client.id;
            option.textContent = client.name;

            clientSelect.appendChild(option);
        });

        document.getElementById("issue_date").value =
            new Date().toISOString().slice(0, 10);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        document.getElementById("due_date").value =
            dueDate.toISOString().slice(0, 10);

        addItemRow();

        await loadInvoices();

    } catch (error) {
        console.error("Invoice initialization error:", error);
        showMessage(error.message, "danger");
    }
}


// ========================================
// INVOICE ITEM ROWS
// ========================================

function addItemRow() {
    const row = document.createElement("div");
    row.className = "invoice-item-row";

    const productField = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = "Select Product";

    const select = document.createElement("select");
    select.className = "form-select product-select";
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Choose product";

    select.appendChild(defaultOption);

    products.forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent =
            `${product.name} | ${product.sku} | ${formatMoney(product.price)}`;

        select.appendChild(option);
    });

    productField.appendChild(label);
    productField.appendChild(select);

    const quantityField = document.createElement("div");

    const quantityLabel = document.createElement("label");
    quantityLabel.textContent = "Quantity";

    const quantityInput = document.createElement("input");

    quantityInput.type = "number";
    quantityInput.className = "form-control quantity-input";
    quantityInput.min = "0.01";
    quantityInput.step = "0.01";
    quantityInput.value = "1";
    quantityInput.required = true;

    quantityField.appendChild(quantityLabel);
    quantityField.appendChild(quantityInput);

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "remove-item-btn";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
        row.remove();
        updateTotals();
    });

    select.addEventListener("change", updateTotals);
    quantityInput.addEventListener("input", updateTotals);

    row.appendChild(productField);
    row.appendChild(quantityField);
    row.appendChild(removeButton);

    itemsContainer.appendChild(row);

    updateTotals();
}


function getSelectedItems() {
    const rows = itemsContainer.querySelectorAll(".invoice-item-row");

    return Array.from(rows).map(row => {
        const productId = Number(
            row.querySelector(".product-select").value
        );

        const quantity = Number(
            row.querySelector(".quantity-input").value
        );

        const product = products.find(
            item => Number(item.id) === productId
        );

        if (!product || !Number.isFinite(quantity) || quantity <= 0) {
            return null;
        }

        return {
            product: product.id,
            description: product.name,
            quantity: quantity.toFixed(2),
            unit_price: product.price,
            gst_rate: product.gst_rate
        };
    });
}


// ========================================
// TOTAL CALCULATION
// ========================================

function updateTotals() {
    const selectedItems = getSelectedItems();

    let subtotal = 0;
    let tax = 0;

    selectedItems.forEach(item => {
        if (!item) return;

        const lineSubtotal =
            Number(item.quantity) * Number(item.unit_price);

        subtotal += lineSubtotal;

        tax += lineSubtotal * Number(item.gst_rate) / 100;
    });

    const discount = Math.max(
        0,
        Number(document.getElementById("discount").value || 0)
    );

    document.getElementById("subtotal").textContent =
        formatMoney(subtotal);

    document.getElementById("taxAmount").textContent =
        formatMoney(tax);

    document.getElementById("grandTotal").textContent =
        formatMoney(Math.max(0, subtotal + tax - discount));
}


document.getElementById("addItemButton").addEventListener(
    "click",
    addItemRow
);

document.getElementById("discount").addEventListener(
    "input",
    updateTotals
);


// ========================================
// CREATE INVOICE
// ========================================

invoiceForm.addEventListener("submit", async event => {
    event.preventDefault();

    const clientId = Number(
        document.getElementById("client").value
    );

    const selectedItems = getSelectedItems();

    if (!clientId) {
        showMessage("Please select a client.", "danger");
        return;
    }

    if (
        selectedItems.length === 0 ||
        selectedItems.some(item => item === null)
    ) {
        showMessage(
            "Please select a valid product and quantity for every item.",
            "danger"
        );
        return;
    }

    const issueDate = document.getElementById("issue_date").value;
    const dueDate = document.getElementById("due_date").value;

    if (!issueDate || !dueDate || dueDate < issueDate) {
        showMessage(
            "Due date cannot be before issue date.",
            "danger"
        );
        return;
    }

    const discount = Number(
        document.getElementById("discount").value || 0
    );

    if (!Number.isFinite(discount) || discount < 0) {
        showMessage("Please enter a valid discount.", "danger");
        return;
    }

    const payload = {
        client: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        status: "DRAFT",
        discount_amount: discount.toFixed(2),
        notes: document.getElementById("notes").value,
        terms_and_conditions:
            document.getElementById("terms").value,
        items: selectedItems
    };

    const button = document.getElementById("createButton");

    button.disabled = true;
    button.textContent = "Creating Invoice...";

    try {
        const invoice = await apiRequest(INVOICE_API, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        showMessage(
            `Invoice ${invoice.invoice_number} created successfully!`
        );

        invoiceForm.reset();
        itemsContainer.innerHTML = "";

        document.getElementById("issue_date").value =
            new Date().toISOString().slice(0, 10);

        const due = new Date();
        due.setDate(due.getDate() + 7);

        document.getElementById("due_date").value =
            due.toISOString().slice(0, 10);

        addItemRow();
        updateTotals();

        await loadInvoices();

    } catch (error) {
        console.error("Invoice creation error:", error);
        showMessage(error.message, "danger");

    } finally {
        button.disabled = false;
        button.textContent = "Create Invoice";
    }
});


// ========================================
// LOAD INVOICES
// ========================================

async function loadInvoices() {
    try {
        const data = await apiRequest(INVOICE_API);
        const invoices = getArray(data);

        invoiceRows.innerHTML = "";

        if (invoices.length === 0) {
            invoiceRows.innerHTML =
                '<tr><td colspan="6">No invoices found.</td></tr>';
            return;
        }

        invoices.forEach(invoice => {
            const row = document.createElement("tr");

            const status = String(invoice.status || "UNKNOWN");

            row.innerHTML = `
                <td>${escapeHTML(invoice.invoice_number)}</td>
                <td>${escapeHTML(invoice.client)}</td>
                <td>${escapeHTML(invoice.issue_date)}</td>
                <td>${formatMoney(invoice.total_amount)}</td>
                <td>
                    <span class="invoice-status ${escapeHTML(status)}">
                        ${escapeHTML(status)}
                    </span>
                </td>
                <td>
                    <button
                        type="button"
                        class="download-btn"
                        data-invoice-id="${Number(invoice.id)}">
                        Download PDF
                    </button>
                </td>
            `;

            invoiceRows.appendChild(row);
        });

    } catch (error) {
        console.error("Invoice loading error:", error);
        showMessage(error.message, "danger");

        invoiceRows.innerHTML =
            '<tr><td colspan="6">Unable to load invoices.</td></tr>';
    }
}


// ========================================
// PDF DOWNLOAD
// ========================================

invoiceRows.addEventListener("click", async event => {
    const button = event.target.closest(".download-btn");

    if (!button) return;

    const invoiceId = button.dataset.invoiceId;

    if (!invoiceId) {
        showMessage("Invoice ID is missing.", "danger");
        return;
    }

    button.disabled = true;
    button.textContent = "Downloading...";

    let objectURL = null;

    try {
        const response = await InvoiceProAuth.apiFetch(
            `${INVOICE_API}${invoiceId}/pdf/`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            let errorMessage =
                `PDF download failed (HTTP ${response.status}).`;

            const rawResponse = await response.text().catch(() => "");

            if (rawResponse) {
                try {
                    const data = JSON.parse(rawResponse);

                    errorMessage =
                        data.detail ||
                        data.error ||
                        data.message ||
                        errorMessage;

                } catch (parseError) {
                    if (response.status === 500) {
                        errorMessage =
                            "PDF generation failed on the server (HTTP 500).";
                    } else if (response.status === 403) {
                        errorMessage =
                            "You do not have permission to download this invoice.";
                    } else if (response.status === 404) {
                        errorMessage =
                            "Invoice not found.";
                    }
                }
            }

            throw new Error(errorMessage);
        }

        const blob = await response.blob();

        const mimeType = (blob.type || "")
            .split(";")[0]
            .trim()
            .toLowerCase();

        if (!blob.size || mimeType !== "application/pdf") {
            throw new Error(
                `Invalid PDF response. Received: ${mimeType || "unknown file type"}.`
            );
        }

        objectURL = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = objectURL;
        link.download = `Invoice-${invoiceId}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Give the browser time to start the download.
        window.setTimeout(() => {
            if (objectURL) {
                URL.revokeObjectURL(objectURL);
            }
        }, 2000);

        showMessage(
            "Invoice PDF downloaded successfully!",
            "success"
        );

    } catch (error) {
        console.error("Invoice PDF download error:", error);

        showMessage(
            error.message || "Unable to download invoice PDF.",
            "danger"
        );

    } finally {
        button.disabled = false;
        button.textContent = "Download PDF";
    }
});


// ========================================
// INITIALIZE PAGE
// ========================================

loadInitialData();
