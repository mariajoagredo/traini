# Traini

A gym training plan generator. The user answers six questions and gets a
weekly plan with exercises, sets, reps, rest times and progression rules.

Live site: https://mariajoagredo.github.io/traini/

This is a proof of concept. It gives general training information, not medical
advice.

## How it works

Plain HTML, CSS and JavaScript. No framework, no build step, no server. GitHub
Pages publishes the files in `main` as they are.

| File | What it holds |
| --- | --- |
| `index.html` | The six questions and the plan layout |
| `styles.css` | All styling, including a print style for PDF export |
| `data.js` | The exercise library, the weekly splits and the set and rep schemes |
| `engine.js` | Turns the answers into a plan |
| `app.js` | Screen flow and rendering |

### The questions

1. Goal: build muscle, get stronger, lose fat, or general fitness.
2. Experience: new, some, or years of training.
3. Days a week: 2 to 6.
4. Session length: 30, 45, 60 or 75 minutes.
5. Equipment: full gym, or dumbbells and a bench.
6. Joints to go easy on: knees, shoulders, lower back.

### How the plan is built

- **Days a week** picks the split. Two days gives full body, three gives full
  body or push/pull/legs by experience, four gives upper/lower, five and six
  give push/pull/legs variants.
- **Session length and experience** set how many exercises fit in a session.
- **Goal** sets the sets, reps, rest and effort level, and adds a conditioning
  finisher for fat loss and general fitness.
- **Equipment and joint limitations** filter the exercise library. If the
  filters rule out too much, the generator falls back to other movement
  patterns and the plan says so in a note.

The generator is deterministic: the same answers always give the same plan.
Answers are kept in `localStorage`, so a returning visitor sees their plan
again. Nothing is sent anywhere.

## Run it locally

Any static file server works:

```sh
npm run serve   # then open http://localhost:8000
```

## Tests

```sh
npm install   # jsdom, only needed for the tests
npm test
```

- `tests/plan.test.js` builds a plan for all 2880 answer combinations and
  checks the day count, the session size, that no session repeats an exercise,
  and that equipment and joint limitations are always respected.
- `tests/ui.test.js` drives the real page in jsdom: the questionnaire flow,
  the back button, validation, rendering, saving and restoring.

## Not built yet

- Exercise demonstrations or images.
- Logging workouts and tracking weights over time.
- Multi-week progression, deload weeks and plan changes over time.
- Bodyweight, age and sex as inputs.
- Accounts, so a plan follows the user between devices.
