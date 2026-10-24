# panshulbh16.github.io

My personal site: https://panshulbh16.github.io

## Editing

Everything on the page lives in [`src/data/resume.tsx`](src/data/resume.tsx): profile, experience, skills and projects. To show a photo, add a square image at `public/me.jpg` and set `avatarUrl: "/me.jpg"` in `PROFILE`.

`public/` is copied to the site as-is, which is how `/page-destroyer/` and its privacy policy keep their own static pages.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in out/
npm test         # unit + Playwright tests (run `npm run build` first)
```

Pushing to `main` builds, tests and deploys to GitHub Pages (`.github/workflows/ci-cd.yml`), then smoke-tests the live site.
