// auth/constants/roles.js
// Single source of truth for all roles in the unified backend system.
// Every module (naac, faculty/ProfCV) MUST import roles from here.
// This prevents role string typos and drift across services.

const ROLES = {
  // ── Student / Academic ─────────────────────────────────────────────────────
  STUDENT: "student",

  // ── Faculty / Teaching ─────────────────────────────────────────────────────
  // "faculty" and "professor" are treated as the same role system-wide.
  // ProfCV previously used "TEACHER"; naac used "professor".
  FACULTY: "faculty",

  // ── Department Head ────────────────────────────────────────────────────────
  HOD: "hod",

  // ── Vice Chancellor ────────────────────────────────────────────────────────
  VC: "vc",

  // ── Quality Assurance Director ─────────────────────────────────────────────
  IQAC_DIRECTOR: "iqac_director",

  // ── Administrative Staff ──────────────────────────────────────────────────
  // "staff" and "office" from naac are consolidated into STAFF.
  STAFF: "staff",

  // ── Super Administrator ────────────────────────────────────────────────────
  // Previously "SUPERADMIN" in ProfCV. Full system access.
  SUPERADMIN: "superadmin",
};

// Convenience array — use when middleware needs to check "any valid role"
const ALL_ROLES = Object.values(ROLES);

// Role groups — use in authorize() middleware for coarse-grained access
const ROLE_GROUPS = {
  ADMIN_ONLY:       [ROLES.SUPERADMIN, ROLES.IQAC_DIRECTOR],
  FACULTY_AND_ABOVE:[ROLES.FACULTY, ROLES.HOD, ROLES.VC, ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN],
  HOD_AND_ABOVE:    [ROLES.HOD, ROLES.VC, ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN],
  ALL_STAFF:        [ROLES.STAFF, ROLES.HOD, ROLES.VC, ROLES.IQAC_DIRECTOR, ROLES.SUPERADMIN],
};

module.exports = { ROLES, ALL_ROLES, ROLE_GROUPS };