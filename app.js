const STORAGE_KEY = "nutrition_tool_state_v3";

const exampleText = `Γεύμα 1 – Πρωινό
• Ασπράδια αυγών: 10 τεμάχια
• Κρόκος αυγού: 1 τεμάχιο
• Βρώμη: 80γρ
• Μπλούμπερι φρέσκα: 15 τεμάχια
• Μήλο: 1 τεμάχιο

Γεύμα 2 – Σνακ
Επιλογή Α
• Στήθος κοτόπουλο 180γρ
• Ρύζι 200γρ
• Αγγούρι μικρό 1 τεμάχιο

Επιλογή Β
• Ρόφημα πρωτεΐνης 2 scoops
• Μπανάνα 1 τεμάχιο

Γεύμα 3 – Μεσημεριανό
• Γλυκοπατάτα ή πατάτα: 250γρ
• Στήθος κοτόπουλο: 180γρ
• Σαλάτα: Λίγη

Γεύμα 4 – Σνακ
Επιλογή Α
• Ρύζι 200γρ
• Ασπράδια αυγών 6 τεμάχια

Επιλογή Β
• Ρόφημα πρωτεΐνης 2 scoops
• Ρυζογκοφρέτα + Φυστικοβούτυρο 2 τεμάχια
• Μπανάνα ή Μήλο 1 τεμάχιο

Γεύμα 5 – Βραδινό
• Γλυκοπατάτα: 180γρ
• Πηγή πρωτεΐνης Α: Κοτόπουλο 160γρ
• Πηγή πρωτεΐνης Β: Ψάρι 200γρ
• Πηγή πρωτεΐνης Γ: Μοσχάρι 200γρ
• Σαλάτα: Λίγη

Σημειώσεις
• Όλα τα τρόφιμα ζυγίζονται μετά το μαγείρεμα.
• Στόχος ενυδάτωσης: 2–3 μπουκάλια νερό ημερησίως.
• Οι ποσότητες παραμένουν σταθερές ανεξάρτητα από την επιλογή.
• Η συνέπεια στις βασικές οδηγίες είναι αυτή που φέρνει το αποτέλεσμα.`;

const mealLabelRegex = /^(Γεύμα\s*\d+)\s*[–—-]?\s*(.*)$/i;
const notesRegex = /^(σημειώσεις|παρατηρήσεις|notes)\s*[:\-–—]?\s*(.*)$/i;
const optionRegex = /^(επιλογή\s*[α-ωa-z0-9]+)\s*[:\-–—]?\s*(.*)$/i;

const standaloneMealTitles = [
  "πρωινό",
  "μεσημεριανό",
  "βραδινό",
  "σνακ",
  "snack",
  "pre workout",
  "post workout",
  "cheat meal",
  "δεκατιανό",
  "απογευματινό"
];

const mealComments = [
  "Ποιοτική έναρξη της ημέρας με έμφαση στην ενέργεια και τη σωστή κάλυψη πρωτεΐνης.",
  "Ενδιάμεσο γεύμα για υποστήριξη της ημερήσιας πρόσληψης και διατήρηση ενέργειας.",
  "Κύριο γεύμα αποκατάστασης και απόδοσης με έλεγχο ποιότητας και κορεσμού.",
  "Ευέλικτο σνακ για να διατηρείται η πρόσληψη θερμίδων και η εφαρμογή του πλάνου.",
  "Βραδινό γεύμα με έμφαση στην αποκατάσταση, στον κορεσμό και στη σταθερότητα του πλάνου.",
  "Υποστηρικτικό γεύμα με πρακτική εφαρμογή στην καθημερινότητα."
];

const elements = {
  athleteName: document.getElementById("athleteName"),
  goal: document.getElementById("goal"),
  duration: document.getElementById("duration"),
  rawText: document.getElementById("rawText"),
  parseBtn: document.getElementById("parseBtn"),
  exampleBtn: document.getElementById("exampleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  pdfBtn: document.getElementById("pdfBtn"),
  pngBtn: document.getElementById("pngBtn"),
  fitBtn: document.getElementById("fitBtn"),
  copyJsonBtn: document.getElementById("copyJsonBtn"),
  jsonOutput: document.getElementById("jsonOutput"),
  previewAthlete: document.getElementById("previewAthlete"),
  previewGoal: document.getElementById("previewGoal"),
  previewDuration: document.getElementById("previewDuration"),
  mealsContainer: document.getElementById("mealsContainer"),
  notesSection: document.getElementById("notesSection"),
  notesList: document.getElementById("notesList"),
  previewPaper: document.getElementById("previewPaper")
};

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[•●▪◦]/g, "\n• ")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s*([–—-])\s*/g, " $1 ")
    .trim();
}

function splitInlineMeals(text) {
  return text
    .replace(/(Γεύμα\s*\d+\s*[–—-]?\s*[^\n•]*)/gi, "\n$1\n")
    .replace(
      /(?<!Γεύμα\s*\d+\s*[–—-]?\s*)\b(Πρωινό|Μεσημεριανό|Βραδινό|Σνακ|Snack|Pre Workout|Post Workout|Cheat Meal|Δεκατιανό|Απογευματινό)\b/gi,
      "\n$1\n"
    )
    .replace(/(Σημειώσεις|Παρατηρήσεις|Notes)\s*([•\-\n])/gi, "\n$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function preprocessText(raw) {
  const normalized = normalizeText(raw);
  return splitInlineMeals(normalized);
}

function cleanLine(line) {
  return line
    .replace(/^[•\-–—]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isStandaloneMealTitle(line) {
  const lower = line.toLowerCase().trim();
  return standaloneMealTitles.includes(lower);
}

function parseNutritionText(rawText, meta = {}) {
  const preprocessed = preprocessText(rawText);
  const lines = preprocessed
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);

  const result = {
    athleteName: meta.athleteName || "",
    goal: meta.goal || "",
    duration: meta.duration || "",
    meals: [],
    notes: []
  };

  let currentMeal = null;
  let currentOption = null;
  let inNotes = false;

  function pushMeal(title, subtitle = "") {
    const meal = {
      title: title || `Γεύμα ${result.meals.length + 1}`,
      subtitle,
      items: [],
      options: []
    };
    result.meals.push(meal);
    currentMeal = meal;
    currentOption = null;
    inNotes = false;
  }

  function pushOption(label) {
    if (!currentMeal) {
      pushMeal(`Γεύμα ${result.meals.length + 1}`, "");
    }
    const option = {
      label,
      items: []
    };
    currentMeal.options.push(option);
    currentOption = option;
  }

  for (const line of lines) {
    const mealMatch = line.match(mealLabelRegex);
    const notesMatch = line.match(notesRegex);
    const optionMatch = line.match(optionRegex);

    if (notesMatch) {
      inNotes = true;
      currentMeal = null;
      currentOption = null;
      const trailing = cleanLine(notesMatch[2] || "");
      if (trailing) result.notes.push(trailing);
      continue;
    }

    if (mealMatch) {
      const mealBase = cleanLine(mealMatch[1] || "");
      const subtitle = cleanLine(mealMatch[2] || "");
      pushMeal(mealBase, subtitle);
      continue;
    }

    if (isStandaloneMealTitle(line)) {
      const titleLabel = `Γεύμα ${result.meals.length + 1}`;
      pushMeal(titleLabel, line);
      continue;
    }

    if (optionMatch && currentMeal && !inNotes) {
      pushOption(cleanLine(optionMatch[1]));
      const trailing = cleanLine(optionMatch[2] || "");
      if (trailing) currentOption.items.push(trailing);
      continue;
    }

    if (inNotes) {
      result.notes.push(line);
      continue;
    }

    if (!currentMeal) {
      const titleLabel = `Γεύμα ${result.meals.length + 1}`;
      pushMeal(titleLabel, "");
    }

    if (currentOption) {
      currentOption.items.push(line);
    } else {
      currentMeal.items.push(line);
    }
  }

  result.meals = result.meals.filter(
    (meal) => meal.items.length || meal.options.length || meal.subtitle
  );

  result.notes = result.notes.filter(Boolean);

  return result;
}

function formatFoodLine(text) {
  const colonIndex = text.indexOf(":");
  if (colonIndex > 0) {
    const left = text.slice(0, colonIndex).trim();
    const right = text.slice(colonIndex + 1).trim();
    return `<strong>${escapeHtml(left)}:</strong> ${escapeHtml(right)}`;
  }

  const amountPattern =
    /^((?:\d+[.,]?\d*\s*(?:g|γρ|γραμ|gr|kg|ml|τεμάχια|τεμάχιο|scoops?|κ\.σ\.|κουταλιές?)\b))/i;
  const amountMatch = text.match(amountPattern);

  if (amountMatch) {
    return `<strong>${escapeHtml(amountMatch[1])}</strong> ${escapeHtml(
      text.replace(amountMatch[1], "").trim()
    )}`;
  }

  return escapeHtml(text);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMealTitle(meal, index) {
  return meal.title || `Γεύμα ${index + 1}`;
}

function getMealSubtitle(meal) {
  return meal.subtitle || "";
}

function getMealComment(index) {
  return mealComments[index] || mealComments[mealComments.length - 1];
}

function renderMeals(meals) {
  elements.mealsContainer.innerHTML = "";

  if (!meals.length) {
    elements.mealsContainer.innerHTML = `
      <article class="meal-row">
        <div class="meal-col meal-col-title">
          <h4 class="meal-title">Γεύμα 1</h4>
          <p class="meal-subtitle">—</p>
        </div>
        <div class="meal-col meal-foods">
          <ul class="meal-food-list">
            <li>Δεν βρέθηκαν γεύματα ακόμη. Κάνε Parse Plan για να εμφανιστεί το πλάνο.</li>
          </ul>
        </div>
        <div class="meal-col meal-comment">
          <p>Η προεπισκόπηση θα ενημερωθεί μόλις γίνει ανάλυση του κειμένου.</p>
        </div>
      </article>
    `;
    return;
  }

  meals.forEach((meal, index) => {
    const title = getMealTitle(meal, index);
    const subtitle = getMealSubtitle(meal);
    const comment = getMealComment(index);

    let centerMarkup = "";

    if (meal.options && meal.options.length) {
      centerMarkup = meal.options
        .map(
          (option) => `
            <div class="option-block">
              <p class="option-title">${escapeHtml(option.label)}:</p>
              <ul class="option-list">
                ${option.items.map((item) => `<li>${formatFoodLine(item)}</li>`).join("")}
              </ul>
            </div>
          `
        )
        .join("");
    } else {
      centerMarkup = `
        <ul class="meal-food-list">
          ${meal.items.map((item) => `<li>${formatFoodLine(item)}</li>`).join("")}
        </ul>
      `;
    }

    const mealMarkup = `
      <article class="meal-row">
        <div class="meal-col meal-col-title">
          <h4 class="meal-title">${escapeHtml(title)}</h4>
          <p class="meal-subtitle">${escapeHtml(subtitle || " ")}</p>
        </div>
        <div class="meal-col meal-foods">
          ${centerMarkup}
        </div>
        <div class="meal-col meal-comment">
          <p>${escapeHtml(comment)}</p>
        </div>
      </article>
    `;

    elements.mealsContainer.insertAdjacentHTML("beforeend", mealMarkup);
  });
}

function renderNotes(notes) {
  if (!notes.length) {
    elements.notesSection.classList.add("hidden");
    elements.notesList.innerHTML = "";
    return;
  }

  elements.notesSection.classList.remove("hidden");
  elements.notesList.innerHTML = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
}

function renderPreview(data) {
  elements.previewAthlete.textContent = data.athleteName || "—";
  elements.previewGoal.textContent = data.goal || "—";
  elements.previewDuration.textContent = data.duration || "—";
  renderMeals(data.meals || []);
  renderNotes(data.notes || []);
  elements.jsonOutput.textContent = JSON.stringify(data, null, 2);

  requestAnimationFrame(() => {
    autoFitPreview();
  });

  setTimeout(() => {
  applySmartFit();
}, 50);
}

function getFormState() {
  return {
    athleteName: elements.athleteName.value.trim(),
    goal: elements.goal.value.trim(),
    duration: elements.duration.value.trim(),
    rawText: elements.rawText.value
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getFormState()));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    elements.athleteName.value = data.athleteName || "";
    elements.goal.value = data.goal || "";
    elements.duration.value = data.duration || "";
    elements.rawText.value = data.rawText || "";
  } catch (error) {
    console.error("Failed to load saved state", error);
  }
}

function runParse() {
  const state = getFormState();
  const parsed = parseNutritionText(state.rawText, state);
  renderPreview(parsed);
  saveState();
}

function resetAll() {
  elements.athleteName.value = "";
  elements.goal.value = "";
  elements.duration.value = "";
  elements.rawText.value = "";
  localStorage.removeItem(STORAGE_KEY);
  renderPreview({
    athleteName: "",
    goal: "",
    duration: "",
    meals: [],
    notes: []
  });
}

function loadExample() {
  elements.athleteName.value = "Κωνσταντίνος Κανέτος";
  elements.goal.value = "Μυϊκή Ανάπτυξη / Απόδοση";
  elements.duration.value = "15 Ημέρες";
  elements.rawText.value = exampleText;
  runParse();
}

function autoFitPreview() {
  const paper = elements.previewPaper;
  const frame = paper.parentElement;
  if (!paper || !frame) return;

  if (window.innerWidth <= 860) {
    paper.style.transform = "none";
    return;
  }

  const availableWidth = frame.clientWidth - 20;
  const baseWidth = 794;
  const scale = Math.min(1, availableWidth / baseWidth);
  paper.style.transform = `scale(${scale})`;
  frame.style.height = `${paper.offsetHeight * scale}px`;
}

async function downloadPNG() {
  const originalPaper = elements.previewPaper;
  const safeName =
    (elements.athleteName.value || "nutrition-plan")
      .trim()
      .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
      .replace(/\s+/g, "-") || "nutrition-plan";

  const exportWrapper = document.createElement("div");
  exportWrapper.style.position = "fixed";
  exportWrapper.style.left = "-99999px";
  exportWrapper.style.top = "0";
  exportWrapper.style.width = "794px";
  exportWrapper.style.padding = "0";
  exportWrapper.style.margin = "0";
  exportWrapper.style.background = "#ffffff";
  exportWrapper.style.zIndex = "-1";
  exportWrapper.style.overflow = "visible";

  const clone = originalPaper.cloneNode(true);
  clone.style.transform = "none";
  clone.style.width = "794px";
  clone.style.maxWidth = "794px";
  clone.style.minHeight = "auto";
  clone.style.height = "auto";
  clone.style.margin = "0";
  clone.style.overflow = "visible";

  exportWrapper.appendChild(clone);
  document.body.appendChild(exportWrapper);

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 120));

  const exportHeight = Math.ceil(clone.scrollHeight);

  applySmartFit();

  const canvas = await html2canvas(clone, {
    backgroundColor: "#ffffff",
    scale: 2.5,
    useCORS: true,
    width: 794,
    windowWidth: 1400, // 🔥 force desktop layout
    windowHeight: exportHeight,
  });

  document.body.removeChild(exportWrapper);

  const link = document.createElement("a");
  link.download = `${safeName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function printPDF() {
  const paper = elements.previewPaper;
  const previousTransform = paper.style.transform;
  paper.style.transform = "none";
  window.print();
  setTimeout(() => {
    paper.style.transform = previousTransform;
    autoFitPreview();
  }, 400);
}

elements.parseBtn.addEventListener("click", runParse);
elements.exampleBtn.addEventListener("click", loadExample);
elements.resetBtn.addEventListener("click", resetAll);
elements.pdfBtn.addEventListener("click", printPDF);
elements.pngBtn.addEventListener("click", downloadPNG);
elements.fitBtn.addEventListener("click", autoFitPreview);

elements.copyJsonBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(elements.jsonOutput.textContent);
    elements.copyJsonBtn.textContent = "Copied";
    setTimeout(() => {
      elements.copyJsonBtn.textContent = "Copy JSON";
    }, 1200);
  } catch (error) {
    console.error("Clipboard failed", error);
  }
});

[elements.athleteName, elements.goal, elements.duration, elements.rawText].forEach((el) => {
  el.addEventListener("input", saveState);
});

window.addEventListener("resize", autoFitPreview);

loadState();

if (elements.rawText.value.trim()) {
  runParse();
} else {
  renderPreview({
    athleteName: "",
    goal: "",
    duration: "",
    meals: [],
    notes: []
  });
}

function applySmartFit() {
  const paper = elements.previewPaper;

  // reset first
  paper.classList.remove("fit-tight", "fit-extreme");

  const maxHeight = 1123; // A4 height px
  const currentHeight = paper.scrollHeight;

  // if already fits → do nothing
  if (currentHeight <= maxHeight) return;

  // apply first compression
  paper.classList.add("fit-tight");

  // re-check
  setTimeout(() => {
    const newHeight = paper.scrollHeight;

    if (newHeight > maxHeight) {
      // apply extreme mode
      paper.classList.add("fit-extreme");
    }
  }, 50);
}