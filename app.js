// Screen flow, answer collection and rendering.

const STORAGE_KEY = "traini.answers.v1";
const STEPS = 6;

const answers = { goal: null, level: null, days: null, minutes: null, equipment: null, limits: [] };
let step = 0;

const el = (id) => document.getElementById(id);
const screens = { intro: el("intro"), quiz: el("quiz"), result: el("result") };
const questions = Array.from(document.querySelectorAll(".question"));

function show(name) {
  Object.entries(screens).forEach(([key, node]) => node.classList.toggle("hidden", key !== name));
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderStep() {
  questions.forEach((q) => q.classList.toggle("hidden", Number(q.dataset.step) !== step));
  el("progress-bar").style.width = `${((step + 1) / STEPS) * 100}%`;
  el("step-count").textContent = `Question ${step + 1} of ${STEPS}`;
  el("back").classList.toggle("hidden", step === 0);
}

function markSelected(container, value, multi) {
  container.querySelectorAll(".option").forEach((btn) => {
    const match = multi
      ? answers.limits.includes(btn.dataset.value)
      : btn.dataset.value === String(value);
    btn.classList.toggle("selected", match);
  });
}

// Option clicks
document.querySelectorAll(".options").forEach((container) => {
  const field = container.dataset.field;
  const multi = container.classList.contains("multi");

  container.addEventListener("click", (event) => {
    const button = event.target.closest(".option");
    if (!button) return;
    const value = button.dataset.value;

    if (multi) {
      const i = answers.limits.indexOf(value);
      if (i === -1) answers.limits.push(value);
      else answers.limits.splice(i, 1);
      markSelected(container, null, true);
      return;
    }

    answers[field] = field === "goal" || field === "equipment" ? value : Number(value);
    markSelected(container, value, false);

    if (step < STEPS - 1) {
      step += 1;
      renderStep();
    }
  });
});

el("start").addEventListener("click", () => {
  show("quiz");
  step = 0;
  renderStep();
});

el("back").addEventListener("click", () => {
  if (step === 0) return;
  step -= 1;
  renderStep();
});

const REQUIRED = ["goal", "level", "days", "minutes", "equipment"];

el("build").addEventListener("click", () => {
  const missing = REQUIRED.filter((key) => !answers[key]);
  if (missing.length > 0) {
    step = REQUIRED.indexOf(missing[0]);
    renderStep();
    toast("Please answer this one first");
    return;
  }
  store(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)));
  renderPlan(buildPlan(answers));
  show("result");
});

el("restart").addEventListener("click", () => {
  store(() => localStorage.removeItem(STORAGE_KEY));
  Object.assign(answers, { goal: null, level: null, days: null, minutes: null, equipment: null, limits: [] });
  document.querySelectorAll(".option.selected").forEach((b) => b.classList.remove("selected"));
  step = 0;
  renderStep();
  show("intro");
});

el("print").addEventListener("click", () => window.print());

el("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(planToText(currentPlan));
    toast("Plan copied");
  } catch {
    toast("Copy failed, use print instead");
  }
});

let currentPlan = null;

function renderPlan(plan) {
  currentPlan = plan;

  el("summary").innerHTML = [
    ["Goal", plan.goal],
    ["Split", plan.splitLabel],
    ["Schedule", `${plan.daysPerWeek} days, ~${plan.minutes} min`],
    ["Equipment", plan.equipment],
    ["Experience", plan.level],
    ["Weekly sets", String(plan.totalSets)],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
    .join("");

  el("warmup").innerHTML = plan.warmup.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  el("cooldown").innerHTML = plan.cooldown.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  el("progression").innerHTML = [plan.progression, plan.goalNote]
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  el("days").innerHTML = plan.days.map(dayCard).join("");

  el("notes-card").classList.toggle("hidden", plan.notes.length === 0);
  el("notes").innerHTML = plan.notes.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
}

function dayCard(day, index) {
  const sets = day.exercises.reduce((n, ex) => n + ex.sets, 0);
  const rows = day.exercises
    .map(
      (ex, i) => `
      <div class="exercise">
        <div class="ex-num">${i + 1}</div>
        <div class="ex-name">${escapeHtml(ex.name)}</div>
        <div class="ex-sets">${ex.sets} × ${escapeHtml(ex.reps)}</div>
        <div class="ex-sub">${escapeHtml(ex.group)} · rest ${escapeHtml(ex.rest)} · ${escapeHtml(ex.rpe)}</div>
        <div class="ex-cue">${escapeHtml(ex.cue)}</div>
      </div>`
    )
    .join("");

  const finisher = day.finisher
    ? `<div class="finisher"><strong>Finisher:</strong> ${escapeHtml(day.finisher.name)},
       ${escapeHtml(day.finisher.duration)}. ${escapeHtml(day.finisher.cue)}</div>`
    : "";

  return `
    <div class="card day-card">
      <div class="day-head">
        <h3>Day ${index + 1} — ${escapeHtml(day.name)}</h3>
        <span class="day-meta">${escapeHtml(day.weekday)} · ${day.exercises.length} exercises · ${sets} sets</span>
      </div>
      ${rows}
      ${finisher}
    </div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let toastTimer = null;
function toast(message) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    document.body.appendChild(node);
  }
  node.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 2200);
}

// Storage is blocked in some private browsing modes, so never let it break the app.
function store(action) {
  try {
    action();
  } catch {
    /* ignore */
  }
}

// Restore the last answers so a returning visitor sees their plan again.
(function restore() {
  let saved = null;
  store(() => {
    saved = localStorage.getItem(STORAGE_KEY);
  });
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(answers, parsed, { limits: parsed.limits || [] });
    if (!isComplete(answers)) throw new Error("saved answers are incomplete");
    document.querySelectorAll(".options").forEach((container) => {
      const multi = container.classList.contains("multi");
      markSelected(container, answers[container.dataset.field], multi);
    });
    renderPlan(buildPlan(answers));
    show("result");
  } catch {
    store(() => localStorage.removeItem(STORAGE_KEY));
  }
})();
