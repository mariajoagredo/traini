// Checks that every possible set of answers produces a usable plan.
// Run with: npm test

const fs = require("fs");
const path = require("path");

// The site has no build step, so the browser sources are evaluated as they are.
// `const` inside eval stays local to the eval, so the parts used here are
// handed back through globalThis.
const root = path.join(__dirname, "..");
const source =
  fs.readFileSync(path.join(root, "data.js"), "utf8") +
  "\n" +
  fs.readFileSync(path.join(root, "engine.js"), "utf8") +
  "\nObject.assign(globalThis, { EXERCISES, buildPlan, planToText });";
eval(source);

const GOALS = ["muscle", "strength", "fatloss", "general"];
const LEVEL_VALUES = [1, 2, 3];
const DAY_VALUES = [2, 3, 4, 5, 6];
const MINUTE_VALUES = [30, 45, 60, 75];
const EQUIPMENT = ["gym", "minimal"];
const LIMIT_SETS = [[], ["knee"], ["shoulder"], ["back"], ["knee", "shoulder"], ["knee", "shoulder", "back"]];

const problems = [];
let tested = 0;

for (const goal of GOALS)
  for (const level of LEVEL_VALUES)
    for (const days of DAY_VALUES)
      for (const minutes of MINUTE_VALUES)
        for (const equipment of EQUIPMENT)
          for (const limits of LIMIT_SETS) {
            const answers = { goal, level, days, minutes, equipment, limits };
            const label = JSON.stringify(answers);
            let plan;
            try {
              plan = buildPlan(answers);
            } catch (error) {
              problems.push(`${label} threw: ${error.message}`);
              continue;
            }
            tested += 1;

            if (plan.days.length !== days) problems.push(`${label} has ${plan.days.length} days`);

            plan.days.forEach((day) => {
              if (day.exercises.length < 3) {
                problems.push(`${label} ${day.name} has only ${day.exercises.length} exercises`);
              }
              if (!day.weekday) problems.push(`${label} ${day.name} has no weekday`);

              const names = day.exercises.map((ex) => ex.name);
              if (new Set(names).size !== names.length) {
                problems.push(`${label} ${day.name} repeats an exercise`);
              }

              day.exercises.forEach((ex) => {
                if (!ex.name || !ex.reps || !ex.sets || !ex.rest) {
                  problems.push(`${label} ${day.name} has an incomplete exercise`);
                }
              });
            });

            // Limitations must be respected.
            const text = planToText(plan);
            EXERCISES.filter((ex) => ex.avoid.some((joint) => limits.includes(joint))).forEach((ex) => {
              if (text.includes(ex.name)) problems.push(`${label} includes ${ex.name} despite the limitation`);
            });
            // Minimal equipment must not prescribe gym machines.
            if (equipment === "minimal") {
              EXERCISES.filter((ex) => ex.equip === "gym").forEach((ex) => {
                if (text.includes(ex.name)) problems.push(`${label} includes gym-only ${ex.name}`);
              });
            }
          }

// Incomplete answers must be rejected rather than producing a broken plan.
[{}, { goal: "muscle" }, { goal: "x", level: 2, days: 3, minutes: 60, equipment: "gym", limits: [] }].forEach((bad) => {
  try {
    buildPlan(bad);
    problems.push(`accepted incomplete answers: ${JSON.stringify(bad)}`);
  } catch {
    /* expected */
  }
});

console.log(`plan engine: ${tested} answer combinations tested`);
if (problems.length > 0) {
  problems.slice(0, 25).forEach((p) => console.error(" FAIL", p));
  console.error(`${problems.length} problems`);
  process.exit(1);
}
console.log("plan engine: all checks passed");
