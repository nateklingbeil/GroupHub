# Iron Ledger — OSRS Ironman Group Tracker

A small, static web app for Old School RuneScape Ironman groups. It shows each
member's total XP, XP gained over a period, and boss kill counts, plus the
group's combined total kills per boss — all pulled live from
[Wise Old Man](https://wiseoldman.net). No backend, no accounts, no install:
just a webpage.

## Features

- **Dashboard** — group-wide stats, top XP gainers, top boss killers, and the
  bosses your group kills most.
- **Members** — sortable table of every member's total XP, XP gained
  (day/week/month/year), and total boss kills. Click a row to expand their
  full per-boss kill list.
- **Bosses** — the group's combined kill count for every boss, with the top
  hunter for each.
- **RuneLite integration** — step-by-step setup for the Wise Old Man RuneLite
  plugin, so everyone's stats stay synced automatically while you play.

## Quick start

1. **Get a Wise Old Man Group ID.**
   Go to [wiseoldman.net](https://wiseoldman.net) → *Groups* → *Create group*,
   and add each Ironman's exact in-game name. If the group already exists,
   open it and copy the number at the end of the URL:
   `wiseoldman.net/groups/12345` → Group ID is `12345`.

2. **Install the RuneLite plugin** (recommended, one-time per player).
   In RuneLite: wrench icon → **Plugin Hub** → search **"Wise Old Man"** →
   **Install**. Turn on *"Update on login"* in its settings so your XP and
   boss kills sync automatically every time you play. Full details are in
   the app's **Help & Setup** tab.

3. **Host it somewhere your group can reach.** No build step needed — it's
   plain HTML/CSS/JS. Pick one:

   - **Netlify (recommended)** — free, and gives you a clean URL like
     `iron-ledger.netlify.app` instead of one buried in your GitHub username.
     Go to [app.netlify.com](https://app.netlify.com) → **Add new site** →
     **Import an existing project** → connect GitHub → pick this repo.
     Leave the build command blank and the publish directory as `.` (root),
     then deploy. Once it's live, go to **Site configuration → Change site
     name** to pick your own subdomain. Every push to `main` redeploys it
     automatically.
   - **GitHub Pages** — also free: push this repo to GitHub, then enable
     Pages (Settings → Pages → deploy from the `main` branch). The URL will
     look like `<your-username>.github.io/<repo-name>`.
   - **Local testing:** serve the folder with any static file server, e.g.
     ```bash
     cd iron-ledger
     python3 -m http.server 8000
     ```
     then open <http://localhost:8000> in your browser.

   > Opening `index.html` directly by double-clicking usually works too,
   > but a local server (or real hosting) avoids any browser quirks with
   > cross-origin requests, so it's the safer option.

4. **Enter your Group ID** in the app and click **Load Group**. That's it —
   every member's XP, XP gained, and boss kills load straight from Wise Old
   Man.

5. Use **⟳ Refresh** any time to re-pull the latest data, and the
   "XP gained over" dropdown to switch between day/week/month/year.

## How the data works

This app is read-only against the public Wise Old Man API — it fetches your
group's data on demand and never writes anything (except the optional
"Sync All Members" button in **Help & Setup**, which just asks Wise Old Man
to refresh everyone, using your group's verification code). Nothing is
uploaded anywhere else; all settings (Group ID, period, optional API key)
are saved only in your browser's local storage.

Boss and skill lists aren't hard-coded — the app reads whatever keys Wise
Old Man returns for each player, so new bosses WOM adds later will still
show up automatically.

## Advanced settings (optional)

Found in the **Help & Setup** tab:

- **WOM API key** — raises the public API rate limit if you have one.
- **Group verification code** — the private code Wise Old Man gave you when
  you created the group. Only needed for the **Sync All Members Now**
  button, which queues a fresh update for every member at once.

Both are stored only in your browser and sent only to Wise Old Man's API.

## Project structure

```
index.html          Page layout & the Help/Setup instructions
css/styles.css       All styling
js/api.js            Wise Old Man API client (fetch + rate-limit friendly)
js/state.js          Local settings persistence + in-memory cache
js/aggregate.js       Turns raw API responses into member rows & boss totals
js/names.js           Boss/skill display-name lookup
js/format.js          Number/date formatting helpers
js/render.js          DOM rendering for each tab
js/main.js            Wires everything together (events, state, data flow)
```
