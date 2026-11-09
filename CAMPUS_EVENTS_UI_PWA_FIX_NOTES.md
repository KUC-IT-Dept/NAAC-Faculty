# Campus Events UI and PWA fixes

## What changed
- Enabled the Tailwind CSS v4 Vite plugin and stylesheet import. The Campus Events screens use Tailwind utility classes; without this setup, the browser rendered their controls as unstyled defaults.
- Reworked the HOD Campus Events landing view with a responsive header, primary booking action, navigation cards, and styled tabs.
- Reworked the faculty events landing view with an app-style header, online/offline status, summary counts, empty state, and install guidance / install prompt when supported by the browser.
- Renamed the faculty sidebar entry to **Campus Events App** so faculty can find the experience.
- Added a static manifest link to the document head and a Devagiri Campus Events manifest with valid 192px and 512px PNG icons.
- Updated the service worker to cache only static app-shell resources. Authenticated API responses and uploaded evidence are intentionally not cached.

## Local testing
1. Extract the changed-files ZIP into the project root, preserving folder structure and allowing files to merge/overwrite.
2. From the project root run `npm ci`, then `npm run dev`.
3. Sign in with a faculty account and open `/faculty/events`. The sidebar should show **Campus Events App**.
4. In Chrome/Edge on localhost, check the browser install icon/menu. The app's own install button appears only when the browser fires `beforeinstallprompt`.
5. Open `/hod/events` using an HOD account to view the redesigned dashboard.

## Production PWA requirements
- PWA installation on deployed sites requires HTTPS.
- The service worker registers when a user opens the Campus Events faculty route.
- The installable app opens at `/faculty/events`; authentication is still required.
- Offline caching is limited to the static shell. Private API data and evidence are not cached.

## Verification limitation
A dependency installation was attempted in the build environment but timed out. Therefore a production build and browser installability test could not be completed here. Run `npm ci` and `npm run build` locally before deploying.
