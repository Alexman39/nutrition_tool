const form = document.getElementById("planForm");
const athleteNameInput = document.getElementById("athleteName");
const goalInput = document.getElementById("goal");
const planTypeInput = document.getElementById("planType");
const rawTextInput = document.getElementById("rawText");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const previewMount = document.getElementById("previewMount");
const exportMount = document.getElementById("exportMount");
const debugOutput = document.getElementById("debugOutput");

const DEFAULT_FORM = {
  athleteName: "Γιώργος Βενέτος",
  goal: "Σωματική Βελτίωση / Απόδοση",
  planType: "Nutrition Plan",
  rawText: `ΓΕΥΜΑ 1 (ΠΡΩΙΝΟ)
• Ασπράδια αυγών: 8
• 1 ολόκληρο αυγό
• Γλυκοπατάτα: 150g
• Λαχανικά

ΓΕΥΜΑ 2
• Στήθος κοτόπουλο: 180g
• Καστανό ρύζι: 120g (μαγειρεμένο)
• Σαλάτα
• Ελαιόλαδο: 10g

ΓΕΥΜΑ 3 (PRE WORKOUT)
• Γαλοπούλα φιλέτο: 160g
• Γλυκοπατάτα: 200g
• Λαχανικά

POST WORKOUT
• 1 scoop πρωτεΐνη whey
• (προαιρετικά) 1 μικρό φρούτο

ΓΕΥΜΑ 4
• Ψάρι: 200g
• Καστανό ρύζι: 100g (μαγειρεμένο)
• Σαλάτα

ΓΕΥΜΑ 5 (ΒΡΑΔΙΝΟ)
• Μοσχάρι άπαχο: 150g
• Σαλάτα
• Ελαιόλαδο: 10g

ΓΕΥΜΑ 6 (ΠΡΟ ΥΠΝΟΥ)
• Ασπράδια αυγών: 6
• ή
• Γιαούρτι 2%: εναλλακτική επιλογή
• Σημείωση: Μπορεί να χρησιμοποιηθεί και πλήρες κατσικίσιο γιαούρτι στο βραδινό, όπου επιλέγεται.

ΟΔΗΓΙΕΣ
✔ Νερό: 3-4 λίτρα ημερησίως
✔ Υδατάνθρακες γύρω από την προπόνηση
✔ 1 cheat meal / εβδομάδα
✔ Στις off μέρες μειώνουμε υδατάνθρακες`
};

const SECTION_SPLIT_RE =
  /(ΓΕΥΜΑ\s*\d+(?:\s*[-–—:]?\s*|\s*\([^)]+\)\s*|\s+)?(?:\([^)]+\))?|POST\s*WORKOUT|PRE\s*WORKOUT|ΠΡΩΙΝΟ|ΜΕΣΗΜΕΡΙΑΝΟ|ΒΡΑΔΙΝΟ|ΣΝΑΚ|SNACK)\b/gi;

const NOTES_RE = /\b(ΣΗΜΕΙΩΣΕΙΣ|ΟΔΗΓΙΕΣ|ΠΑΡΑΤΗΡΗΣΕΙΣ|NOTES?)\b/i;

function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[•●▪◦]/g, "\n• ")
    .replace(/[✔✅✓]/g, "\n✔ ")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(line) {
  return line
    .replace(/^[•\-–—\*]+\s*/g, "")
    .replace(/^[✔✅✓]+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNotes(text) {
  const match = NOTES_RE.exec(text);
  if (!match) return { bodyWithoutNotes: text, notes: [] };

  const idx = match.index;
  const notesBlock = text.slice(idx);
  const bodyWithoutNotes = text.slice(0, idx).trim();

  const notesLabelRemoved = notesBlock.replace(NOTES_RE, "").trim();
  const notes = notesLabelRemoved
    .split(/\n+/)
    .flatMap((line) => {
      const cleaned = cleanLine(line);
      return cleaned ? [cleaned] : [];
    })
    .filter(Boolean);

  return { bodyWithoutNotes, notes };
}

function normalizeTitle(title) {
  return title
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\(([^)]+)\)/g, (_, inner) => ` ${inner}`)
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseMealSection(section) {
  const lines = section.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;

  const title = normalizeTitle(lines[0]);
  const items = lines
    .slice(1)
    .map(cleanLine)
    .filter(Boolean);

  return { title, items };
}

function splitMeals(text) {
  const matches = [...text.matchAll(SECTION_SPLIT_RE)];
  if (!matches.length) return [];

  const sections = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections.push(text.slice(start, end).trim());
  }

  return sections.map(parseMealSection).filter(Boolean);
}

function parsePlan(rawText, meta = {}) {
  const normalized = normalizeText(rawText);
  const { bodyWithoutNotes, notes } = extractNotes(normalized);
  const meals = splitMeals(bodyWithoutNotes);

  return {
    athleteName: meta.athleteName?.trim() || "Όνομα Αθλητή",
    goal: meta.goal?.trim() || "Σωματική Βελτίωση / Απόδοση",
    planType: meta.planType?.trim() || "Nutrition Plan",
    meals,
    notes
  };
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMealTitle(title) {
  const parts = title.split(/\s{2,}| - | – | — /).filter(Boolean);

  if (parts.length > 1) {
    return `${escapeHtml(parts[0])}<br>${escapeHtml(parts.slice(1).join(" "))}`;
  }

  const tokens = title.split(" ");
  if (tokens.length >= 3 && /^ΓΕΥΜΑ$/i.test(tokens[0])) {
    return `${escapeHtml(tokens.slice(0, 2).join(" "))}<br>${escapeHtml(tokens.slice(2).join(" "))}`;
  }

  return escapeHtml(title);
}

function renderMealItems(items) {
  return items
    .map((item) => {
      const colonIndex = item.indexOf(":");
      if (colonIndex > -1) {
        const label = item.slice(0, colonIndex + 1);
        const value = item.slice(colonIndex + 1).trim();
        return `<strong>${escapeHtml(label)}</strong> ${escapeHtml(value)}<br>`;
      }
      return `<strong>${escapeHtml(item)}</strong><br>`;
    })
    .join("");
}

function generateMealGoal(title, index) {
  const t = title.toUpperCase();

  if (t.includes("PRE WORKOUT")) {
    return "Προπονητικό γεύμα με έμφαση στην ενέργεια και την υποστήριξη της απόδοσης πριν την άσκηση.";
  }
  if (t.includes("POST WORKOUT")) {
    return "Άμεση υποστήριξη αποκατάστασης μετά την προπόνηση με γρήγορη και πρακτική επιλογή.";
  }
  if (t.includes("ΠΡΩΙΝ")) {
    return "Πρωινό γεύμα με έμφαση στην ποιότητα, τον κορεσμό και τη σταθερή έναρξη της ημέρας.";
  }
  if (t.includes("ΒΡΑΔΙΝ")) {
    return "Βραδινό γεύμα με έμφαση στον κορεσμό, την αποκατάσταση και τη σταθερότητα του πλάνου.";
  }
  if (t.includes("ΠΡΟ ΥΠΝΟΥ")) {
    return "Τελικό γεύμα ημέρας με στόχο τη σταθερή πρωτεϊνική κάλυψη πριν τον ύπνο.";
  }
  if (index === 1) {
    return "Κύριο γεύμα υποστήριξης για ενέργεια, αποκατάσταση και διατήρηση σταθερής απόδοσης.";
  }
  return "Ισορροπημένο γεύμα για συνέχιση της ημερήσιας πρόσληψης με έμφαση στην ποιότητα.";
}

function buildExportMarkup(plan) {
  const mealsMarkup = plan.meals.length
    ? plan.meals
        .map(
          (meal, index) => `
            <div class="meal-card">
              <div class="meal-name">${formatMealTitle(meal.title)}</div>
              <div class="meal-details">
                ${renderMealItems(meal.items)}
              </div>
              <div class="meal-goal">
                ${escapeHtml(generateMealGoal(meal.title, index))}
              </div>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">No meals detected yet.</div>`;

  const notesMarkup = plan.notes.length
    ? `
      <div class="notes">
        <h3>Οδηγίες</h3>
        <p>${plan.notes.map((n) => `✔ ${escapeHtml(n)}`).join("<br>")}</p>
      </div>
    `
    : "";

  return `
    <div class="export-page">
      <div class="page">
        <section class="hero">
          <div class="brand">FlexPro Online Coaching</div>
          <h1>Διατροφικό Πλάνο</h1>
          <p>
            Το παρακάτω πλάνο έχει σχεδιαστεί για να υποστηρίξει την απόδοση,
            την αποκατάσταση και τη συνέπεια στην καθημερινότητα. Στόχος είναι
            η σωστή εφαρμογή του πλάνου με σταθερότητα και πειθαρχία.
          </p>
        </section>

        <section class="content-card">
          <div class="top-row">
            <div class="mini-card">
              <div class="mini-label">Αθλητής</div>
              <div class="mini-value">${escapeHtml(plan.athleteName)}</div>
            </div>
            <div class="mini-card">
              <div class="mini-label">Στόχος</div>
              <div class="mini-value">${escapeHtml(plan.goal)}</div>
            </div>
            <div class="mini-card">
              <div class="mini-label">Τύπος Πλάνου</div>
              <div class="mini-value">${escapeHtml(plan.planType)}</div>
            </div>
          </div>

          <h2 class="section-title">Nutrition Plan</h2>
          <p class="section-subtitle">
            Όλα τα τρόφιμα μετρώνται σύμφωνα με τις αναγραφόμενες ποσότητες. Διατήρησε
            συνέπεια στα γεύματα και έλεγχο στις καθημερινές επιλογές.
          </p>

          <div class="meal-grid">
            ${mealsMarkup}
          </div>

          ${notesMarkup}

          <div class="quote-box">
            Δεν χτίζουμε μόνο σώματα. Χτίζουμε ανθρώπους.
          </div>

          <div class="footer-line">TASOS MISAILIDIS • FLEXPRO COACHING</div>
        </section>
      </div>
    </div>
  `;
}

function renderPreview(plan) {
  const markup = buildExportMarkup(plan);
  previewMount.innerHTML = markup;
  exportMount.innerHTML = markup;
  debugOutput.textContent = JSON.stringify(plan, null, 2);
  requestAnimationFrame(scalePreviewScene);
}

function scalePreviewScene() {
  const node = previewMount.querySelector(".export-page");
  const wrap = document.querySelector(".preview-scale-wrap");
  if (!node || !wrap) return;

  node.style.transform = "scale(1)";
  node.style.marginBottom = "0px";

  const availableWidth = wrap.clientWidth;
  const naturalWidth = node.offsetWidth;
  const scale = Math.min(1, availableWidth / naturalWidth);

  node.style.transformOrigin = "top left";
  node.style.transform = `scale(${scale})`;
  node.style.marginBottom = `${(1 - scale) * node.offsetHeight * -1}px`;
}

async function downloadPng() {
  const exportNode = exportMount.querySelector(".export-page");
  if (!exportNode) return;

  const buttons = document.querySelectorAll(".btn");
  buttons.forEach((btn) => (btn.disabled = true));
  downloadBtn.textContent = "Preparing...";

  try {
    const dataUrl = await htmlToImage.toPng(exportNode, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#0b0f14",
      skipAutoScale: true
    });

    const link = document.createElement("a");
    const safeName = (athleteNameInput.value.trim() || "nutrition-plan")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

    link.download = `${safeName || "nutrition-plan"}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error(error);
    alert("PNG export failed. Check console for details.");
  } finally {
    buttons.forEach((btn) => (btn.disabled = false));
    downloadBtn.textContent = "Download PNG";
  }
}

function resetForm() {
  athleteNameInput.value = DEFAULT_FORM.athleteName;
  goalInput.value = DEFAULT_FORM.goal;
  planTypeInput.value = DEFAULT_FORM.planType;
  rawTextInput.value = DEFAULT_FORM.rawText;

  const plan = parsePlan(DEFAULT_FORM.rawText, {
    athleteName: DEFAULT_FORM.athleteName,
    goal: DEFAULT_FORM.goal,
    planType: DEFAULT_FORM.planType
  });

  renderPreview(plan);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const plan = parsePlan(rawTextInput.value, {
    athleteName: athleteNameInput.value,
    goal: goalInput.value,
    planType: planTypeInput.value
  });

  renderPreview(plan);
});

downloadBtn.addEventListener("click", downloadPng);
resetBtn.addEventListener("click", resetForm);
window.addEventListener("resize", scalePreviewScene);

resetForm();