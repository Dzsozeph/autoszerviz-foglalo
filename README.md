# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. Your app id is in the Builder URL (`app.base44.com/apps/<id>/...`); `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (`[base44] Proxy not enabled`, every `/api` call fails), and alongside `base44 dev` the second Vite silently takes the next port and you end up looking at the wrong one.
- **The app must be published at least once for the UI to load under `base44 dev`.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Everything else (Core integrations, OAuth login) is forwarded to your deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

## Frontend Only, Hosted Backend

To work on just the frontend against your app's live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data** — plain `base44 dev` keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

## Google Reviews

The homepage loads current rating and review data from Google Places API (New). Enable Places API (New) and billing in Google Cloud, restrict the API key to Places API, set an appropriate usage quota, then add `GOOGLE_PLACES_API_KEY` as a server-side secret for the Base44 function. Do not add the key to frontend environment variables or commit it. The Google Maps listing URL can be changed in Admin → Cégadatok.

For testing only, set the server-side `GOOGLE_REVIEWS_MOCK` secret to `true`. The function then returns five clearly labeled, fabricated reviews and does not read `GOOGLE_PLACES_API_KEY` or call Google. Before production, disable the mock by deleting the `GOOGLE_REVIEWS_MOCK` secret or setting it to `false`; configure `GOOGLE_PLACES_API_KEY` for live reviews. Mock reviews are marked in the UI and must not be presented as real customer feedback.

## Számlázási modul (mock alapértelmezetten)

A projektben a számlázási logika alapja a `src/lib/invoice.js` modul. Az alapértelmezett szolgáltató a mock provider, így a fejlesztés és a tesztfutások nem igényelnek valódi Számlázz.hu fiókot.

- A számlázás admin foglalásrészletéből indítható; az ügyfél, címzett e-mail, szolgáltatás, összeg és megjegyzés mezők szerkeszthetők.
- A Base44 beépített `SendEmail` integrációja a számlát HTML és szöveges tartalommal küldi. Az admin felület a sikeres, már korábban elküldött és sikertelen küldést külön jelzi; sikertelen számlánál az újrapróbálás ugyanazt a rekordot használja.
- A bejelentkezett ügyfél profiljának Számlák panelje kizárólag az aktuális fiók e-mail-címéhez tartozó számlákat listázza.
- A Base44 korlátozza a nem regisztrált címzetteknek küldött leveleket: ehhez fizetős csomag és ellenőrzött saját domain szükséges. A küldési hibák az admin felületen és az alkalmazásnaplókban ellenőrizhetők.
- a számlaösszeg számítása bruttó alapján történik, 2 tizedesnyi kerekítéssel,
- a 27%-os ÁFA-s példa pontosan a következő eredményt adja: nettó `37 401,57 Ft`, ÁFA `10 098,43 Ft`, bruttó `47 500 Ft`,
- a mock provider címkézi a dokumentumot `TESZT SZÁMLA – NEM HIVATALOS DOKUMENTUM` felirattal,
- a provider factory támogatja a `mock` és a `szamlazz` választási lehetőséget,
- a szolgáltatói hibakezelés és az állapotátmenetek a modulhoz kapcsolódnak.

A teljes működés ellenőrzéséhez futtasd a projektben a következőket:

```bash
npm install
npm test
npm run lint
```

A tesztkörnyezet a `vitest` keretrendszerre épül. A valódi Számlázz.hu bekötéshez a produkcióban a `szamlazz` providerre kell váltani, és az API kulcsot szerveroldalon kell titkosítani.

## Docs & Support

GitHub integration: [https://docs.base44.com/developers/app-code/local-development/github](https://docs.base44.com/developers/app-code/local-development/github)

Local development: [https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)

Support: [https://app.base44.com/support](https://app.base44.com/support)
