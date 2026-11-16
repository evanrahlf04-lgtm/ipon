# Tally

The app is called Tally (it was Ipon). Only the visible name changed: the repo, the live URL path (`/ipon/`), the `start-ipon.bat` file name and the internal storage keys (`ipon-v6`, `ipon-theme`, `ipon-side`, `ipon-fx:`) keep the old name on purpose, because renaming the keys would drop users' saved theme and offline copy.

Personal budgeting web app for the Philippines (budgets, goals, report, salary/tax estimates). Mobile-first, installable PWA. Live: https://evanrahlf04-lgtm.github.io/ipon/ , repo: github.com/evanrahlf04-lgtm/ipon (branch `master`, pushes auto-deploy via GitHub Pages).

## Commands
- `npm run dev` : dev server at http://localhost:5173 ; add `?demo` to the URL for sample data and no sign-in (dev only, never in the production build)
- `npm run build` : production build + PWA service worker into `dist/`
- `npm run build:single` : one self-contained HTML file in `dist-single/` (no PWA)
- On Windows, `start-ipon.bat` installs Node (winget), writes `.env.local`, installs packages and starts the dev server.

## Stack and layout
Vanilla JS ES modules, Vite, no framework. Pages are built as HTML strings and drawn into `#main`.
- `index.html` shell, SVG icon sprite, sidebar, FAB, `#auth`, `#modal`, `#toast`
- `src/styles.css` all styles (CSS variables for light/dark; mobile rules at the bottom)
- `src/state.js` app data `S` (income, cats, tx, goals, tax), per-user local cache, `calc()`, `save()`; shared mutable values use setters (`setView`, `setCur`, ...)
- `src/session.js` + `src/auth.js` + `src/sync.js` Supabase email/password auth and sync (one row per user)
- `src/render.js` page router, enter/swap animations, count-up, FAB per page
- `src/events.js` all click/input handlers (event delegation on `data-act`, `data-*`)
- `src/modals.js` dialogs (add/edit transaction, category, goal, account sheet)
- `src/jump.js` sticky "jump to section" bar built from `data-sec` / panel headings
- `src/theme.js` light/dark toggle, theme-color meta
- `src/views/` home, budgets, goals, report, tax (the Salary page)
- `src/demo.js` dev-only sample data

## Backend (Supabase)
Project ref `abanaodgwmgrzvdvbpsq`. Table `user_data(user_id, data jsonb, updated_at)` with row-level security so each user reads/writes only their row (`supabase/schema.sql`). Client config comes from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (git-ignored; the anon key is public by design). Never use or commit the service_role key. For the deployed build these are GitHub Actions variables of the same names.

## Product rules worth keeping
- New accounts start empty (starter categories with 0 budgets, no income/transactions/goals).
- The budget has a base, `S.base`: `'amount'` (main choice) or `'salary'`, chosen in `baseModal()` (account menu, the Overview/Budgets income button, or the welcome card). New accounts start on `'amount'`.
  - `'amount'` with `S.start.repeat` false is a running balance: `S.start.amount` on `S.start.date`, then every income tx and paid pay-log entry adds and every expense subtracts (`opening()` in `state.js`). Overview calls it "Your balance" and the base figure "Available".
  - `'amount'` with `S.start.repeat` true is a fixed monthly amount (`S.income`), the old behaviour for manual income.
  - `'salary'` sets `S.tax.link` true so `S.income` follows take-home pay from the Salary page (`syncIncome()` in `views/tax.js`). `S.tax.link` always mirrors `S.base==='salary'`.
  - Always read the month's base through `baseIncome()`; do not use `S.income` directly. Older data is migrated in `norm()`.
- In fixed and salary modes, income logged as a transaction applies to that month only.
- The floating + button adds an expense / category / goal depending on the page; quick actions are hidden on phones.
- Keep motion off for `prefers-reduced-motion`; keep light and dark brand colours identical (lime/mint/pink).
- Design rules (direction: calm, exact, a little warm; signature: tally marks, the logo and `tally()` in `ui.js` for counts like bills paid):
  - Type scale is 12 / 14 / 16 / 20 / 28 / 44 px, weights 400 to 600 only. Negative letter spacing only on 28px and up. The phone bottom-bar labels are 11px.
  - Every amount shows its currency's full decimals (`₱8,000.00`) through `peso()` / `money()`; only chart axis labels (`₱10K`) and statutory limits in prose are abbreviated.
  - Lime marks a selection or the one main action. Section chips (`.jump`) and the avatar stay neutral. Stat-tile dots are neutral except an overdue tile.
  - One easing curve, no overshoot.

## Gotchas
- Cached service worker: after a deploy, fully close/reopen the page to see the new version.
- Mobile browsers' forced dark mode is avoided with `<meta name="color-scheme">`.
- The built-in browser preview does not fire scroll events or smooth-scroll reliably; test those with instant jumps / dispatched events.
- Files use LF in the repo on Windows (git shows CRLF warnings; harmless).
