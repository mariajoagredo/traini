// Exercise library for the plan generator.
//
// pattern  - movement slot the exercise can fill
// group    - muscle group, shown in the plan
// equip    - "minimal" works with dumbbells and a bench, "gym" needs a full gym
// level    - lowest experience level that should use it (1 new, 2 some, 3 lots)
// avoid    - joints that this exercise loads hard, used by the limitation filter
// light    - too light to be a main lift, used only when nothing better fits
// cue      - one short form reminder

const EXERCISES = [
  // Squat
  { id: "goblet-squat", name: "Goblet squat", pattern: "squat", group: "Quads", equip: "minimal", level: 1, avoid: ["knee"], cue: "Elbows inside the knees, chest tall." },
  { id: "back-squat", name: "Barbell back squat", pattern: "squat", group: "Quads", equip: "gym", level: 2, avoid: ["knee", "back"], cue: "Brace, sit between the hips, knees track over the toes." },
  { id: "front-squat", name: "Barbell front squat", pattern: "squat", group: "Quads", equip: "gym", level: 3, avoid: ["knee"], cue: "Elbows high, stay upright." },
  { id: "hack-squat", name: "Machine hack squat", pattern: "squat", group: "Quads", equip: "gym", level: 1, avoid: ["knee"], cue: "Full range, no bounce at the bottom." },
  { id: "leg-press", name: "Leg press", pattern: "squat", group: "Quads", equip: "gym", level: 1, avoid: [], cue: "Stop before the lower back lifts off the pad." },

  // Hinge
  { id: "db-rdl", name: "Dumbbell Romanian deadlift", pattern: "hinge", group: "Hamstrings, glutes", equip: "minimal", level: 1, avoid: ["back"], cue: "Push the hips back, flat back, light stretch behind the knee." },
  { id: "glute-bridge", light: true, name: "Glute bridge", pattern: "hinge", group: "Glutes", equip: "minimal", level: 1, avoid: [], cue: "Feet close to the hips, push through the heels." },
  { id: "hip-thrust", name: "Hip thrust", pattern: "hinge", group: "Glutes", equip: "gym", level: 1, avoid: [], cue: "Ribs down, squeeze at the top for one second." },
  { id: "deadlift", name: "Barbell deadlift", pattern: "hinge", group: "Posterior chain", equip: "gym", level: 2, avoid: ["back"], cue: "Bar over mid-foot, take the slack out, then push the floor away." },
  { id: "trap-bar-dl", name: "Trap bar deadlift", pattern: "hinge", group: "Posterior chain", equip: "gym", level: 1, avoid: ["back"], cue: "Stand tall, do not lean back at the top." },
  { id: "back-extension", light: true, name: "45-degree back extension", pattern: "hinge", group: "Glutes, lower back", equip: "gym", level: 1, avoid: ["back"], cue: "Round and extend slowly, no swing." },

  // Horizontal push
  { id: "db-bench", name: "Dumbbell bench press", pattern: "push_h", group: "Chest", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Elbows about 45 degrees from the body." },
  { id: "bb-bench", name: "Barbell bench press", pattern: "push_h", group: "Chest", equip: "gym", level: 2, avoid: ["shoulder"], cue: "Bar to the lower chest, feet planted." },
  { id: "machine-press", name: "Chest press machine", pattern: "push_h", group: "Chest", equip: "gym", level: 1, avoid: [], cue: "Control the return, do not let the weight slam." },
  { id: "pushup", name: "Push-up", pattern: "push_h", group: "Chest", equip: "minimal", level: 1, avoid: [], cue: "Straight line from head to heels." },
  { id: "floor-press", name: "Dumbbell floor press", pattern: "push_h", group: "Chest, triceps", equip: "minimal", level: 1, avoid: [], cue: "The floor stops the elbows, so the shoulder stays in a safe range." },
  { id: "incline-db-press", name: "Incline dumbbell press", pattern: "push_incline", group: "Upper chest", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Bench at 30 degrees, press slightly back over the eyes." },
  { id: "cable-fly", light: true, name: "Cable fly", pattern: "push_incline", group: "Chest", equip: "gym", level: 1, avoid: [], cue: "Soft elbows, think about hugging." },

  // Vertical push
  { id: "db-shoulder-press", name: "Seated dumbbell shoulder press", pattern: "push_v", group: "Shoulders", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Ribs down, press to a full lockout." },
  { id: "overhead-press", name: "Barbell overhead press", pattern: "push_v", group: "Shoulders", equip: "gym", level: 2, avoid: ["shoulder", "back"], cue: "Head through at the top, glutes tight." },
  { id: "machine-shoulder-press", name: "Shoulder press machine", pattern: "push_v", group: "Shoulders", equip: "gym", level: 1, avoid: [], cue: "Stop just short of the elbows locking." },

  // Vertical pull
  { id: "lat-pulldown", name: "Lat pulldown", pattern: "pull_v", group: "Lats", equip: "gym", level: 1, avoid: [], cue: "Pull the elbows down to the ribs, not the hands to the chin." },
  { id: "assisted-pullup", name: "Assisted pull-up", pattern: "pull_v", group: "Lats", equip: "gym", level: 1, avoid: [], cue: "Start from a full hang every rep." },
  { id: "pullup", name: "Pull-up", pattern: "pull_v", group: "Lats", equip: "gym", level: 2, avoid: ["shoulder"], cue: "Chest to the bar, lower under control." },
  { id: "band-pulldown", name: "Band lat pulldown", pattern: "pull_v", group: "Lats", equip: "minimal", level: 1, avoid: [], cue: "Keep the chest open, pull to the collarbone." },

  // Horizontal pull
  { id: "db-row", name: "One-arm dumbbell row", pattern: "pull_h", group: "Mid back", equip: "minimal", level: 1, avoid: [], cue: "Row to the hip, no twisting." },
  { id: "cable-row", name: "Seated cable row", pattern: "pull_h", group: "Mid back", equip: "gym", level: 1, avoid: [], cue: "Tall chest, squeeze the shoulder blades." },
  { id: "bb-row", name: "Barbell row", pattern: "pull_h", group: "Mid back", equip: "gym", level: 2, avoid: ["back"], cue: "Torso near 45 degrees, bar to the belly." },
  { id: "chest-supported-row", name: "Chest-supported row", pattern: "pull_h", group: "Mid back", equip: "gym", level: 1, avoid: [], cue: "Let the pad take the load off the lower back." },
  { id: "inverted-row", name: "Inverted row", pattern: "pull_h", group: "Mid back", equip: "minimal", level: 1, avoid: [], cue: "Body straight, touch the chest to the bar." },
  { id: "band-row", name: "Seated band row", pattern: "pull_h", group: "Mid back", equip: "minimal", level: 1, avoid: [], cue: "Sit tall, pull the handles to the ribs." },

  // Single leg
  { id: "split-squat", name: "Dumbbell split squat", pattern: "lunge", group: "Quads, glutes", equip: "minimal", level: 1, avoid: ["knee"], cue: "Back knee straight down, front foot flat." },
  { id: "walking-lunge", name: "Walking lunge", pattern: "lunge", group: "Quads, glutes", equip: "minimal", level: 2, avoid: ["knee"], cue: "Long step, torso upright." },
  { id: "step-up", name: "Box step-up", pattern: "lunge", group: "Quads, glutes", equip: "minimal", level: 1, avoid: ["knee"], cue: "Drive through the top foot, do not push off the floor." },
  { id: "bulgarian", name: "Bulgarian split squat", pattern: "lunge", group: "Quads, glutes", equip: "gym", level: 2, avoid: ["knee"], cue: "Rear foot on the bench, weight on the front leg." },

  // Isolation
  { id: "leg-curl", name: "Leg curl", pattern: "ham_iso", group: "Hamstrings", equip: "gym", level: 1, avoid: [], cue: "Slow on the way back, three seconds." },
  { id: "nordic-eccentric", name: "Band-assisted Nordic curl", pattern: "ham_iso", group: "Hamstrings", equip: "minimal", level: 2, avoid: ["knee"], cue: "Lower as slowly as you can, then help yourself up." },
  { id: "leg-extension", name: "Leg extension", pattern: "quad_iso", group: "Quads", equip: "gym", level: 1, avoid: ["knee"], cue: "Pause one second at the top." },
  { id: "calf-raise", name: "Standing calf raise", pattern: "calf", group: "Calves", equip: "minimal", level: 1, avoid: [], cue: "Full stretch at the bottom, pause at the top." },
  { id: "lateral-raise", name: "Dumbbell lateral raise", pattern: "shoulder_iso", group: "Side delts", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Lead with the elbows, stop at shoulder height." },
  { id: "cable-lateral", name: "Cable lateral raise", pattern: "shoulder_iso", group: "Side delts", equip: "gym", level: 1, avoid: ["shoulder"], cue: "One arm at a time, no swinging." },
  { id: "face-pull", name: "Face pull", pattern: "rear_delt", group: "Rear delts, upper back", equip: "gym", level: 1, avoid: [], cue: "Pull to the forehead, thumbs back." },
  { id: "rear-delt-fly", name: "Dumbbell rear delt fly", pattern: "rear_delt", group: "Rear delts", equip: "minimal", level: 1, avoid: [], cue: "Light weight, feel it between the shoulder blades." },
  { id: "db-curl", name: "Dumbbell curl", pattern: "biceps", group: "Biceps", equip: "minimal", level: 1, avoid: [], cue: "Elbows stay at the sides." },
  { id: "cable-curl", name: "Cable curl", pattern: "biceps", group: "Biceps", equip: "gym", level: 1, avoid: [], cue: "Constant tension, no rest at the bottom." },
  { id: "hammer-curl", name: "Hammer curl", pattern: "biceps", group: "Biceps, forearms", equip: "minimal", level: 1, avoid: [], cue: "Neutral grip the whole way." },
  { id: "rope-pushdown", name: "Rope triceps pushdown", pattern: "triceps", group: "Triceps", equip: "gym", level: 1, avoid: [], cue: "Elbows pinned, spread the rope at the bottom." },
  { id: "overhead-ext", name: "Overhead dumbbell triceps extension", pattern: "triceps", group: "Triceps", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Keep the elbows pointing forward." },
  { id: "dips", name: "Triceps dip", pattern: "triceps", group: "Triceps", equip: "gym", level: 2, avoid: ["shoulder"], cue: "Lean slightly forward, stop when the upper arms are parallel." },
  { id: "band-pushdown", name: "Band triceps pushdown", pattern: "triceps", group: "Triceps", equip: "minimal", level: 1, avoid: [], cue: "Elbows at the sides, straighten fully." },
  { id: "db-kickback", name: "Dumbbell triceps kickback", pattern: "triceps", group: "Triceps", equip: "minimal", level: 1, avoid: [], cue: "Upper arm stays still, only the forearm moves." },

  // Core
  { id: "plank", name: "Plank", pattern: "core", group: "Core", equip: "minimal", level: 1, avoid: [], cue: "Squeeze the glutes, do not let the hips sag." },
  { id: "dead-bug", name: "Dead bug", pattern: "core", group: "Core", equip: "minimal", level: 1, avoid: [], cue: "Lower back stays on the floor." },
  { id: "hanging-knee-raise", name: "Hanging knee raise", pattern: "core", group: "Core", equip: "gym", level: 2, avoid: ["shoulder"], cue: "Curl the pelvis up, no swinging." },
  { id: "cable-crunch", name: "Cable crunch", pattern: "core", group: "Core", equip: "gym", level: 1, avoid: [], cue: "Round the spine down, hips stay still." },
  { id: "side-plank", name: "Side plank", pattern: "core", group: "Obliques", equip: "minimal", level: 1, avoid: ["shoulder"], cue: "Stack the shoulders and hips." },
  { id: "pallof-press", name: "Pallof press", pattern: "core", group: "Core", equip: "gym", level: 1, avoid: [], cue: "Resist the pull, do not rotate." },
  { id: "bird-dog", name: "Bird dog", pattern: "core", group: "Core, lower back", equip: "minimal", level: 1, avoid: [], cue: "Reach long, keep the hips level." },
  { id: "reverse-crunch", name: "Reverse crunch", pattern: "core", group: "Core", equip: "minimal", level: 1, avoid: [], cue: "Lift the hips off the floor, do not swing the legs." },

  // Conditioning finishers
  { id: "bike-intervals", name: "Bike intervals", pattern: "conditioning", group: "Conditioning", equip: "gym", level: 1, avoid: [], cue: "30 seconds hard, 90 seconds easy." },
  { id: "rower-intervals", name: "Rower intervals", pattern: "conditioning", group: "Conditioning", equip: "gym", level: 1, avoid: ["back"], cue: "Legs, then back, then arms." },
  { id: "incline-walk", name: "Incline treadmill walk", pattern: "conditioning", group: "Conditioning", equip: "gym", level: 1, avoid: [], cue: "Steady pace you can hold while breathing through the nose." },
  { id: "kb-swing", name: "Kettlebell swing", pattern: "conditioning", group: "Conditioning", equip: "minimal", level: 2, avoid: ["back"], cue: "Hinge, snap the hips, arms stay relaxed." },
  { id: "jump-rope", name: "Jump rope", pattern: "conditioning", group: "Conditioning", equip: "minimal", level: 1, avoid: ["knee"], cue: "Small hops, stay on the balls of the feet." },
  { id: "brisk-walk", name: "Brisk walk", pattern: "conditioning", group: "Conditioning", equip: "minimal", level: 1, avoid: [], cue: "Fast enough that talking takes effort." },
  { id: "carry", name: "Dumbbell farmer carry", pattern: "conditioning", group: "Conditioning, grip", equip: "minimal", level: 1, avoid: [], cue: "Stand tall, walk 30 seconds, rest 30 seconds." },
];

// Ordered movement slots for each day type. The generator takes as many slots
// as the session length allows, so the first entries matter most.
//
// "backup" slots are only used when the main slots cannot be filled, for
// example when limited equipment or a joint limitation rules exercises out.
const LOWER_BACKUP = ["hinge", "lunge", "calf", "core", "ham_iso", "squat", "quad_iso", "pull_h", "core"];
const UPPER_BACKUP = ["pull_h", "push_h", "biceps", "triceps", "rear_delt", "core", "pull_v", "core"];
const FULL_BACKUP = ["core", "pull_h", "push_h", "hinge", "biceps", "triceps", "calf", "rear_delt"];

const DAY_TEMPLATES = {
  full_a: { name: "Full body A", slots: ["squat", "push_h", "pull_h", "core", "shoulder_iso", "biceps", "calf"], backup: FULL_BACKUP },
  full_b: { name: "Full body B", slots: ["hinge", "push_v", "pull_v", "core", "lunge", "triceps", "rear_delt"], backup: FULL_BACKUP },
  full_c: { name: "Full body C", slots: ["lunge", "push_incline", "pull_h", "ham_iso", "core", "shoulder_iso", "triceps"], backup: FULL_BACKUP },
  upper_a: { name: "Upper body A", slots: ["push_h", "pull_v", "push_v", "pull_h", "biceps", "triceps", "rear_delt", "core"], backup: UPPER_BACKUP },
  upper_b: { name: "Upper body B", slots: ["push_incline", "pull_h", "push_v", "pull_v", "shoulder_iso", "biceps", "triceps", "core"], backup: UPPER_BACKUP },
  lower_a: { name: "Lower body A", slots: ["squat", "hinge", "lunge", "ham_iso", "calf", "core", "quad_iso"], backup: LOWER_BACKUP },
  lower_b: { name: "Lower body B", slots: ["hinge", "squat", "quad_iso", "ham_iso", "calf", "core", "lunge"], backup: LOWER_BACKUP },
  push: { name: "Push day", slots: ["push_h", "push_v", "push_incline", "shoulder_iso", "triceps", "triceps", "core"], backup: ["push_h", "triceps", "core", "shoulder_iso", "push_incline", "core"] },
  pull: { name: "Pull day", slots: ["pull_v", "pull_h", "rear_delt", "biceps", "biceps", "core", "pull_h"], backup: ["pull_h", "biceps", "rear_delt", "core", "pull_v", "core"] },
  legs: { name: "Leg day", slots: ["squat", "hinge", "lunge", "ham_iso", "calf", "core", "quad_iso"], backup: LOWER_BACKUP },
};

// Weekly structure by training days and experience level.
const SPLITS = {
  2: { label: "Full body, twice a week", days: ["full_a", "full_b"] },
  3: {
    1: { label: "Full body, three times a week", days: ["full_a", "full_b", "full_c"] },
    2: { label: "Push / Pull / Legs", days: ["push", "pull", "legs"] },
    3: { label: "Push / Pull / Legs", days: ["push", "pull", "legs"] },
  },
  4: { label: "Upper / Lower, twice through", days: ["upper_a", "lower_a", "upper_b", "lower_b"] },
  5: { label: "Push / Pull / Legs plus Upper / Lower", days: ["push", "pull", "legs", "upper_a", "lower_a"] },
  6: { label: "Push / Pull / Legs, twice through", days: ["push", "pull", "legs", "upper_a", "pull", "lower_a"] },
};

// Set and rep scheme per goal. "main" is for the first compound lifts,
// "accessory" for everything after them.
const GOAL_SCHEMES = {
  muscle: {
    label: "Build muscle",
    main: { sets: 4, reps: "6–10", rest: "2 min", rpe: "RPE 8" },
    accessory: { sets: 3, reps: "10–15", rest: "60–90 s", rpe: "RPE 8–9" },
    mainSlots: 2,
    note: "Volume drives growth. Add a rep or a small load each week before you add sets.",
    conditioning: false,
  },
  strength: {
    label: "Get stronger",
    main: { sets: 5, reps: "3–5", rest: "3 min", rpe: "RPE 7–8" },
    accessory: { sets: 3, reps: "8–12", rest: "90 s", rpe: "RPE 8" },
    mainSlots: 2,
    note: "Rest fully on the main lifts. Leave one good rep in the tank on every set.",
    conditioning: false,
  },
  fatloss: {
    label: "Lose fat, keep muscle",
    main: { sets: 3, reps: "8–12", rest: "90 s", rpe: "RPE 8" },
    accessory: { sets: 3, reps: "12–15", rest: "45–60 s", rpe: "RPE 9" },
    mainSlots: 2,
    note: "Keep the loads heavy so you hold on to muscle. The diet makes the fat loss, not the workout.",
    conditioning: true,
  },
  general: {
    label: "General fitness and health",
    main: { sets: 3, reps: "8–12", rest: "90 s", rpe: "RPE 7–8" },
    accessory: { sets: 2, reps: "10–15", rest: "60 s", rpe: "RPE 8" },
    mainSlots: 2,
    note: "Consistency beats intensity. Finish every session feeling like you could do a bit more.",
    conditioning: true,
  },
};

const LEVELS = {
  1: { label: "New to the gym", volumeFactor: 0.8, progression: "Add a small amount of weight when you hit the top of the rep range on every set. Form first." },
  2: { label: "Some experience", volumeFactor: 1, progression: "Add reps each week inside the range, then add load and drop back to the bottom of the range." },
  3: { label: "Years of training", volumeFactor: 1.1, progression: "Run three hard weeks, then one easy week at about two thirds of the volume." },
};

// How many exercises fit in a session.
const SESSION_SIZE = { 30: 4, 45: 5, 60: 6, 75: 7 };

const WEEKDAY_PLANS = {
  2: ["Monday", "Thursday"],
  3: ["Monday", "Wednesday", "Friday"],
  4: ["Monday", "Tuesday", "Thursday", "Friday"],
  5: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
  6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
