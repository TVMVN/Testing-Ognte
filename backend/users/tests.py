from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import User
from candidates.models import Candidate
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.tokens import RefreshToken


class AuthFlowTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="candidate@example.com",
            password="SuperSecure123!",
            role="candidate",
            is_active=True
        )
        Candidate.objects.create(
            user=self.user,
            professional_title="Engineer",
            degree="BSc",
            graduation_year=2022,
            phone="09012345678",
            city="Lagos",
            gender="Male",
            languages="English",
            employment_type="Full-time"
        )
        self.client.force_authenticate(user=self.user)

    def test_account_deletion(self):
        refresh = RefreshToken.for_user(self.user)
        payload = {
            "password": "SuperSecure123!",
            "confirm_deletion": True,
            "refresh_token": str(refresh)
        }
        response = self.client.post(reverse("delete_account"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(email="candidate@example.com").exists())

    def test_password_reset_email(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(reverse("password_reset"), {"email": self.user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_password_valid_token(self):
        from users.utils import hash_token
        from django.utils import timezone

        self.client.force_authenticate(user=None)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        self.user.password_reset_token = hash_token(token)
        self.user.password_reset_token_created = timezone.now()
        self.user.save()

        response = self.client.post(
            reverse("password_reset_confirm", kwargs={"uidb64": uid, "token": token}),
            {
                "new_password": "ResetPass123!",
                "confirm_new_password": "ResetPass123!"
            },
            format="json"
        )
        print("Change Password Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("ResetPass123!"))

        

    def test_change_password_authenticated(self):
        payload = {
            "old_password": "SuperSecure123!",
            "new_password": "AnotherSecure456!",
            "confirm_new_password": "AnotherSecure456!"
        }
        response = self.client.post(reverse("password_change"), payload, format="json")
        print("Change Password Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AnotherSecure456!"))
