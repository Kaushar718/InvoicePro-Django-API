
const COMPANY_ID = 8;
const API_BASE = `/api/companies/${COMPANY_ID}`;

const notificationsList = document.getElementById("notificationsList");
const messageBox = document.getElementById("messageBox");

let notifications = [];

function formatDate(dateValue) {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function getArray(data) {
    if (Array.isArray(data)) return data;
    throw new Error("Unexpected API response: expected an array.");
}

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
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

async function apiRequest(url, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
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

function getNotificationType(notification) {
    return notification.notification_type;
}

function getIcon(notification) {
    const type = getNotificationType(notification);

    if (type.includes("PAYMENT")) return "💳";
    if (type.includes("INVOICE")) return "📄";

    return "🔔";
}

function getTitle(notification) {
    return notification.title;
}

function renderSummary() {
    const total = notifications.length;
    const unread = notifications.filter(
        item => !item.is_read
    ).length;

    document.getElementById("totalNotifications").textContent = total;
    document.getElementById("unreadNotifications").textContent = unread;
    document.getElementById("readNotifications").textContent = total - unread;
}

function renderNotifications() {
    const filter = document.getElementById("notificationFilter").value;

    let filtered = [...notifications];

    if (filter === "unread") {
        filtered = filtered.filter(item => !item.is_read);
    } else if (filter === "read") {
        filtered = filtered.filter(item => item.is_read);
    }

    notificationsList.innerHTML = "";

    if (!filtered.length) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                No notifications found.
            </div>
        `;
        return;
    }

    filtered.forEach(notification => {
        const item = document.createElement("article");

        item.className = notification.is_read
            ? "notification-item"
            : "notification-item unread";

        const icon = document.createElement("div");
        icon.className = "notification-icon";
        icon.textContent = getIcon(notification);

        const content = document.createElement("div");
        content.className = "notification-content";

        const title = document.createElement("h3");
        title.textContent = getTitle(notification);

        const description = document.createElement("p");
        description.textContent =
            notification.message || "You have a new update.";

        const meta = document.createElement("div");
        meta.className = "notification-meta";

        const invoiceInfo = notification.invoice_number
            ? `Invoice: ${notification.invoice_number} · `
            : "";

        meta.textContent =
            `${invoiceInfo}${formatDate(notification.created_at)}`;

        content.append(title, description, meta);

        const actions = document.createElement("div");
        actions.className = "notification-actions";

        if (!notification.is_read) {
            const unreadBadge = document.createElement("span");
            unreadBadge.className = "unread-label";
            unreadBadge.textContent = "UNREAD";

            const readButton = document.createElement("button");
            readButton.className = "read-btn";
            readButton.textContent = "Mark as Read";

            readButton.addEventListener("click", () => {
                markAsRead(notification.id, readButton);
            });

            actions.append(unreadBadge, readButton);
        } else {
            const readBadge = document.createElement("span");
            readBadge.className = "unread-label";
            readBadge.textContent = "READ";

            actions.append(readBadge);
        }

        item.append(icon, content, actions);
        notificationsList.appendChild(item);
    });
}

async function loadNotifications() {
    notificationsList.innerHTML = `
        <div class="empty-state">Loading notifications...</div>
    `;

    try {
        const data = await apiRequest(
            `${API_BASE}/notifications/`
        );

        notifications = getArray(data);
        if (notifications.some(notification =>
            !notification ||
            notification.id === null ||
            notification.id === undefined ||
            !Number.isFinite(Number(notification.id)) ||
            typeof notification.notification_type !== "string" ||
            typeof notification.title !== "string" ||
            typeof notification.message !== "string" ||
            typeof notification.is_read !== "boolean" ||
            typeof notification.created_at !== "string" ||
            (
                notification.invoice_number !== null &&
                typeof notification.invoice_number !== "string"
            )
        )) {
            throw new Error("Unexpected notification response.");
        }

        renderSummary();
        renderNotifications();

    } catch (error) {
        notificationsList.innerHTML = `
            <div class="empty-state">Unable to load notifications.</div>
        `;

        showMessage(error.message, "error");
    }
}

async function markAsRead(notificationId, button) {
    button.disabled = true;
    button.textContent = "Updating...";

    try {
        await apiRequest(
            `${API_BASE}/notifications/${notificationId}/read/`,
            {
                method: "PATCH"
            }
        );

        const notification = notifications.find(
            item => Number(item.id) === Number(notificationId)
        );

        if (notification) {
            notification.is_read = true;
        }

        renderSummary();
        renderNotifications();

        showMessage("Notification marked as read.", "success");

    } catch (error) {
        button.disabled = false;
        button.textContent = "Mark as Read";

        showMessage(error.message, "error");
    }
}

document.getElementById("refreshBtn").addEventListener(
    "click",
    loadNotifications
);

document.getElementById("notificationFilter").addEventListener(
    "change",
    renderNotifications
);

loadNotifications();
