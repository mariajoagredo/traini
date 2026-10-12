// Turns the answers from the questionnaire into a weekly training plan.
// Everything here is deterministic: the same answers always give the same plan.

function pickSplit(days, level) {
  const entry = SPLITS[days];
  if (!entry) return SPLITS[3][2];
  return entry.days ? entry : entry[level] || entry[2];
}

function sessionSize(minutes, level) {
  const base = SESSION_SIZE[minutes] || 5;
  const adjusted = Math.round(base * LEVELS[level].volumeFactor);
  return Math.max(3, Math.min(8, adjusted));
}

function isAllowed(exercise, answers) {
  if (exercise.equip === "gym" && answers.equipment === "minimal") return false;
  if (exercise.level > answers.level) return false;
  return !exercise.avoid.some((joint) => answers.limits.includes(joint));
}

// Picks an exercise for one movement slot.
//
// dayUsed  - never repeat an exercise inside the same session
// weekUsed - prefer something new this week, so the days differ from each other
// wantMain - this is one of the first lifts, so skip the light exercises
function pickExercise(pattern, answers, weekUsed, dayUsed, rotation, wantMain) {
  let candidates = EXERCISES.filter(
    (ex) => ex.pattern === pattern && isAllowed(ex, answers) && !dayUsed.has(ex.id)
  );
  if (candidates.length === 0) return null;

  if (wantMain) {
    const heavy = candidates.filter((ex) => !ex.light);
    if (heavy.length > 0) candidates = heavy;
  }

  const fresh = candidates.filter((ex) => !weekUsed.has(ex.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  const offset = rotation[pattern] || 0;
  rotation[pattern] = offset + 1;
  return pool[offset % pool.length];
}

function buildDay(templateKey, dayIndex, answers, weekUsed, rotation) {
  const template = DAY_TEMPLATES[templateKey];
  const scheme = GOAL_SCHEMES[answers.goal];
  const target = sessionSize(answers.minutes, answers.level);
  const dayUsed = new Set();
  const exercises = [];

  const fill = (patterns) => {
    for (const pattern of patterns) {
      if (exercises.length >= target) return;
      const isMain = exercises.length < scheme.mainSlots;
      const exercise = pickExercise(pattern, answers, weekUsed, dayUsed, rotation, isMain);
      if (!exercise) continue;
      dayUsed.add(exercise.id);
      weekUsed.add(exercise.id);

      const spec = isMain ? scheme.main : scheme.accessory;
      exercises.push({
        name: exercise.name,
        group: exercise.group,
        cue: exercise.cue,
        role: isMain ? "Main lift" : "Accessory",
        sets: spec.sets,
        reps: exercise.pattern === "core" ? coreReps(exercise) : spec.reps,
        rest: spec.rest,
        rpe: spec.rpe,
      });
    }
  };

  fill(template.slots);
  if (exercises.length < target) fill(template.backup);

  const day = {
    weekday: WEEKDAY_PLANS[answers.days][dayIndex],
    name: template.name,
    short: exercises.length < target,
    exercises,
  };

  if (scheme.conditioning) {
    const finisher = pickExercise("conditioning", answers, weekUsed, dayUsed, rotation);
    if (finisher) {
      weekUsed.add(finisher.id);
      day.finisher = {
        name: finisher.name,
        cue: finisher.cue,
        duration: answers.goal === "fatloss" ? "10 min" : "8 min",
      };
    }
  }

  return day;
}

function coreReps(exercise) {
  const holds = ["plank", "side-plank"];
  return holds.includes(exercise.id) ? "30–45 s" : "10–15";
}

function weeklyVolume(days) {
  return days.reduce((total, day) => total + day.exercises.reduce((n, ex) => n + ex.sets, 0), 0);
}

function isComplete(answers) {
  return Boolean(
    GOAL_SCHEMES[answers.goal] &&
      LEVELS[answers.level] &&
      WEEKDAY_PLANS[answers.days] &&
      SESSION_SIZE[answers.minutes] &&
      (answers.equipment === "gym" || answers.equipment === "minimal") &&
      Array.isArray(answers.limits)
  );
}

function buildPlan(answers) {
  if (!isComplete(answers)) throw new Error("Answers are incomplete");
  const split = pickSplit(answers.days, answers.level);
  const scheme = GOAL_SCHEMES[answers.goal];
  const used = new Set();
  const rotation = {};

  const days = split.days.map((key, index) => {
    // Reset the "already used" list halfway through so a six day week can
    // repeat the good compound lifts instead of running out of exercises.
    if (index === Math.ceil(split.days.length / 2) && split.days.length > 3) used.clear();
    return buildDay(key, index, answers, used, rotation);
  });

  const notes = [];
  if (days.some((day) => day.short)) {
    notes.push(
      "Your equipment and limitations rule out some exercises, so a few sessions are shorter than your time slot. Add a second set of walking or an extra set of the exercises you can do."
    );
  }
  if (answers.limits.length > 0) {
    notes.push(
      "Exercises that load your chosen problem areas hard are left out. Stop any movement that hurts, and see a physiotherapist about pain that stays."
    );
  }

  return {
    notes,
    goal: scheme.label,
    goalNote: scheme.note,
    level: LEVELS[answers.level].label,
    progression: LEVELS[answers.level].progression,
    splitLabel: split.label,
    daysPerWeek: answers.days,
    minutes: answers.minutes,
    equipment: answers.equipment === "gym" ? "Full gym" : "Dumbbells and a bench",
    totalSets: weeklyVolume(days),
    days,
    warmup: [
      "5 minutes easy cardio to raise the body temperature.",
      "10 reps of the first exercise with no weight or a very light weight.",
      "Two build-up sets of the first exercise at about half and three quarters of the working weight.",
    ],
    cooldown: [
      "3 to 5 minutes of easy walking.",
      "Stretch whatever felt tight for 30 seconds each side.",
    ],
  };
}

// Plain text version, used by the copy button.
function planToText(plan) {
  const lines = [];
  lines.push("TRAINI — YOUR TRAINING PLAN");
  lines.push("");
  lines.push(`Goal: ${plan.goal}`);
  lines.push(`Experience: ${plan.level}`);
  lines.push(`Split: ${plan.splitLabel}`);
  lines.push(`Schedule: ${plan.daysPerWeek} days a week, about ${plan.minutes} minutes a session`);
  lines.push(`Equipment: ${plan.equipment}`);
  lines.push(`Weekly working sets: ${plan.totalSets}`);
  lines.push("");
  lines.push("WARM-UP (every session)");
  plan.warmup.forEach((step) => lines.push(`- ${step}`));
  lines.push("");

  plan.days.forEach((day, index) => {
    lines.push(`DAY ${index + 1} — ${day.name} (${day.weekday})`);
    day.exercises.forEach((ex, i) => {
      lines.push(`  ${i + 1}. ${ex.name} — ${ex.sets} x ${ex.reps}, rest ${ex.rest}, ${ex.rpe}`);
      lines.push(`     ${ex.group}. ${ex.cue}`);
    });
    if (day.finisher) {
      lines.push(`  Finisher: ${day.finisher.name}, ${day.finisher.duration}. ${day.finisher.cue}`);
    }
    lines.push("");
  });

  lines.push("HOW TO PROGRESS");
  lines.push(`- ${plan.progression}`);
  lines.push(`- ${plan.goalNote}`);
  lines.push("");

  if (plan.notes.length > 0) {
    lines.push("NOTES");
    plan.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push("");
  }

  lines.push("COOL-DOWN");
  plan.cooldown.forEach((step) => lines.push(`- ${step}`));
  lines.push("");
  lines.push("This is a proof of concept, not medical advice.");
  return lines.join("\n");
}
