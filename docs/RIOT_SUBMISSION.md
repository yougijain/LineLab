# Riot developer registration — plan & submission notes

This is the working plan for taking **LineLab TFT Study** (Product B) through
Riot's developer process. **Product A (the Solver) needs none of this** — it
uses no Riot IP or API and can ship independently.

## Product description (to submit verbatim)

> LineLab is an independent educational website with two separate products.
>
> 1. **LineLab Solver** is an original auto-battler decision-theory simulator. It
>    uses no Riot names, assets, icons, game data, combat formulas, champion
>    names, item names, trait names, UI, client access, live game state, or Riot
>    IP. It teaches generic expected-value concepts such as economy, leveling,
>    rolling, item commitment, tempo, and top-4 vs first-place tradeoffs.
> 2. **LineLab TFT Study** is a Teamfight Tactics study companion for static
>    patch learning, comps, flashcards, guides, and post-game review using
>    approved Riot API / static data. It does not automate gameplay, read the
>    live game client, scout opponents, provide dynamic real-time information, or
>    dictate player decisions.

## Questions to ask Riot

1. Can the site use **"LineLab TFT Study"** as a descriptive section name?
2. Can the study section use **TFT static assets** from approved sources (Data Dragon)?
3. Which features require **RSO**?
4. Which features require **production-key approval**?
5. Can we show **aggregate stats** for comps/items/traits?
6. Can we show **self-player match-history** reports?
7. Are **static "recommended comps"** acceptable if they do not adapt to live game state?
8. Are **paid subscriptions / ads** acceptable for the business model?
9. Is the **separation** between the generic Solver and TFT Study acceptable?
10. What **screenshots / user flows** do you want for review?

## What to have ready for a production key

A functioning site (not just a repo): landing page, Solver product page, TFT
Study page, **Terms of Service**, **Privacy Policy**, a **compliance** page,
clear user flows, API-key security, rate limiting, and data deletion/privacy
handling. (These pages already exist in `frontend/app/`.)

## Roadmap

| Phase | Build | Riot access |
| --- | --- | --- |
| **1 — now** | Solver prototype (done) | none |
| **2 — now** | Website + study shell, ToS/privacy/compliance (done) | none |
| **3** | Register; personal/dev key for proof-of-concept, match-history tests | personal key |
| **4** | TFT Study alpha: static comps, patch guides, flashcards, study paths | dev key |
| **5** | Post-game coach: account linking, match import, dashboards, study/solver recommendations | RSO if required |
| **6** | Production launch: working site, ToS/privacy, key security, rate limiting, data deletion | production key |

## Hard "never build" list

Live TFT solver · live board reader · TFT clone simulator · opponent scouting ·
client (LCU) integration · memory reading / automation · any in-game
"buy / roll / level now" prescription that adapts to live game state.

> Policy references: Riot's TFT developer policy (pre-game best practices and
> post-game analysis encouraged; dynamic real-time info, opponent scouting, and
> decision-dictating apps disallowed) and General Policies ("no simulators, no
> recreating our games"; products must not closely resemble Riot games in style
> or function; approved assets like Data Dragon may be used). Confirm current
> wording on the Riot Developer Portal before submitting.
