# Product

<!-- impeccable:product-schema 1 -->

> The owner asked not to be interviewed ("don't ask me, you do everything"). Facts below come from the repository, the owner's earlier sites and confirmed chat answers; lines marked *(inferred)* are Claude's reading, not the owner's words.

## Platform

web

## Users

- People who open Panshul's link from LinkedIn, GitHub, a cold email or a résumé: hiring managers and recruiters, prospective consulting or build-studio clients, and other engineers. *(inferred)*
- They give it well under a minute, often on a phone, to decide whether he is credible and worth contacting. *(inferred)*

## Product Purpose

A personal profile site for Panshul Bharadwaj, a technology consultant in Bengaluru who also designs, builds and runs his own software products. It should read as a person, not a product launch page (owner's words: the previous site "looks like a marketing template; I want it to be a profile"). Success: a visitor understands who he is, sees proof that he ships, and emails or messages him.

## Positioning

Two tracks at once: enterprise Oracle Cloud work by day (SoftClouds, then Deloitte USI) and four live products of his own built end to end, with the unglamorous engineering done properly (explainable scores, server-enforced quotas, fail-closed AI budgets, webhook-safe payments).

## Capabilities and Constraints

- Static site on GitHub Pages: Next.js static export, all content in `src/data/resume.tsx`.
- `/page-destroyer/` and `/page-destroyer/privacy/` are standalone static pages that must keep their URLs; the "Smash this page" button and Chrome install link must keep working.
- Light and dark themes; respect reduced motion.

## Evidence on Hand

- Work: Deloitte USI, Technology Consultant, Oracle CX practice, Aug 2025 – present; SoftClouds, Software Engineer, Oct 2021 – May 2025 (owner confirmed).
- Education: MS Ramaiah University of Applied Sciences (degree and years unknown; do not invent).
- Products, all live: Duely (heyduely.com, web + iOS + Android), Roamly (heyroamly.com), Tailor (Railway URL), Opportunity Hunter (opportunityhunter.xyz); plus Page Destroyer, a Chrome extension. Screenshots in `public/assets/img/`.
- No photo of the owner yet; no testimonials, client names, metrics or user counts. Never fabricate any of these.

## Product Principles

1. Person first: who he is and how he works leads; products are evidence, not the headline.
2. Prove, don't claim: real product screenshots and specific engineering details over adjectives.
3. Every fact is true and checkable; no invented numbers.
4. Fast on a phone: quick to read, light to load.

## Accessibility & Inclusion

WCAG AA contrast in both themes, keyboard reachable, reduced-motion respected. *(inferred standard)*
