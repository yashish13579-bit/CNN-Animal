// ============================================================
// CONFIG — adjust these two lines if your backend differs
// ============================================================
const API_URL = "http://127.0.0.1:5001/predict";
const FILE_FIELD_NAME = "image";

// ============================================================
// Element refs
// ============================================================
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");

const stateEmpty = document.getElementById("state-empty");
const statePreview = document.getElementById("state-preview");
const previewImg = document.getElementById("preview-img");
const scanSweep = document.getElementById("scan-sweep");

const previewActions = document.getElementById("preview-actions");
const btnAnalyze = document.getElementById("btn-analyze");
const btnChange = document.getElementById("btn-change");
const statusAnalyzing = document.getElementById("status-analyzing");

const resultSection = document.getElementById("result");
const resultId = document.getElementById("result-id");
const resultBreed = document.getElementById("result-breed");
const gaugeTrack = document.getElementById("gauge-track");
const confidenceNumber = document.getElementById("confidence-number");
const altPredictions = document.getElementById("alt-predictions");
const altList = document.getElementById("alt-list");
const btnAgain = document.getElementById("btn-again");

const errorSection = document.getElementById("error");
const errorMessage = document.getElementById("error-message");
const btnRetry = document.getElementById("btn-retry");

const scannerSection = document.getElementById("scanner");

const GAUGE_SEGMENTS = 24;
let currentFile = null;

// ============================================================
// Gauge (segmented VU-meter style)
// ============================================================
function buildGauge() {
  gaugeTrack.innerHTML = "";
  for (let i = 0; i < GAUGE_SEGMENTS; i++) {
    const span = document.createElement("span");
    gaugeTrack.appendChild(span);
  }
}
buildGauge();

function setGauge(percent) {
  const segments = gaugeTrack.children;
  const litCount = Math.round((percent / 100) * segments.length);
  [...segments].forEach((seg, i) => {
    seg.classList.toggle("lit", i < litCount);
  });
}

// ============================================================
// Helpers
// ============================================================
function showOnly(section) {
  resultSection.hidden = section !== "result";
  errorSection.hidden = section !== "error";
  scannerSection.hidden = section === "result" || section === "error";
}

function resetToEmpty() {
  currentFile = null;
  fileInput.value = "";
  stateEmpty.hidden = false;
  statePreview.hidden = true;
  previewActions.hidden = false;
  statusAnalyzing.hidden = true;
  scanSweep.hidden = true;
  showOnly("scanner");
}

function showPreview(file) {
  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    stateEmpty.hidden = true;
    statePreview.hidden = false;
    previewActions.hidden = false;
    statusAnalyzing.hidden = true;
    scanSweep.hidden = true;
    showOnly("scanner");
  };
  reader.readAsDataURL(file);
}

function setAnalyzing(isAnalyzing) {
  previewActions.hidden = isAnalyzing;
  statusAnalyzing.hidden = !isAnalyzing;
  scanSweep.hidden = !isAnalyzing;
}

// Normalizes a confidence value that might come as 0-1 or 0-100
function normalizeConfidence(value) {
  if (value == null || isNaN(value)) return null;
  return value <= 1 ? value * 100 : value;
}

function randomSpecimenId() {
  return "#" + String(Math.floor(Math.random() * 900) + 100);
}

function renderResult(data) {
  // Expected shape: { breed: "Golden Retriever", confidence: 0.94, top_predictions: [{label, confidence}, ...] }
  const breed = data.breed || data.label || data.prediction || "Unclassified";
  const confidence = normalizeConfidence(
    data.confidence ?? data.score ?? data.probability
  );

  resultId.textContent = randomSpecimenId();
  resultBreed.textContent = breed;

  const pct = confidence != null ? Math.round(confidence) : 0;
  confidenceNumber.textContent = confidence != null ? `${pct}%` : "—";
  setGauge(0);
  requestAnimationFrame(() => {
    setTimeout(() => setGauge(pct), 50);
  });

  const others = data.top_predictions || data.top3 || data.alternatives;
  if (Array.isArray(others) && others.length > 0) {
    altList.innerHTML = "";
    others
      .filter((o) => (o.breed || o.label) !== breed)
      .slice(0, 3)
      .forEach((o) => {
        const li = document.createElement("li");
        const name = o.breed || o.label || "—";
        const conf = normalizeConfidence(o.confidence ?? o.score);
        li.innerHTML = `<span>${name}</span><span>${conf != null ? Math.round(conf) + "%" : ""}</span>`;
        altList.appendChild(li);
      });
    altPredictions.hidden = altList.children.length === 0;
  } else {
    altPredictions.hidden = true;
  }

  showOnly("result");
}

function renderError(message) {
  errorMessage.textContent = message;
  showOnly("error");
}

// ============================================================
// Analyze flow
// ============================================================
async function analyzeCurrentFile() {
  if (!currentFile) return;
  setAnalyzing(true);

  const formData = new FormData();
  formData.append(FILE_FIELD_NAME, currentFile);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();
    setAnalyzing(false);
    renderResult(data);
  } catch (err) {
    setAnalyzing(false);
    renderError(
      "Couldn't reach the classifier. Make sure app.py is running on port 5000, then try again."
    );
    console.error(err);
  }
}

// ============================================================
// Event wiring
// ============================================================
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) showPreview(file);
});

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    showPreview(file);
  }
});

btnAnalyze.addEventListener("click", analyzeCurrentFile);
btnChange.addEventListener("click", resetToEmpty);
btnAgain.addEventListener("click", resetToEmpty);
btnRetry.addEventListener("click", () => {
  showOnly("scanner");
  if (currentFile) {
    statePreview.hidden = false;
    stateEmpty.hidden = true;
  } else {
    resetToEmpty();
  }
});

// initial state
resetToEmpty();