HOD ACCOUNT ARCHITECTURE FIX

This patch implements the agreed model:
- A faculty member keeps their own role=faculty login and Faculty profile.
- The HOD receives a separate User account with role=hod and a different email/login.
- HOD accounts do not require or receive a Faculty profile.
- Department.hod is the authoritative link to the HOD User account.
- HOD department resolution in the HOD and Campus Events routes uses Department.hod, then User.department.
- HOD login and /me return faculty=null rather than requiring a Faculty profile.
- Removing a HOD account no longer deletes a Faculty profile.
- unified_seed.js no longer creates Faculty profiles for seeded HOD accounts and stores the department on the HOD User.

ADMIN ENDPOINT
PATCH /api/faculty/admin/faculty/:id/make-hod
JSON body:
{
  "hodEmail": "hod.department@college.edu",
  "hodFullName": "Dr. Example"
}

The hodEmail must be a separate email address not already used by another account, and must differ from the faculty account email. The endpoint creates the separate HOD account and links it to the faculty member's department. In non-production mode, the generated initial password is returned as initialPassword. In production, deliver credentials securely; the API intentionally does not return the plaintext password.

IMPORTANT
- ZIP contains only changed project files. Extract it into the repository root, preserving folder paths, and allow overwrite.
- Do not run unified_seed.js against a populated production database just to apply this code change. It is an initial/demo seeder and is not a safe migration script.
- Existing HOD records that currently have a Faculty profile are not automatically migrated or deleted. This patch supports the Department.hod and User.department assignment without depending on those profiles.
- Node syntax checks passed for all changed JavaScript files. The HOD lifecycle test could not be executed in this environment because server dependencies (mongoose/node_modules) are not installed in the extracted archive.
