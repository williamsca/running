# Charlottesville 10-Miler Training

Training system for the [Charlottesville Ten Miler](https://www.charlottesvilletenMiler.com/) on March 27, 2027. Goal: break 1:09.

Uses Claude Code as an adaptive running coach — reviews training logs, adjusts weekly plans, and explains the physiology behind the programming.

## How it works

1. Log runs in `training-log.csv`
2. Run `/coach review` to get feedback and next week's plan
3. Site rebuilds automatically at [GitHub Pages](https://wicolia.github.io/running/)

## Files

- `training-log.csv` — run log (date, distance, duration, type, notes)
- `current-plan.md` — this week's prescribed workouts
- `scripts/build-site.js` — generates the static dashboard
- `docs/index.html` — the site (built artifact)

## Site

Static dashboard showing days to race and the current training plan. Old-school internet aesthetic. No JavaScript. Rebuilds weekly via GitHub Actions.
