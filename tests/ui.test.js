// Drives the real page in jsdom: questionnaire flow, plan rendering, restore.
// Run with: npm test

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const results = [];
const assert = (name, condition) => results.push({ name, ok: Boolean(condition) });

function load(seededAnswers) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, "index.html"), "utf8"), {
    runScripts: "dangerously",
    url: "https://example.test/traini/",
  });
  const { window } = dom;
  const errors = [];
  window.addEventListener("error", (event) => errors.push(event.message || String(event.error)));
  window.scrollTo = () => {};

  if (seededAnswers) {
    window.localStorage.setItem("traini.answers.v1", JSON.stringify(seededAnswers));
  }

  // jsdom does not fetch local script files, so the sources are injected here.
  ["data.js", "engine.js", "app.js"].forEach((file) => {
    const script = window.document.createElement("script");
    script.textContent = fs.readFileSync(path.join(root, file), "utf8");
    window.document.body.appendChild(script);
  });

  const doc = window.document;
  return {
    window,
    doc,
    errors,
    visible: (id) => !doc.getElementById(id).classList.contains("hidden"),
    click: (node) => node.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    pick(field, value) {
      const node = doc.querySelector(`.options[data-field="${field}"] .option[data-value="${value}"]`);
      node.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    },
    byId: (id) => doc.getElementById(id),
  };
}

// --- Flow through the questionnaire ---
{
  const app = load();
  assert("intro is the first screen", app.visible("intro") && !app.visible("quiz") && !app.visible("result"));

  app.click(app.byId("start"));
  assert("start opens the questionnaire", app.visible("quiz"));
  assert("first question is labelled", app.byId("step-count").textContent === "Question 1 of 6");
  assert("back is hidden on the first question", !app.visible("back"));

  app.pick("goal", "muscle");
  assert("answering advances the step", app.byId("step-count").textContent === "Question 2 of 6");
  app.click(app.byId("back"));
  assert("back returns one step", app.byId("step-count").textContent === "Question 1 of 6");
  assert("the answer survives going back", app.doc.querySelector('.options[data-field="goal"] .option.selected') !== null);

  app.pick("goal", "strength");
  app.pick("level", "2");
  app.pick("days", "4");
  app.pick("minutes", "60");
  app.pick("equipment", "gym");
  assert("reaches the last question", app.byId("step-count").textContent === "Question 6 of 6");

  app.pick("limits", "shoulder");
  app.pick("limits", "shoulder");
  assert("a limitation can be switched off again", app.doc.querySelector(".multi .option.selected") === null);
  app.pick("limits", "knee");

  app.click(app.byId("build"));
  assert("the plan screen opens", app.visible("result") && !app.visible("quiz"));
  assert("one card per training day", app.doc.querySelectorAll("#days .day-card").length === 4);
  assert("the summary is filled in", app.doc.querySelectorAll("#summary div").length === 6);
  assert("exercises are listed", app.doc.querySelectorAll(".exercise").length >= 20);
  assert("notes appear for a limitation", app.visible("notes-card") && app.doc.querySelectorAll("#notes li").length > 0);
  assert("knee-heavy exercises are left out", !app.byId("days").textContent.includes("Goblet squat"));
  assert("answers are saved", app.window.localStorage.getItem("traini.answers.v1") !== null);

  app.click(app.byId("restart"));
  assert("start over returns to the intro", app.visible("intro"));
  assert("start over clears the saved answers", app.window.localStorage.getItem("traini.answers.v1") === null);
  assert("start over clears the selections", app.doc.querySelectorAll(".option.selected").length === 0);

  app.click(app.byId("start"));
  app.pick("goal", "muscle");
  app.click(app.byId("build"));
  assert("an incomplete form cannot build a plan", !app.visible("result"));
  assert("the user is sent to the first missing answer", app.byId("step-count").textContent === "Question 2 of 6");
  assert("no runtime errors in the flow", app.errors.length === 0);
  if (app.errors.length > 0) console.error(app.errors);
}

// --- Returning visitor ---
{
  const app = load({ goal: "fatloss", level: 1, days: 3, minutes: 45, equipment: "minimal", limits: [] });
  assert("a saved plan is shown again on load", app.visible("result"));
  assert("the saved plan has the right number of days", app.doc.querySelectorAll("#days .day-card").length === 3);
  assert("a fat loss plan has a finisher", app.doc.querySelectorAll(".finisher").length === 3);
  assert("no gym machines on a minimal setup", !app.byId("days").textContent.includes("Lat pulldown"));
  assert("no errors restoring a plan", app.errors.length === 0);
}

// --- Damaged saved data ---
{
  const app = load({ goal: "muscle" });
  assert("incomplete saved answers fall back to the intro", app.visible("intro"));
  assert("damaged saved answers are cleared", app.window.localStorage.getItem("traini.answers.v1") === null);
}

const failed = results.filter((r) => !r.ok);
results.forEach((r) => console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`));
console.log(`\nui: ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) process.exit(1);
