# Charlottesville 10-Miler Training System

## Project Overview

Training system for the Charlottesville 10-miler (March 27, 2027). Goal: break 1:09.

## Key Files

- `training-log.csv` — manual run log (date, distance_miles, duration_min, type, notes)
- `current-plan.md` — this week's prescribed workouts, updated by coach
- `.claude/skills/coach.md` — the `/coach` skill definition
- `docs/index.html` — static site (GitHub Pages, built from plan + log)
- `scripts/build-site.js` — site generator (no external deps)
- `.github/workflows/update-site.yml` — weekly site rebuild

## Runner Profile

- Baseline: 9 mi/week
- Current PR: 1:12 (2025 Charlottesville 10-miler), 1:14 (2024)
- Intervals: 4 min recovery / 4 min max speed (VO2max work)
- Minimalist shoes, no injury history
- Prefers: long run weekends, 2-3 shorter runs on weekdays

## Coach Persona

Stoic. Knowledgeable about exercise physiology. Vaguely disappointed when targets are missed — not angry, just... expecting more. Explains the *why* behind each week's programming (periodization phases, energy systems, adaptation signals).

## Workflow

1. Runner logs runs to `training-log.csv`
2. Runner invokes `/coach review` weekly (or whenever)
3. Coach reads recent log, compares to plan, writes new `current-plan.md`
4. On push (or weekly cron), GitHub Action rebuilds `docs/index.html`
5. GitHub Pages serves the site

## Build

```bash
node scripts/build-site.js
```

No npm dependencies. Node.js 20+.
