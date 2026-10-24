
<div style="display: flex; align-items: center; justify-content: center; gap: 20px; text-align: center;">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" width="100">
  <span style="font-size: 120px; font-weight: bold;">+</span>
  <img src="https://vitejs.dev/logo.svg" alt="Vite" width="100">
  <span style="font-size: 120px; font-weight: bold;">+</span>
  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind CSS" width="100">
</div>


## Get Started Quickly! ✨

Follow these super easy steps to get this project up and running on your local machine:

### Step 1: Clone the Repository 💾

Grab a copy of the project files from GitHub using this command in your terminal:

```
git clone https://github.com/shad-ct/ReactTemplate
```

### Step 2: Dive into the Project Folder 📂
Navigate into the newly created project directory:

```
cd ReactTemplate
```
### Step 3: Install All the Goodies 🛠️
Time to download and install all the necessary packages and dependencies. Run this command:


```
npm install
```
### Step 4: Fire Up the Development Server 🔥
Start the local development server and watch your app come to life!

```
npm run dev
```

## Institutional accounts (Librarian / MMTTC Director)

Admins manage two dedicated, single-module accounts from **Admin → Institutional Accounts**. `librarian` reaches only the
Library module and `mmttc_director` only the MMTTC module (enforced server-side). Details, API, security notes and the
Library/MMTTC specification reference: [`docs/INSTITUTIONAL_ACCOUNTS.md`](docs/INSTITUTIONAL_ACCOUNTS.md).

Tests for this feature: `cd server/tests/phase5-institutional-accounts && node test.js` (needs `npm install` in `server/`).


## Institutional record wizards

Library and MMTTC records are created/edited in full-page wizards (no modal): Library has eight steps (General,
Infrastructure, Collections, Technology, Staffing & Services, Usage & Engagement, Compliance, Finance & Review) covering
sections 0.9.1-0.9.9 of the specification; MMTTC has five (Centre Details, Director, Infrastructure, Impact & Outreach,
Review). Code: `src/pages/institutional/{LibraryWizard,MMTTCWizard,wizardKit}.tsx` and `wizard.css`.

- The existing `/api/library` and `/api/mmttc` contracts and models are unchanged.
- MMTTC courses (0.11.4, any number per record) remain a separate sub-resource managed from the records list. Saving a
  record never sends `courses`, so it cannot overwrite course edits.
- Photo proof for orientation programs is stored as links; file upload is not available for these modules yet.
- Circulation (Library) and staff data (non-teaching staff link) remain manual entry; see `docs/INSTITUTIONAL_ACCOUNTS.md`.
- Behavioural test: `JSDOM_PATH=/path/to/node_modules/jsdom node tests/wizards/run.mjs` (jsdom is not a project dependency).

## NAAC benchmark import

Administrators manage benchmark definitions under **Admin → Benchmark Management**: a searchable catalogue (add / edit / deactivate) plus
import from the NAAC benchmark PDF (review → approve → preview → activate, versioned, audited, with rollback). Analytics → Benchmark then shows the approved definitions with current institutional values, gaps and scores
("Insufficient data" when a value cannot be calculated reliably). See [`docs/BENCHMARK_IMPORT.md`](docs/BENCHMARK_IMPORT.md) for the
workflow, API, scoring rules, the production diagnosis and deployment notes.
