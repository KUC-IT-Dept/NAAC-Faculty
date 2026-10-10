# Academic Responsibilities tests

    npx vitest run --config tests/academic-responsibilities/vitest.config.ts
    (cd server && npm ci) && node tests/academic-responsibilities/schema.check.cjs

- `academicResponsibilities.test.tsx` — field order, single Academic Year / Semester, save + reopen (JSON round trip),
  legacy range records, edit/delete index safety, helper unit tests.
- `schema.check.cjs` — real Mongoose check (no DB) that new + legacy fields survive on both Faculty models.
