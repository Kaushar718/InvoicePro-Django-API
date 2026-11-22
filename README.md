# InvoicePro — Django Invoice & Billing API

**A company-scoped invoice and billing management system built with Python, Django, and Django REST Framework.**

InvoicePro provides authenticated APIs for managing clients, products, invoices, payments, financial reports, and notifications. It also integrates a conversational financial assistant through the Groq API.

The primary engineering focus is backend development: REST API design, authentication, relational data models, company-level access control, financial calculations, and automated tests. The HTML/CSS/JavaScript dashboard is a supporting interface for consuming the APIs.

## Core Features

- **Authentication and authorization:** Custom email-based user model with JWT access and refresh tokens.
- **Company-level access control:** Company owners and authorized employees can access permitted company records.
- **Client management:** Company-scoped client CRUD APIs.
- **Product management:** Product and category management APIs.
- **Invoice management:** Invoice items, invoice numbering, GST calculations, totals, and status tracking.
- **Payment management:** Payment recording, validation, payment history, and invoice balance management.
- **PDF generation:** Downloadable invoice PDFs using `xhtml2pdf`.
- **Financial reporting:** Dashboard metrics and monthly payment summaries.
- **Notifications:** Invoice and payment notifications with read-status updates.
- **AI financial assistant:** English, Hindi, and Hinglish financial queries using the Groq Chat Completions API.
- **API documentation:** OpenAPI schema, Swagger UI, and ReDoc.

## Technology Stack

| Category | Technology |
|---|---|
| Primary language | Python |
| Backend framework | Django |
| REST API framework | Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| AI integration | Groq Chat Completions API |
| PDF generation | xhtml2pdf |
| API documentation | drf-spectacular |
| Supporting interface | Django Templates, HTML, CSS, JavaScript |
| UI libraries | Bootstrap, Chart.js |

## Backend Architecture

```text
InvoicePro-Django-API/
├── accounts/          # Custom user model and authentication
├── companies/         # Company and employee management
├── clients/           # Client management APIs
├── products/          # Product and category APIs
├── invoices/          # Invoice models, calculations, and PDF generation
├── payments/          # Payment records and balance management
├── reports/           # Dashboard, financial reports, and AI assistant
├── notifications/     # Notification services and APIs
├── common/            # Shared utilities and permissions
├── config/            # Django settings and URL configuration
├── templates/         # Supporting dashboard templates
├── static/            # Supporting frontend assets
├── manage.py
├── requirements.txt
└── README.md
```

## Main API Endpoints

The following are principal routes. Company-specific routes require authentication and authorization for the requested company.

| Functionality | Endpoint |
|---|---|
| Authentication | `/api/auth/` |
| Current authenticated user | `/api/auth/me/` |
| Company management | `/api/companies/` |
| Company dashboard | `/api/companies/{company_id}/dashboard/` |
| Monthly revenue | `/api/companies/{company_id}/monthly-revenue/` |
| Invoice management | `/api/companies/{company_id}/invoices/` |
| Financial assistant | `/api/companies/{company_id}/financial-assistant/` |
| OpenAPI schema | `/api/schema/` |
| Swagger UI | `/api/docs/` |
| ReDoc | `/api/redoc/` |

Replace `{company_id}` with a company ID the authenticated user is permitted to access.

## Financial Assistant

The assistant uses company-specific financial context to answer natural-language questions in English, Hindi, and Hinglish through the configured Groq model.

It can help explain:

- Total invoice value and issued invoice value.
- Draft invoice value.
- Payments received and monthly payment trends.
- Outstanding and overdue balances.
- Paid, pending, draft, and overdue invoice information.

**Accounting presentation:** Total invoice value includes all invoice statuses. Draft invoices are shown separately and excluded from issued receivables. Outstanding balances are calculated from issued invoices only. AI-generated explanations are informational and should be checked against the underlying records before business decisions are made.

Relevant company financial context and user questions are sent to the configured Groq API. Do not send sensitive customer data without appropriate authorization and review.

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/Kaushar718/InvoicePro-Django-API.git
cd InvoicePro-Django-API
```

### 2. Create and activate a virtual environment

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```bat
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure environment variables

Create a local `.env` file in the repository root. Use your own local values:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DB_NAME=invoicepro
DB_USER=your-postgres-user
DB_PASSWORD=your-postgres-password
DB_HOST=127.0.0.1
DB_PORT=5432
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=openai/gpt-oss-20b
```

Make sure PostgreSQL is running and the configured database exists. Never commit `.env`, credentials, API keys, local databases, or real customer financial data.

### 5. Apply migrations and run checks

```bash
python manage.py migrate
python manage.py check
python manage.py test
```

### 6. Start the development server

```bash
python manage.py runserver
```

Open `http://127.0.0.1:8000/` in your browser.

## API Documentation

After starting the development server, visit:

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

## Automated Testing

The current local development test suite contains **14 automated tests**, which passed in the development environment.

Run the suite with:

```bash
python manage.py test
```

## Security Considerations

- Keep `.env` and private credentials out of Git.
- Do not commit local databases or real customer financial records.
- Use `DEBUG=False`, HTTPS, secure secret management, and production-grade server settings before deployment.
- Review authentication, company membership, and object-level permissions before production use.
- Apply appropriate authorization and privacy review before sending business data to external AI providers.

## Project Focus

InvoicePro is presented as a **Python and Django backend portfolio project**. Its main technical focus is REST API development, authentication, database design, company-level access control, financial business logic, automated testing, and AI integration. The dashboard is included as a supporting interface that demonstrates how the backend APIs are consumed.

---

**Built with Python, Django, and Django REST Framework.**
