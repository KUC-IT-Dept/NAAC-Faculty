# KUC Backend Unified API Documentation

The backend has been completely unified. Both student and faculty systems run on the same server, with structured API routes cleanly divided into domains.

All API requests must include the `Bearer <token>` in the Authorization header unless they are marked as **Public**.

---

## 🎓 Student APIs (`/api/student/*`)

| Use Case | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | POST | `/api/student/auth/register` | Register a new student account |
| **Auth** | POST | `/api/student/auth/login` | Login to student account |
| **Auth** | POST | `/api/student/auth/verify-otp` | Verify OTP for password recovery |
| **Auth** | POST | `/api/student/auth/reset-password` | Reset password (requires auth) |
| **Auth** | POST | `/api/student/auth/change-password` | Change password with old/new |
| **Auth** | GET | `/api/student/auth/check-auth` | Verify token validity |
| **Profile** | GET | `/api/student/profile` | Get the logged-in student's full profile |
| **Profile** | POST | `/api/student/profile` | Create or update the student profile (Multipart Form Data) |
| **Directory**| POST | `/api/student/all-students` | Get all student profiles |
| **Directory**| POST | `/api/student/by-department` | Get students filtered by department |
| **Requests** | GET | `/api/student/my-requests` | Get all profile update requests made by the student |
| **Requests** | GET | `/api/student/requests/pending` | Get all pending profile update requests (Admin/Office) |
| **Requests** | GET | `/api/student/my-requests/:id` | Get details of a specific profile update request |
| **Requests** | POST | `/api/student/requests/:id/approve` | Approve a profile update request (Admin/Office) |
| **Requests** | POST | `/api/student/requests/:id/reject` | Reject a profile update request (Admin/Office) |
| **Privilege**| POST | `/api/student/privilege/request-access` | Request edit access from the HOD |
| **Privilege**| POST | `/api/student/privilege/approve-request`| Approve edit access (Professor/Office) |
| **Unlock** | POST | `/api/student/unlock-request/` | Create a new profile unlock/correction request |
| **Unlock** | GET | `/api/student/unlock-request/my` | Get all unlock requests made by the student |
| **Unlock** | GET | `/api/student/unlock-request/pending` | Get all pending unlock requests (Admin/Office) |
| **Unlock** | GET | `/api/student/unlock-request/eligibility` | Check if student is eligible to make a request |
| **Unlock** | GET | `/api/student/unlock-request/:id` | Get specific unlock request details |
| **Unlock** | POST | `/api/student/unlock-request/:id/approve` | Approve unlock request (Admin/Office) |
| **Unlock** | POST | `/api/student/unlock-request/:id/reject` | Reject unlock request (Admin/Office) |
| **File Ops** | POST | `/api/student/file/compress` | Compress an uploaded PDF file (Multipart) |
| **Search** | GET | `/api/student/search/users` | Search for a user by name/email/phone |
| **Search** | GET | `/api/student/search/users/:id` | Get specific student profile by User ID |
| **User** | GET | `/api/student/user/can-edit` | Check if the current user has editing enabled |

---

## 👨‍🏫 Faculty / Admin APIs (`/api/faculty/*`)

| Use Case | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | POST | `/api/faculty/auth/login` | Login for Faculty, HOD, VC, and Admin |
| **Auth** | POST | `/api/faculty/auth/change-password` | Change faculty password |
| **Auth** | GET | `/api/faculty/auth/me` | Get logged-in faculty user details |
| **Profile** | GET | `/api/faculty/me` | Get full faculty profile (academic, experience, etc.) |
| **Profile** | PUT | `/api/faculty/me` | Update faculty profile data |
| **Profile** | PATCH | `/api/faculty/me/visibility` | Update profile field visibility settings |
| **Options** | POST | `/api/faculty/me/requests` | Request a new dropdown option (e.g. new Degree) |
| **Options** | GET | `/api/faculty/me/requests` | Get all option requests made by this faculty |
| **Options** | PATCH | `/api/faculty/me/requests/:id/dismiss` | Dismiss a processed option request |
| **Admin** | GET | `/api/faculty/admin/faculty` | List all faculty users with basic profile data |
| **Admin** | POST | `/api/faculty/admin/faculty` | Create a new faculty account |
| **Admin** | PATCH | `/api/faculty/admin/faculty/:id/status`| Toggle active/inactive status of a faculty member |
| **Admin** | PATCH | `/api/faculty/admin/faculty/:id/make-hod`| Promote a faculty member to HOD of their department |
| **Admin** | DELETE | `/api/faculty/admin/faculty/:id` | Delete a faculty account entirely |
| **Admin** | GET | `/api/faculty/admin/stats` | Get total, active, and complete profile counts |
| **Admin** | GET | `/api/faculty/admin/dropdowns` | Get all configured dropdown options |
| **Admin** | PATCH | `/api/faculty/admin/dropdowns/:key` | Update the options list for a specific dropdown key |
| **Admin** | GET | `/api/faculty/admin/option-requests` | Get all pending dropdown option requests |
| **Admin** | PATCH | `/api/faculty/admin/option-requests/:id/approve` | Approve a dropdown option request |
| **Admin** | PATCH | `/api/faculty/admin/option-requests/:id/reject`| Reject a dropdown option request |
| **Admin** | PATCH | `/api/faculty/admin/option-requests/:id/undo` | Revert an approved/rejected option request |
| **HOD** | GET | `/api/faculty/hod/faculty` | List all faculty within the HOD's department |
| **HOD** | POST | `/api/faculty/hod/faculty` | Create a new faculty account within the HOD's department |
| **HOD** | GET | `/api/faculty/hod/option-requests` | View dropdown option requests from department faculty |
| **HOD** | PATCH | `/api/faculty/hod/option-requests/:id/approve`| Approve a dropdown option request (department scope) |
| **HOD** | PATCH | `/api/faculty/hod/option-requests/:id/reject`| Reject a dropdown option request (department scope) |
| **VC** | GET | `/api/faculty/vc/faculty` | Get all faculty across all departments |
| **VC** | GET | `/api/faculty/vc/hierarchy` | Get tree hierarchy of all departments and their faculty |
| **Depts** | GET | `/api/faculty/departments` | List all departments and their HODs |
| **Depts** | POST | `/api/faculty/departments` | Create a new department and its HOD account |
| **Depts** | GET | `/api/faculty/departments/:name/faculty`| Get all faculty belonging to a specific department |
| **Public** | GET | `/api/faculty/public/sections-config` | **[Public]** Get profile section configurations |
| **Public** | GET | `/api/faculty/public/dropdowns` | **[Public]** Get global dropdown options |
| **Public** | GET | `/api/faculty/public` | **[Public]** Get list of all completed public faculty profiles |
| **Public** | GET | `/api/faculty/public/:username` | **[Public]** Get specific faculty public profile by username |
| **Uploads** | POST | `/api/faculty/upload` | Upload a generic file |
| **Uploads** | POST | `/api/faculty/upload/photo` | Upload an image file |
| **Uploads** | POST | `/api/faculty/upload/profile-picture` | Upload a profile picture |
| **Analytics**| GET | `/api/faculty/analytics/dashboard` | Get high-level analytics dashboard data |
| **Analytics**| GET | `/api/faculty/analytics/profile-completion`| Get completion percentage for all profiles |
| **Analytics**| GET | `/api/faculty/analytics/departments` | Get faculty analytics aggregated by department |
| **Analytics**| GET | `/api/faculty/analytics/student-departments`| Get student metrics aggregated by department |
| **Analytics**| GET | `/api/faculty/analytics/program-levels` | Get data on student program levels |

---

## 🛠 Required Frontend Changes

Because the backend is now fully structured into distinct modules, your frontend must update its API call URLs.

**If you are working on the Student Frontend:**
1. Search your code for `/api/auth/` and replace it with `/api/student/auth/`.
2. Search for `/api/privilege/` and replace with `/api/student/privilege/`.
3. Search for `/api/unlock-request/` and replace with `/api/student/unlock-request/`.
4. Search for `/api/user/can-edit` and replace with `/api/student/user/can-edit`.
5. Search for `/api/file/compress` and replace with `/api/student/file/compress`.
6. Search for `/users` and replace with `/api/student/search/users`.

**If you are working on the Faculty/Admin/HOD Frontend:**
1. All API paths now require `/faculty/` before the feature name.
2. Search for `/api/auth/` and replace with `/api/faculty/auth/`.
3. Search for `/api/admin/` and replace with `/api/faculty/admin/`.
4. Search for `/api/hod/` and replace with `/api/faculty/hod/`.
5. Search for `/api/vc/` and replace with `/api/faculty/vc/`.
6. Search for `/api/departments` and replace with `/api/faculty/departments`.
7. Search for `/api/profile` (public directory calls) and replace with `/api/faculty/public`.
8. Search for `/api/faculty/` and change it to `/api/faculty/me` where it relates to the logged-in profile data (as `/api/faculty` is now the prefix for everything).

Both frontends should point to the exact same backend server port (`5000` or whatever your `process.env.PORT` is set to).
