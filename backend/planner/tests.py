import json

from django.test import Client, TestCase


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_register_creates_session(self):
        # Registration is expected to create both the user record and an authenticated session
        # because the React client relies on cookie-based access for subsequent API calls.
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "email": "alice@example.com",
                    "password": "StrongPass123",
                    "confirm_password": "StrongPass123",
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["user"]["email"], "alice@example.com")

        session_response = self.client.get("/api/auth/session/")
        self.assertEqual(session_response.status_code, 200)


class PlansApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "email": "bob@example.com",
                    "password": "StrongPass123",
                    "confirm_password": "StrongPass123",
                }
            ),
            content_type="application/json",
        )

    def test_plans_requires_auth(self):
        # Access-control behaviour is part of the coursework's authentication requirement,
        # so this test asserts that protected data is not exposed anonymously.
        logged_out = Client()
        response = logged_out.get("/api/plans/")
        self.assertEqual(response.status_code, 401)

    def test_create_and_list_plan(self):
        create_response = self.client.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "title": "Internet Technology",
                    "start_date": "2026-03-11",
                    "end_date": "2026-05-01",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get("/api/plans/")
        self.assertEqual(list_response.status_code, 200)
        payload = list_response.json()
        self.assertEqual(len(payload["plans"]), 1)
        self.assertEqual(payload["plans"][0]["title"], "Internet Technology")

    def test_update_task(self):
        plan_response = self.client.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "title": "Internet Technology",
                    "start_date": "2026-03-11",
                    "end_date": "2026-05-01",
                }
            ),
            content_type="application/json",
        )
        plan_id = plan_response.json()["plan_id"]

        task_response = self.client.post(
            "/api/tasks/",
            data=json.dumps(
                {
                    "plan_id": plan_id,
                    "title": "Build backend auth",
                    "deadline_date": "2026-03-20",
                    "estimated_effort_hours": 3,
                }
            ),
            content_type="application/json",
        )
        task_id = task_response.json()["task_id"]

        update_response = self.client.put(
            f"/api/tasks/{task_id}/",
            data=json.dumps({"status": "in_progress", "due_date": "2026-03-21"}),
            content_type="application/json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["status"], "in_progress")
        self.assertEqual(update_response.json()["due_date"], "2026-03-21")

    def test_update_plan_title(self):
        plan_response = self.client.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "title": "Old title",
                    "start_date": "2026-03-11",
                    "end_date": "2026-05-01",
                }
            ),
            content_type="application/json",
        )
        plan_id = plan_response.json()["plan_id"]

        update_response = self.client.put(
            f"/api/plans/{plan_id}/",
            data=json.dumps({"title": "New title"}),
            content_type="application/json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()["title"], "New title")

    def test_dashboard_shape(self):
        plan_response = self.client.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "title": "Dashboard Plan",
                    "start_date": "2026-03-11",
                    "end_date": "2026-05-01",
                }
            ),
            content_type="application/json",
        )
        plan_id = plan_response.json()["plan_id"]

        self.client.post(
            "/api/tasks/",
            data=json.dumps(
                {
                    "plan_id": plan_id,
                    "title": "Task A",
                    "deadline_date": "2026-03-11",
                    "estimated_effort_hours": 2,
                    "status": "completed",
                }
            ),
            content_type="application/json",
        )

        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("progress_overview", payload)
        self.assertIn("todays_tasks", payload)
        self.assertIn("upcoming_deadlines", payload)


class ScheduleAndProgressApiTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "email": "owner@example.com",
                    "password": "StrongPass123",
                    "confirm_password": "StrongPass123",
                }
            ),
            content_type="application/json",
        )

        plan_response = self.client.post(
            "/api/plans/",
            data=json.dumps(
                {
                    "title": "Main plan",
                    "start_date": "2026-03-11",
                    "end_date": "2026-05-01",
                }
            ),
            content_type="application/json",
        )
        plan_id = plan_response.json()["plan_id"]

        task_response = self.client.post(
            "/api/tasks/",
            data=json.dumps(
                {
                    "plan_id": plan_id,
                    "title": "Main task",
                    "deadline_date": "2026-03-20",
                    "estimated_effort_hours": 4,
                }
            ),
            content_type="application/json",
        )
        self.task_id = task_response.json()["task_id"]

    def test_create_and_update_schedule_entry(self):
        baseline_entries = self.client.get(f"/api/tasks/{self.task_id}/schedule-entries/").json()["schedule_entries"]

        create_response = self.client.post(
            f"/api/tasks/{self.task_id}/schedule-entries/",
            data=json.dumps(
                {
                    "scheduled_date": "2026-03-12",
                    "planned_effort_hours": 2.5,
                    "is_rescheduled": False,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_response.status_code, 201)
        entry_id = create_response.json()["entry_id"]

        list_response = self.client.get(f"/api/tasks/{self.task_id}/schedule-entries/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()["schedule_entries"]), len(baseline_entries) + 1)

        update_response = self.client.put(
            f"/api/schedule-entries/{entry_id}/",
            data=json.dumps({"is_rescheduled": True}),
            content_type="application/json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertTrue(update_response.json()["is_rescheduled"])

    def test_create_and_update_progress_log(self):
        entry_response = self.client.post(
            f"/api/tasks/{self.task_id}/schedule-entries/",
            data=json.dumps(
                {
                    "scheduled_date": "2026-03-13",
                    "planned_effort_hours": 1.5,
                }
            ),
            content_type="application/json",
        )
        entry_id = entry_response.json()["entry_id"]

        create_log_response = self.client.post(
            f"/api/schedule-entries/{entry_id}/progress-logs/",
            data=json.dumps(
                {
                    "actual_effort_hours": 1.25,
                    "completed_flag": True,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(create_log_response.status_code, 201)
        log_id = create_log_response.json()["progress_id"]

        update_log_response = self.client.put(
            f"/api/progress-logs/{log_id}/",
            data=json.dumps({"completed_flag": False}),
            content_type="application/json",
        )
        self.assertEqual(update_log_response.status_code, 200)
        self.assertFalse(update_log_response.json()["completed_flag"])

    def test_cannot_access_other_users_schedule_entry(self):
        entry_response = self.client.post(
            f"/api/tasks/{self.task_id}/schedule-entries/",
            data=json.dumps(
                {
                    "scheduled_date": "2026-03-14",
                    "planned_effort_hours": 2,
                }
            ),
            content_type="application/json",
        )
        entry_id = entry_response.json()["entry_id"]

        other_client = Client()
        other_client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "email": "other@example.com",
                    "password": "StrongPass123",
                    "confirm_password": "StrongPass123",
                }
            ),
            content_type="application/json",
        )
        forbidden_response = other_client.get(f"/api/schedule-entries/{entry_id}/")
        self.assertEqual(forbidden_response.status_code, 404)
