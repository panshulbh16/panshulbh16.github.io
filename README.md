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

`public/heyturbulence/` is the built copy of HeyTurbulence (by Roamly), served at `/heyturbulence/`. Its source lives in the private `airprint-prototype` repository. To update it, run `npm run build:portfolio` there (it needs that repository's `.env.local` settings and stops without them) and replace the contents of `public/heyturbulence/` with that `dist/` folder, then push; the smoke test checks that the page loads and is linked from its card.

`public/airmap/index.html` is only a redirect: the app lived at `/airmap/` until 18 November 2026, and links shared before then should keep opening it.
