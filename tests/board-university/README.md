# Board / University dropdown tests

Covers Faculty Dashboard -> Edit Profile -> Qualifications -> Board / University.

These tests need dev tooling that is NOT in package.json (kept out so the app's dependencies are unchanged):

    npm ci
    npm i --no-save vitest@2 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
    npx vitest run --config tests/board-university/vitest.config.ts
    npx vitest run --config tests/article-type/vitest.config.ts

`--no-save` leaves package.json and package-lock.json untouched. The folder is outside tsconfig's
`include: ["src"]`, so `npm run build` is unaffected.
