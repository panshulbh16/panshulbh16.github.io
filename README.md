# panshulbh16.github.io

My personal site: https://panshulbh16.github.io

## Editing

Everything on the page lives in [`src/data/resume.tsx`](src/data/resume.tsx): profile, hero terminal, about, projects, experience and skills. Every fact there must be true; no invented numbers. To show a photo, add a square image at `public/me.jpg` and set `avatarUrl: "/me.jpg"` in `PROFILE`.

`public/` is copied to the site as-is, which is how `/page-destroyer/` and its privacy policy keep their own static pages.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm test         # unit + Playwright tests (run `npm run build` first)
```

Pushing to `main` builds, tests and deploys to GitHub Pages (`.github/workflows/ci-cd.yml`), then smoke-tests the live site.

## HeyTurbulence

HeyTurbulence (by Roamly) lives at https://heyturbulence.com, published from the `heyturbulence-site` repository; its source is in the private `roamly-heyturbulence` repository.

`public/heyturbulence/index.html` and `public/airmap/index.html` are only redirects to heyturbulence.com, keeping any `?query` or `#section`, so links shared before the move keep working. The app moved off `/airmap/` on 18 November 2026 and off `/heyturbulence/` on 19 November 2026. Flights saved in the browser stay with the address they were saved on, so the `/heyturbulence/` page offers a download of any saved flights before sending the visitor on; Data & privacy → Restore on heyturbulence.com brings them back.
