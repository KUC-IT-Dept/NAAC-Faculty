# SearchableSelect tests

Setup (dev tooling is intentionally not in package.json):

    npm ci
    npm i --no-save vitest@2 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
    npx vitest run --config tests/searchable-select/vitest.config.ts

- `searchableSelect.test.tsx` — shared component: persistent "+ Add Other...", typed `+ Add "x"`, trim, empty/duplicate
  rejection, keyboard/focus, saved custom values, `allowAddOther={false}`, HOD-approval (`dropdownKey`) flow.
- `allFields.regression.test.tsx` — opens every SearchableSelect in every Faculty section form, plus a static scan
  that all admin/VC/HOD fixed-list pickers opt out with `allowAddOther={false}`.

jsdom has no layout engine, so "not clipped" is verified structurally (footer is a non-shrinking sibling of the
scrolling list in the same flex column), not by pixel measurement.
