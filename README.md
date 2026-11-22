# InvoicePro — Django Invoice & Billing API

**A company-scoped invoice and billing management system built with Python, Django and Django REST Framework.**

InvoicePro is a backend-focused business application designed to manage clients, products, invoices, payments, financial reports and notifications through secure REST APIs.

The project demonstrates practical backend engineering concepts, including custom authentication, company-level access control, relational data models, financial business logic, automated testing and third-party AI integration.

The HTML, CSS and JavaScript dashboard serves as a supporting interface for consuming the backend APIs.

---

## Core Features

- **Authentication & Authorization** — Custom email-based user model with JWT access and refresh tokens.
- **Company-Level Access Control** — Company owners and authorized employees can access their permitted business records.
- **Client Management** — Company-scoped client creation, retrieval, updating and deletion.
- **Product Management** — Product and category management through REST APIs.
- **Invoice Management** — Invoice creation, invoice items, unique invoice numbering, GST calculations and status tracking.
- **Payment Management** — Payment recording, validation, payment history and invoice balance updates.
- **PDF Generation** — Downloadable invoice documents generated using `xhtml2pdf`.
- **Financial Reporting** — Business dashboard metrics and monthly payment summaries.
- **Notifications** — Invoice and payment notifications with read-status management.
- **AI Financial Assistant** — Conversational financial queries in English, Hindi and Hinglish, powered by the Groq API.
- **API Documentation** — Interactive Swagger documentation and ReDoc.

## Technology Stack

| Category | Technology |
|---|---|
| Primary Language | Python |
| Backend Framework | Django |
| REST API Framework | Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| AI Integration | Groq Chat Completions API |
| PDF Generation | xhtml2pdf |
| API Documentation | drf-spectacular |
| Supporting Dashboard | Django Templates, HTML, CSS, JavaScript |
| UI Libraries | Bootstrap, Chart.js |

## Backend Architecture

```text
InvoicePro-Django-API/
│
├── accounts/          # Custom user model and authentication
├── companies/         # Company and employee management
├── clients/           # Client management APIs
├── products/          # Product and category management
├── invoices/          # Invoice models, calculations and PDF generation
├── payments/          # Payment records and balance management
├── reports/           # Dashboard, reports and financial assistant
├── notifications/     # Notification services and APIs
├── common/            # Shared utilities and components
├── config/            # Django settings and URL configuration
│
├── templates/         # Supporting dashboard templates
├── static/            # Supporting frontend assets
│
├── manage.py
├── requirements.txt
├── README.md
└── .gitignore
```

## API Overview

The application exposes authenticated, company-scoped API endpoints.

| Functionality | Endpoint |
|---|---|
| Authentication | `/api/auth/` |
| Current User | `/api/auth/me/` |
| Company Management | `/api/companies/` |
| Dashboard | `/api/companies/{company_id}/dashboard/` |
| Monthly Revenue | `/api/companies/{company_id}/monthly-revenue/` |
| Invoice Management | `/api/companies/{company_id}/invoices/` |
| Financial Assistant | `/api/companies/{company_id}/financial-assistant/` |
| API Schema | `/api/schema/` |
| Swagger UI | `/api/docs/` |
| ReDoc | `/api/redoc/` |

Replace `{company_id}` with the ID of a company the authenticated user is authorized to access.

## Financial Assistant

InvoicePro integrates the Groq Chat Completions API to provide conversational financial assistance based on company-specific financial context.

The assistant can answer questions about:

- Total invoice value and issued invoice value.
- Draft invoice amounts.
- Payments received.
- Outstanding balances.
- Paid, pending and overdue invoices.
- Monthly payment trends.
- Business financial performance.

**Financial calculation rules:**

- Total invoice value includes invoices in all statuses.
- Draft invoice amounts are reported separately.
- Draft invoices are excluded from issued receivables.
- Outstanding balances are calculated using issued invoices only.
- Overdue balances are calculated from the remaining amounts of overdue invoices.

The assistant supports English, Hindi and Hinglish. AI-generated responses are informational and should be verified against the underlying financial records.

Relevant company financial information and user questions are sent to the configured Groq API to generate responses.

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Kaushar718/InvoicePro-Django-API.git
cd InvoicePro-Django-API
```

### 2. Create a Virtual Environment

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

### 3. Install Dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a local `.env` file in the project root directory.

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

Make sure PostgreSQL is running and the configured database exists.

**Security:** Never commit `.env`, API keys, database credentials or real customer financial information to GitHub.

### 5. Apply Migrations and Run Checks

```bash
python manage.py migrate
python manage.py check
python manage.py test
```

### 6. Start the Development Server

```bash
python manage.py runserver
```

Open the application at:

`http://127.0.0.1:8000/`

## API Documentation

Once the development server is running, access:

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **ReDoc:** `http://127.0.0.1:8000/api/redoc/`
- **OpenAPI Schema:** `http://127.0.0.1:8000/api/schema/`

## Automated Testing

The project includes Django automated tests covering selected backend functionality, including:

- Authentication and access control.
- Company-level data isolation.
- Client and company API behavior.
- Payment-related operations.
- Financial assistant validation and company-specific context.

The current local test suite contains **14 automated tests**, which passed in the development environment.

Run the tests using:

```bash
python manage.py test
```

## Security Considerations

- Environment variables are used for private configuration and API credentials.
- `.env`, local databases and virtual environments are excluded through `.gitignore`.
- JWT authentication protects API access.
- Company membership and permissions restrict access to business records.
- Production deployment requires `DEBUG=False`, HTTPS, secure secret management and production-grade server configuration.
- Use appropriate authorization before sending real customer financial information to external AI providers.

## Project Focus

**InvoicePro is primarily a Python and Django backend engineering project.**

Its main technical focus is REST API development, authentication, database design, company-level authorization, financial calculations, automated tests and AI integration.

The dashboard demonstrates how the backend services can be consumed through a practical business interface.

---

**Developed as a backend portfolio project using Python, Django and Django REST Framework.**