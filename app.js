const STORAGE_KEY = "nutrition-plan-parser-state-v1";

const elements = {
  athleteName: document.getElementById("athleteName"),
  goal: document.getElementById("goal"),
  duration: document.getElementById("duration"),
  rawInput: document.getElementById("rawInput"),
  parseBtn: document.getElementById("parseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  exampleBtn: document.getElementById("exampleBtn"),
  printBtn: document.getElementById("printBtn"),
  previewAthlete: document.getElementById("previewAthlete"),
  previewSubtitle: document.getElementById("previewSubtitle"),
  infoAthlete: document.getElementById("infoAthlete"),
  infoGoal: document.getElementById("infoGoal"),
  infoDuration: document.getElementById("infoDuration"),
  mealsContainer: document.getElementById("mealsContainer"),
  notesSection: document.getElementById("notesSection"),
  notesList: document.getElementById("notesList"),
};

const exampleInput = `Γεύμα 1 – Πρωινό • 80 g βρώμη • 2 ολόκληρα + 4 ασπράδια • 15-20 μπλουμπερι φρέσκα
Γεύμα 2 – Μεσημεριανό • 220 g φιλέτο κοτόπουλο ή γαλοπούλα • 300 g πατάτα βραστή ή φούρνου • Πράσινη σαλάτα • 1 κ.σ. ελαιόλαδο
Γεύμα 3 – Pre Workout • 200 g άπαχο ψάρι • 200 g πατάτα • Λαχανικά
Γεύμα 4 • 200 g κοτόπουλο ή άπαχο κρέας • Μεγάλη σαλάτα λαχανικών • 1 κ.σ. ελαιόλαδο
Σημειώσεις • Νερό: 3–4 λίτρα ημερησίως • Αλάτι: Ελεγχόμενο • Αποφυγή ζάχαρης`;

const mealTitlePatterns = [
  /^(γευμα\s*\d+(?:\s*[–—-]\s*.+)?)/i,
  /^(πρωιν[όο]|μεσημεριαν[όο]|βραδιν[όο]|δεκατιαν[όο]|σνακ|snack|pre\s*-?\s*workout|post\s*-?\s*workout|cheat\s*meal)(?:\s*[–—-].+)?/i,
  /^(επιλογ[ήη]\s*[α-ωa-z0-9]+)/i,
];

const notesPattern = /^(σημειωσει?ς|παρατηρησει?ς|notes?)$/i;

function normalizeText(rawText) {
  if (!rawText) return "";

  let text = rawText
    .replace(/\r/g, "\n")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[‐‑‒–—]/g, " - ")
    .replace(/[•●▪◦·]/g, "\n• ")
    .replace(/\t+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();

  text = text.replace(/(Γεύμα\s*\d+(?:\s*-\s*[^\n•]+)?)/gi, "\n$1");
  text = text.replace(/(Πρωινό|Μεσημεριανό|Βραδινό|Σνακ|Snack|Pre\s*-?\s*Workout|Post\s*-?\s*Workout|Cheat\s*Meal)(?=\s*[-•])/gi, "\n$1");
  text = text.replace(/(Σημειώσεις|Παρατηρήσεις|Notes?)(?=\s*[-•])/gi, "\n$1");
  text = text.replace(/\n{2,}/g, "\n");

  return text;
}

function splitInlineTitleAndItems(line) {
  const cleaned = cleanLine(line);
  const bulletIndex = cleaned.indexOf("•");

  if (bulletIndex > -1) {
    const head = cleaned.slice(0, bulletIndex).trim();
    const tail = cleaned.slice(bulletIndex).trim();
    return { head, tail };
  }

  const dashMatch = cleaned.match(/^(.+?)(?:\s+-\s+)(.+)$/);
  if (dashMatch && isLikelyMealTitle(dashMatch[1].trim())) {
    return {
      head: `${dashMatch[1].trim()} - ${dashMatch[2].trim().split(/\s{2,}/)[0]}`,
      tail: "",
    };
  }

  return { head: cleaned, tail: "" };
}

function cleanLine(line) {
  return line
    .replace(/^[-•\s]+/, "")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function isLikelyMealTitle(text) {
  if (!text) return false;
  const value = text.trim();
  return mealTitlePatterns.some((pattern) => pattern.test(value));
}

function isNotesTitle(text) {
  if (!text) return false;
  return notesPattern.test(cleanLine(text));
}

function extractItemsFromFragment(fragment) {
  if (!fragment) return [];

  return fragment
    .split(/\n|•/)
    .map((part) => cleanLine(part))
    .filter(Boolean)
    .flatMap((part) => {
      const subParts = part.split(/(?<!\d)\s+-\s+(?!\d)/).map((value) => cleanLine(value)).filter(Boolean);
      return subParts.length > 1 ? subParts : [part];
    })
    .filter(Boolean);
}

function parseNutritionText(rawText, meta = {}) {
  const normalized = normalizeText(rawText);
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const result = {
    athleteName: meta.athleteName || "",
    goal: meta.goal || "",
    duration: meta.duration || "",
    meals: [],
    notes: [],
  };

  let currentMeal = null;
  let inNotes = false;

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    if (!line) continue;

    if (isNotesTitle(line)) {
      inNotes = true;
      currentMeal = null;
      continue;
    }

    if (inNotes) {
      if (isLikelyMealTitle(line)) {
        inNotes = false;
      } else {
        result.notes.push(...extractItemsFromFragment(line));
        continue;
      }
    }

    const { head, tail } = splitInlineTitleAndItems(line);

    if (isLikelyMealTitle(head)) {
      currentMeal = { title: head.trim(), items: [] };
      result.meals.push(currentMeal);

      const inlineItems = extractItemsFromFragment(tail);
      if (inlineItems.length) {
        currentMeal.items.push(...inlineItems);
      }
      continue;
    }

    if (!currentMeal) {
      if (result.meals.length === 0) {
        currentMeal = { title: "Γεύμα 1", items: [] };
        result.meals.push(currentMeal);
      } else {
        currentMeal = result.meals[result.meals.length - 1];
      }
    }

    currentMeal.items.push(...extractItemsFromFragment(line));
  }

  result.meals = result.meals
    .map((meal) => ({
      title: meal.title || "Γεύμα",
      items: meal.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((meal) => meal.items.length || meal.title);

  result.notes = result.notes.map((note) => note.trim()).filter(Boolean);

  return result;
}

function createMealCard(meal, index) {
  const article = document.createElement("article");
  article.className = "meal-card";

  const title = document.createElement("h3");
  title.className = "meal-title";
  title.textContent = meal.title || `Γεύμα ${index + 1}`;

  const list = document.createElement("ul");
  list.className = "meal-items";

  if (!meal.items.length) {
    const empty = document.createElement("li");
    empty.textContent = "Δεν εντοπίστηκαν στοιχεία για αυτό το γεύμα.";
    list.appendChild(empty);
  } else {
    meal.items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }

  article.append(title, list);
  return article;
}

function renderPlan(plan) {
  elements.previewAthlete.textContent = plan.athleteName || "Athlete Name";
  elements.previewSubtitle.textContent = "Structured nutrition plan generated from raw Greek text.";
  elements.infoAthlete.textContent = plan.athleteName || "—";
  elements.infoGoal.textContent = plan.goal || "—";
  elements.infoDuration.textContent = plan.duration || "—";

  elements.mealsContainer.innerHTML = "";

  if (!plan.meals.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <strong>Το preview θα εμφανιστεί εδώ.</strong>
      <p style="margin: 10px 0 0;">Πρόσθεσε το raw πρόγραμμα και πάτα Parse Plan.</p>
    `;
    elements.mealsContainer.appendChild(emptyState);
  } else {
    plan.meals.forEach((meal, index) => {
      elements.mealsContainer.appendChild(createMealCard(meal, index));
    });
  }

  elements.notesList.innerHTML = "";
  if (plan.notes.length) {
    elements.notesSection.classList.remove("hidden");
    plan.notes.forEach((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      elements.notesList.appendChild(li);
    });
  } else {
    elements.notesSection.classList.add("hidden");
  }
}

function getFormState() {
  return {
    athleteName: elements.athleteName.value.trim(),
    goal: elements.goal.value.trim(),
    duration: elements.duration.value.trim(),
    rawInput: elements.rawInput.value,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormState()));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;

    elements.athleteName.value = saved.athleteName || "";
    elements.goal.value = saved.goal || "";
    elements.duration.value = saved.duration || "";
    elements.rawInput.value = saved.rawInput || "";
  } catch (error) {
    console.warn("Could not restore local state", error);
  }
}

function resetForm() {
  elements.athleteName.value = "";
  elements.goal.value = "";
  elements.duration.value = "";
  elements.rawInput.value = "";
  localStorage.removeItem(STORAGE_KEY);
  renderPlan({ athleteName: "", goal: "", duration: "", meals: [], notes: [] });
}

function parseAndRender() {
  const state = getFormState();
  const parsed = parseNutritionText(state.rawInput, state);
  renderPlan(parsed);
  saveState();
  return parsed;
}

function attachEvents() {
  elements.parseBtn.addEventListener("click", parseAndRender);
  elements.resetBtn.addEventListener("click", resetForm);
  elements.exampleBtn.addEventListener("click", () => {
    elements.athleteName.value = "Demo Athlete";
    elements.goal.value = "Fat Loss";
    elements.duration.value = "4 Weeks";
    elements.rawInput.value = exampleInput;
    parseAndRender();
  });
  elements.printBtn.addEventListener("click", () => window.print());

  [elements.athleteName, elements.goal, elements.duration, elements.rawInput].forEach((element) => {
    element.addEventListener("input", saveState);
  });
}

function init() {
  loadState();
  attachEvents();

  const hasContent = elements.rawInput.value.trim() || elements.athleteName.value.trim() || elements.goal.value.trim() || elements.duration.value.trim();
  if (hasContent) {
    parseAndRender();
  } else {
    renderPlan({ athleteName: "", goal: "", duration: "", meals: [], notes: [] });
  }
}

init();

window.NutritionPlanParser = {
  parseNutritionText,
  normalizeText,
};
