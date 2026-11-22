
let PRODUCT_API = "";
let CATEGORY_API = "";

let products = [];
let categories = [];
let editingProductId = null;

const form = document.getElementById("productForm");
const rows = document.getElementById("productRows");
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

async function loadCategories() {
    categories = await apiRequest(CATEGORY_API);

    const select = document.getElementById("category");

    select.innerHTML =
        '<option value="">No Category</option>';

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

async function loadProducts() {
    try {
        const result = await apiRequest(PRODUCT_API);

        products = Array.isArray(result)
            ? result
            : (result.results || []);

        renderProducts();

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

function renderProducts() {

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const filtered = products.filter(product =>
        [
            product.name,
            product.sku,
            product.description
        ].some(value =>
            String(value ?? "").toLowerCase().includes(search)
        )
    );

    document.getElementById("productCount").textContent =
        `${filtered.length} product(s) found`;

    if (!filtered.length) {
        rows.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    No products found.
                </td>
            </tr>
        `;
        return;
    }

    rows.innerHTML = filtered.map(product => {

        const category = categories.find(
            item => item.id === product.category
        );

        return `
            <tr>
                <td class="product-name">
                    ${escapeHTML(product.name)}
                </td>

                <td>${escapeHTML(product.sku)}</td>

                <td>${escapeHTML(category?.name || "Uncategorized")}</td>

                <td>Rs. ${Number(product.price).toFixed(2)}</td>

                <td>${escapeHTML(product.gst_rate)}%</td>

                <td>${escapeHTML(product.stock_quantity)}</td>

                <td>
                    <span class="product-status ${
                        product.is_active ? "" : "product-inactive"
                    }">
                        ${product.is_active ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>
                    <button class="product-action-btn edit-btn"
                        data-action="edit"
                        data-id="${product.id}">
                        Edit
                    </button>

                    <button class="product-action-btn delete-btn"
                        data-action="delete"
                        data-id="${product.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function getFormData() {
    const categoryValue = document.getElementById("category").value;

    return {
        name: document.getElementById("name").value.trim(),
        sku: document.getElementById("sku").value.trim(),
        category: categoryValue ? Number(categoryValue) : null,
        price: document.getElementById("price").value,
        gst_rate: document.getElementById("gst_rate").value || "0",
        stock_quantity: Number(
            document.getElementById("stock_quantity").value || 0
        ),
        description: document.getElementById("description").value.trim(),
        is_active: document.getElementById("is_active").checked
    };
}

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const payload = getFormData();

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
        if (editingProductId) {

            await apiRequest(`${PRODUCT_API}${editingProductId}/`, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });

            showMessage("Product updated successfully!");

        } else {

            await apiRequest(PRODUCT_API, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            showMessage("Product created successfully!");
        }

        resetForm();
        await loadProducts();

    } catch (error) {
        showMessage(error.message, "danger");

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = editingProductId
            ? "Update Product"
            : "Add Product";
    }
});

function editProduct(id) {

    const product = products.find(item => item.id === id);

    if (!product) return;

    editingProductId = id;

    document.getElementById("name").value = product.name || "";
    document.getElementById("sku").value = product.sku || "";
    document.getElementById("category").value = product.category || "";
    document.getElementById("price").value = product.price || "";
    document.getElementById("gst_rate").value = product.gst_rate || "0";
    document.getElementById("stock_quantity").value =
        product.stock_quantity ?? 0;
    document.getElementById("description").value =
        product.description || "";
    document.getElementById("is_active").checked =
        product.is_active;

    document.getElementById("formTitle").textContent = "Edit Product";

    submitButton.textContent = "Update Product";

    document.getElementById("cancelEdit").classList.remove("d-none");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {

    if (!window.confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        await apiRequest(`${PRODUCT_API}${id}/`, {
            method: "DELETE"
        });

        showMessage("Product deleted successfully!");

        if (editingProductId === id) {
            resetForm();
        }

        await loadProducts();

    } catch (error) {
        showMessage(error.message, "danger");
    }
}

rows.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editProduct(id);
    }

    if (button.dataset.action === "delete") {
        deleteProduct(id);
    }
});

function resetForm() {
    form.reset();

    editingProductId = null;

    document.getElementById("formTitle").textContent = "Add New Product";
    document.getElementById("cancelEdit").classList.add("d-none");
    submitButton.textContent = "Add Product";
    document.getElementById("is_active").checked = true;
}

document.getElementById("cancelEdit")
    .addEventListener("click", resetForm);

document.getElementById("searchInput")
    .addEventListener("input", renderProducts);

async function initializeProductsPage() {
    try {
        const companyId = await InvoiceProAuth.getCompanyId();
        PRODUCT_API = `/api/companies/${companyId}/products/`;
        CATEGORY_API = `/api/companies/${companyId}/categories/`;
        await loadCategories();
        await loadProducts();
    } catch (error) {
        showMessage(error.message, "danger");
    }
}

initializeProductsPage();
