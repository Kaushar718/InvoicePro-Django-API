

\# InvoicePro — Django Invoice \& Billing API



InvoicePro is a company-scoped invoice and billing management system built primarily with Python, Django and Django REST Framework.



The project focuses on backend engineering, REST APIs, authentication, database models, company-level access control, financial calculations and automated tests. The HTML/CSS/JavaScript dashboard is a supporting interface.



\## Core Features



\- Custom email-based user authentication.

\- JWT access and refresh tokens.

\- Company and employee-level access control.

\- Client and product management APIs.

\- Invoice management, GST calculations and invoice numbering.

\- Payment recording and invoice balance management.

\- PDF invoice generation using xhtml2pdf.

\- Dashboard metrics and monthly payment reports.

\- Invoice and payment notifications.

\- Conversational financial assistant powered by Groq.

\- Swagger and ReDoc API documentation.



\## Technology Stack



| Category | Technology |

|---|---|

| Primary language | Python |

| Backend | Django |

| API | Django REST Framework |

| Authentication | Simple JWT |

| Database | PostgreSQL |

| AI integration | Groq API |

| PDF generation | xhtml2pdf |

| API documentation | drf-spectacular |

| Supporting interface | Django Templates, HTML, CSS, JavaScript |



\## Backend Architecture



```text

Backend/

├── accounts/

├── companies/

├── clients/

├── products/

├── invoices/

├── payments/

├── reports/

├── notifications/

├── common/

├── config/

├── templates/

├── static/

├── manage.py

└── requirements.txt

```



\## Main API Endpoints



| Feature | Endpoint |

|---|---|

| Authentication | `/api/auth/` |

| Current user | `/api/auth/me/` |

| Companies | `/api/companies/` |

| Dashboard | `/api/companies/{company\_id}/dashboard/` |

| Monthly payments | `/api/companies/{company\_id}/monthly-revenue/` |

| Invoices | `/api/companies/{company\_id}/invoices/` |

| Financial assistant | `/api/companies/{company\_id}/financial-assistant/` |

| API schema | `/api/schema/` |

| Swagger UI | `/api/docs/` |

| ReDoc | `/api/redoc/` |



\## Local Setup



\### 1. Clone the repository



```bash

git clone <your-repository-url>

cd InvoicePro/Backend

```



\### 2. Create a virtual environment



```powershell

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

```



\### 3. Install dependencies



```bash

pip install -r requirements.txt

```



\### 4. Configure environment variables



Create a local `.env` file in the Backend directory.



```env

SECRET\_KEY=your-secret-key

DEBUG=True

DB\_NAME=invoicepro

DB\_USER=your-postgres-user

DB\_PASSWORD=your-postgres-password

DB\_HOST=127.0.0.1

DB\_PORT=5432

GROQ\_API\_KEY=your-groq-api-key

GROQ\_MODEL=openai/gpt-oss-20b

```



Never commit `.env`, database credentials or API keys.



\### 5. Run migrations and checks



```bash

python manage.py migrate

python manage.py check

python manage.py test

```



\### 6. Start the server



```bash

python manage.py runserver

```



Open `http://127.0.0.1:8000/`.



\## Financial Assistant



The AI assistant uses company-specific financial context to answer questions in English, Hindi and Hinglish through the Groq API.



Financial reporting distinguishes total invoice value, draft invoice value, issued invoice value, payments received and outstanding balances excluding draft invoices.



AI responses should be checked against the underlying financial records before business decisions are made. Relevant company data is sent to the configured AI provider.



\## Security



\- Keep `.env` and API credentials out of Git.

\- Never commit local databases or real customer financial records.

\- Use `DEBUG=False`, HTTPS and secure production settings before deployment.

\- Review authentication and company-level permissions before production use.

\- Use demo data for public demonstrations.



\## Testing



Run the complete Django test suite:



```bash

python manage.py test

```



\## Project Focus



InvoicePro is a Python and Django backend portfolio project. Its dashboard demonstrates API consumption, while the primary engineering focus is backend development, database design, authentication, access control and financial business logic.



