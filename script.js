const testWrapper = document.querySelector(".test-wrapper");
const testArea = document.querySelector("#test-area");
const originText = document.querySelector("#origin-text p").innerHTML;
const resetButton = document.querySelector("#reset");
const theTimer = document.querySelector(".timer");

const originTextEl = document.querySelector("#origin-text p");
 
// text pool - from the little prince <3
const textPool = [
  "It is only with the heart that one can see rightly. What is essential is invisible to the eye. The eyes are blind, one must look with the heart.",
  "You become responsible forever for what you have tamed. You are responsible for your rose. She is unique in all the world, and you have wasted your time for her.",
  "If you tame me, then we shall need each other. To me, you will be unique in all the world. To you, I shall be unique in all the world.",
  "It is the time you have wasted for your rose that makes your rose so important. People have forgotten this truth, but you must not forget it. You are responsible for what you have tamed.",
  "All grown-ups were once children, although few of them remember it. They were all once little princes and little princesses. But grown-ups never understand anything by themselves.",
  "All men have stars, but they are not the same things for different people. For some, who are travelers, the stars are guides. For others they are no more than little lights in the sky.",
  "One runs the risk of weeping a little, if one lets himself be tamed. My life is very monotonous, but if you tame me, it will be as if the sun came to shine on my life."
];

// state variables
let timerInterval = null;   // holds setInterval reference
let startTime = null;       // Date.now() snapshot when typing started
let running = false;        // is timer active
let errorCount = 0;         // amount of typos in current session
let lastWasError = false;   // same mistake not counted again
let currentOrigin = "";     // active paragraph


// Add leading zero to numbers 9 or below (purely for aesthetics):
function pad(num) {
  return num <= 9 ? "0" + num : String(num);
}
 

// Run a standard minute/second/hundredths timer:
function runTimer() {
  let elapsed = Date.now() - startTime;
  let centiseconds = Math.floor((elapsed % 1000) / 10);
  let seconds = Math.floor((elapsed / 1000) % 60);
  let minutes = Math.floor(elapsed / 60000);
  theTimer.textContent = pad(minutes) + ":" + pad(seconds) + ":" + pad(centiseconds);
}

// Match the text entered with the provided text on the page:
function matchText() {
  let typed = testArea.value;
  let origin = currentOrigin;
 
  // text box border reset
  if (typed.length === 0) {
    testWrapper.style.borderColor = "grey";
    updateMetrics(0, 0);
    return;
  }
 
  let isCorrectSoFar = origin.startsWith(typed);
 
  if (isCorrectSoFar) {
    // blue box = correct (incomplete)
    testWrapper.style.borderColor = "blue";
    if (lastWasError) lastWasError = false;
 
    // green box = correct (complete)
    if (typed === origin) {
      let totalSeconds = stopTimer();
      testWrapper.style.borderColor = "green";
      testArea.disabled = true;
      saveScore(totalSeconds);
      renderScores();
    }
  } else {
    // red = error/typo
    testWrapper.style.borderColor = "red";
    if (!lastWasError) {
      errorCount++;
      lastWasError = true;
    }
  }
 
  // update WPM & error count display
  let elapsedSeconds = running ? (Date.now() - startTime) / 1000 : 0;
  updateMetrics(typed.length, elapsedSeconds);
}

// Start the timer:
function startTimer() {
  if (!running) {
    startTime = Date.now();
    running = true;
    timerInterval = setInterval(runTimer, 10);
  }
}
 
// timer stop and lapse
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  running = false;
  return (Date.now() - startTime) / 1000;
}
 
// WPM and error count
function updateMetrics(charCount, elapsedSeconds) {
  let wpmEl = document.querySelector("#wpm");
  let errorEl = document.querySelector("#error-count");
  if (!wpmEl || !errorEl) return;
 
  if (elapsedSeconds > 0) {
    let wpm = Math.round((charCount / 5) / (elapsedSeconds / 60));
    wpmEl.textContent = wpm;
  } else {
    wpmEl.textContent = "0";
  }
  errorEl.textContent = errorCount;
}
 
// score > localStorage (top 3)
function saveScore(totalSeconds) {
  let scores = JSON.parse(localStorage.getItem("typingScores")) || [];
  scores.push(parseFloat(totalSeconds.toFixed(2)));
  scores.sort((a, b) => a - b);   // + sort ascending (fastest first)
  scores = scores.slice(0, 3);     // + keep only top 3
  localStorage.setItem("typingScores", JSON.stringify(scores));
}
 
// retrieve and render 
function renderScores() {
  let scoreList = document.querySelector("#score-list");
  if (!scoreList) return;
 
  let scores = JSON.parse(localStorage.getItem("typingScores")) || [];
  if (scores.length === 0) {
    scoreList.innerHTML = "<li>No scores yet. Complete a test!</li>";
    return;
  }
 
  scoreList.innerHTML = scores.map((s, i) => {
    let mins = Math.floor(s / 60);
    let secs = (s % 60).toFixed(2);
    return `<li>#${i + 1} — ${pad(mins)}:${pad(Math.floor(secs))}.${String(secs).split(".")[1]}</li>`;
  }).join("");
}
 
// randomize paragraph pool
function getRandomText() {
  let pool = textPool.filter(t => t !== currentOrigin);
  return pool[Math.floor(Math.random() * pool.length)];
}
 
// dynamic inject WPM/error bar/top 3
function buildExtraUI() {
  let metaSection = document.querySelector(".meta");
  let metricsDiv = document.createElement("div");
  metricsDiv.id = "metrics";
  metricsDiv.innerHTML = `
    <span>WPM: <strong id="wpm">0</strong></span>
    <span style="margin-left:1.5em;">Errors: <strong id="error-count">0</strong></span>
  `;
  metricsDiv.style.cssText = "font-size:1.1em; display:flex; align-items:center; flex-wrap:wrap; gap:.5em;";
  metaSection.appendChild(metricsDiv);
 
  let scoresSection = document.createElement("section");
  scoresSection.id = "top-scores";
  scoresSection.innerHTML = `
    <h2 style="margin-top:1.5em;"> Top 3 Scores! </h2>
    <ol id="score-list"></ol>
  `;
  scoresSection.style.cssText = "max-width:550px; margin:0 auto 3em; padding:0 2em;";
  document.querySelector(".main").appendChild(scoresSection);
 
  renderScores();
}
 
// Reset everything:
function resetTest() {
  clearInterval(timerInterval);
  timerInterval = null;
  running = false;
  startTime = null;
  errorCount = 0;
  lastWasError = false;
 
  testArea.value = "";
  testArea.disabled = false;
  testWrapper.style.borderColor = "grey";
  theTimer.textContent = "00:00:00";
 
  // load a new random paragraph on reset
  currentOrigin = getRandomText();
  originTextEl.textContent = currentOrigin;
 
  updateMetrics(0, 0);
}


// Event listeners for keyboard input and the reset button:
testArea.addEventListener("keydown", function () {
  // timer starts when user types first character
  if (!running && testArea.value.length === 0) {
    startTimer();
  }
});
 
testArea.addEventListener("input", function () {
  // check
  matchText();
});
 
resetButton.addEventListener("click", resetTest);
 
document.addEventListener("DOMContentLoaded", function () {
  currentOrigin = getRandomText();
  originTextEl.textContent = currentOrigin;
  renderScores();
});