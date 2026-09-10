# Test Harnesses

Standalone verification scripts written during development (Phases 0-4).
No real MongoDB was reachable during development (network policy blocked
the MongoDB binary download), so each harness fakes only the persistence
layer (Mongoose models) while using the REAL, unmodified controller,
route, and middleware files from the main project - copied here so each
harness is self-contained and can be run independently of the rest of the
server.

## Running

From the main `server/` directory:

```
npm install
```

Then, from inside each phase folder:

```
node test.js
```

(Phase 0's two folders use `test_register.js` / `test_duplicate.js` and
`test.mjs` respectively - see below.)

## Contents

- **phase0-registration-security/** — verifies the public registration
  endpoint can't be used to self-assign an elevated role (merged backend).
  Run: `node test_register.js` and `node test_duplicate.js`.
- **phase0-standalone-backend-security/** — same check against the old
  standalone `kuc-backend-main` backend. Run: `node test.mjs`.
- **phase1-student-gaps/** — dropdown/notification/profile-update-request/
  forgot-password-request/record-deletion functional tests (43 checks).
- **phase2-authorization/** — `authorize()` / `authorizeModule()` unit
  tests, including manipulation-resistance checks (17 checks).
- **phase2-followup-dbbacked/** — end-to-end test of the DB-backed
  `authenticate()` middleware, including permission revocation with a
  still-valid JWT (20 checks).
- **phase3-library/** — full Library module functional/security suite
  (26 checks).
- **phase4-mmttc/** — full MMTTC module functional/security suite,
  including course sub-resource CRUD (36 checks).

## A note on realism

These are not a substitute for integration testing against a real
MongoDB instance and the actual deployed frontends - that has not been
done. Recommended before production deployment.
