from django.test import SimpleTestCase
from django.urls import reverse


class FrontendPageTests(SimpleTestCase):
    pages = {
        "dashboard-page": "dashboard",
        "clients-page": "clients",
        "products-page": "products",
        "invoices-page": "invoices",
        "payments-page": "payments",
        "reports-page": "reports",
        "notifications-page": "notifications",
    }

    def test_each_page_renders_all_navigation_links_with_one_active_page(self):
        navigation_urls = {
            "dashboard": reverse("dashboard-page"),
            "clients": reverse("clients-page"),
            "products": reverse("products-page"),
            "invoices": reverse("invoices-page"),
            "payments": reverse("payments-page"),
            "reports": reverse("reports-page"),
            "notifications": reverse("notifications-page"),
        }

        for page_name, active_page in self.pages.items():
            with self.subTest(page=page_name):
                response = self.client.get(reverse(page_name))
                content = response.content.decode()

                self.assertEqual(response.status_code, 200)
                self.assertEqual(content.count('class="nav-link active"'), 1)
                for url in navigation_urls.values():
                    self.assertIn(f'href="{url}"', content)
                self.assertIn('id="logoutButton"', content)
