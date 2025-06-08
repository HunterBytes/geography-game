// All your game state variables
let countries = [];
let currentCountry = null;
let usedCountries = [];
let score = 0;
let streak = 0;
let totalTimeLeft = 180;
let gameTimerInterval = null;
let playerName = "";
let hintUsed = false;
let hardMode = false;
let selectedRegion = "all";
let gameDuration = 180;
let gameEnded = false;

const countryEl = document.getElementById("country-name");
const flagEl = document.getElementById("flag");
const inputEl = document.getElementById("capital-input");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const hintBtn = document.getElementById("hint-button");

// 🔊 Sound effects
const introMusic = new Audio("music/retro-game-music-245230.mp3");
introMusic.loop = true;
introMusic.volume = 0.4;

const gameMusic = new Audio("music/best-game-console-301284.mp3");
gameMusic.loop = true;
gameMusic.volume = 0.4;

const gameOverMusic = new Audio("music/game-over-252897.mp3");
gameOverMusic.volume = 0.5;

const correctSound = new Audio("music/zapsplat_multimedia_game_sound_coin_collect_arcade_retro_simple_bright_001_114144.mp3");
correctSound.volume = 0.7;

const wrongSound = new Audio("music/zapsplat_multimedia_game_sound_negative_buzz_incorrect_wrong_113066.mp3");
wrongSound.volume = 0.6;

// 🧠 Utility Functions
function cleanRegion(region) {
  return region.trim().toLowerCase();
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[\u0300-\u036f]/g, "");
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 🏠 Welcome Screen
function showWelcome() {
  document.getElementById("about-screen").classList.add("hidden");
  document.getElementById("welcome-screen").classList.remove("hidden");

  gameOverMusic.pause();
  gameOverMusic.currentTime = 0;
  introMusic.play();

  loadLeaderboard();
}

// 🟢 Game Start
function startGame() {
  playerName = document.getElementById("player-name").value.trim();
  if (!playerName) return alert("Please enter your name!");

  introMusic.pause();
  introMusic.currentTime = 0;
  gameMusic.play();

  const selectedTime = document.querySelector('input[name="time"]:checked').value;
  totalTimeLeft = parseInt(selectedTime);
  gameDuration = totalTimeLeft;
  hardMode = document.getElementById("hard-mode").checked;
  selectedRegion = document.getElementById("region-select").value;

  score = 0;
  streak = 0;
  hintUsed = false;
  usedCountries = [];
  scoreEl.innerText = score;
  hintBtn.disabled = false;
  document.getElementById("play-again")?.remove();
  flagEl.style.display = "block";
  inputEl.style.display = "inline-block";
  document.getElementById("submit-button").style.display = "inline-block";
  document.getElementById("quit-button").style.display = "inline-block";
  document.getElementById("result")?.remove();

  document.getElementById("welcome-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  fetch("https://restcountries.com/v3.1/all?fields=name,capital,flags,independent,region")
    .then(res => res.json())
    .then(data => {
      countries = data.filter(c =>
        c.capital && c.capital.length > 0 &&
        c.flags && c.flags.png &&
        c.independent === true &&
        (selectedRegion === "all" || cleanRegion(c.region) === cleanRegion(selectedRegion))
      );

      countries.push(
        { name: { common: "South Africa" }, capital: ["Pretoria", "Cape Town", "Bloemfontein"], flags: { png: "https://flagcdn.com/w320/za.png" }, independent: true, region: "Africa" },
        { name: { common: "Sri Lanka" }, capital: ["Sri Jayawardenepura Kotte", "Colombo"], flags: { png: "https://flagcdn.com/w320/lk.png" }, independent: true, region: "Asia" },
        { name: { common: "Bolivia" }, capital: ["Sucre", "La Paz"], flags: { png: "https://flagcdn.com/w320/bo.png" }, independent: true, region: "Americas" },
        { name: { common: "Netherlands" }, capital: ["Amsterdam", "The Hague"], flags: { png: "https://flagcdn.com/w320/nl.png" }, independent: true, region: "Europe" },
        { name: { common: "Benin" }, capital: ["Porto-Novo", "Cotonou"], flags: { png: "https://flagcdn.com/w320/bj.png" }, independent: true, region: "Africa" },
        { name: { common: "Malaysia" }, capital: ["Kuala Lumpur", "Putrajaya"], flags: { png: "https://flagcdn.com/w320/my.png" }, independent: true, region: "Asia" },
        { name: { common: "Eswatini" }, capital: ["Mbabane", "Lobamba"], flags: { png: "https://flagcdn.com/w320/sz.png" }, independent: true, region: "Africa" },
        { name: { common: "Tanzania" }, capital: ["Dodoma", "Dar es Salaam"], flags: { png: "https://flagcdn.com/w320/tz.png" }, independent: true, region: "Africa" },
        { name: { common: "Ivory Coast" }, capital: ["Yamoussoukro", "Abidjan"], flags: { png: "https://flagcdn.com/w320/ci.png" }, independent: true, region: "Africa" }
      );

      shuffle(countries);
      newRound();

      gameTimerInterval = setInterval(() => {
        totalTimeLeft--;
        timerEl.textContent = totalTimeLeft;
        if (totalTimeLeft <= 0) {
          clearInterval(gameTimerInterval);
          endGame();
        }
      }, 1000);
    })
    .catch(err => {
      countryEl.innerText = "⚠️ Could not load data.";
      console.error(err);
    });
}

// 📥 Answer Submission
function checkAnswer() {
  const userAnswer = removeAccents(inputEl.value.trim().toLowerCase());
  const correctAnswers = currentCountry.capital.map(c => removeAccents(c.toLowerCase()));

  if (correctAnswers.includes(userAnswer)) {
    streak++;
    score++;
    correctSound.play();
    if (streak % 5 === 0) {
      score += 2;
      showConfetti();
    }
    scoreEl.innerText = score;
    showResult("✅ Correct!");
    gsap.from("#score", { scale: 1.5, duration: 0.3, ease: "bounce" });
  } else {
    streak = 0;
    wrongSound.play();
    showResult(`❌ Wrong! One answer is ${currentCountry.capital[0]}`);
  }

  setTimeout(newRound, 2000);
}

function newRound() {
  inputEl.value = "";
  document.getElementById("result")?.remove();

  if (usedCountries.length === countries.length) {
    endGame();
    return;
  }

  const remaining = countries.filter(c => !usedCountries.includes(c.name.common));
  currentCountry = remaining[Math.floor(Math.random() * remaining.length)];
  usedCountries.push(currentCountry.name.common);

  countryEl.innerText = hardMode ? "" : currentCountry.name.common;
  flagEl.src = currentCountry.flags.png;
  flagEl.alt = `${currentCountry.name.common} flag`;

  gsap.from("#flag", { opacity: 0, y: -40, duration: 0.5 });
  gsap.from("#country-name", { opacity: 0, x: -100, duration: 0.5 });
}

function useHint() {
  if (hintUsed) return;
  hintUsed = true;
  const firstLetter = currentCountry.capital[0][0];
  showResult(`💡 Hint: Capital starts with "${firstLetter.toUpperCase()}"`);
  hintBtn.disabled = true;
}

function showResult(message) {
  let resultEl = document.getElementById("result");
  if (!resultEl) {
    resultEl = document.createElement("p");
    resultEl.id = "result";
    document.getElementById("game-screen").appendChild(resultEl);
  }
  resultEl.innerText = message;
  gsap.from("#result", { opacity: 0, duration: 0.3 });
}

function showConfetti() {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js";
  script.onload = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };
  document.body.appendChild(script);
}

function endGame() {
  gameMusic.pause();
  gameOverMusic.play();
  clearInterval(gameTimerInterval);

  countryEl.innerText = "🏁 Time's Up!";
  flagEl.style.display = "none";
  inputEl.style.display = "none";
  hintBtn.style.display = "none";
  document.getElementById("submit-button").style.display = "none";
  document.getElementById("quit-button").style.display = "none";

  let resultEl = document.getElementById("result");
  if (!resultEl) {
    resultEl = document.createElement("div");
    resultEl.id = "result";
    document.getElementById("game-screen").appendChild(resultEl);
  }

  resultEl.innerHTML = `<h2>🎉 Game Over!</h2><p>Your final score is <strong>${score}</strong></p>`;
  resultEl.style.padding = "20px";
  resultEl.style.borderRadius = "16px";
  resultEl.style.backgroundColor = "#fefefe";
  resultEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
  resultEl.style.marginTop = "20px";
  resultEl.style.fontSize = "1.2rem";

  showConfetti();

  const leaderboard = JSON.parse(localStorage.getItem("geogame-scores") || "[]");
  leaderboard.push({ name: playerName, score });
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("geogame-scores", JSON.stringify(leaderboard.slice(0, 5)));

  const playBtn = document.createElement("button");
  playBtn.id = "play-again";
  playBtn.innerText = "🔁 Play Again";
  playBtn.style.marginTop = "16px";
  playBtn.onclick = () => location.reload();
  document.getElementById("game-screen").appendChild(playBtn);

  saveScore(playerName, score);
}

function quitGame() {
  gameMusic.pause();
  clearInterval(gameTimerInterval);

  // 💥 Prevent saving on quit
  score = 0;
  gameDuration = 0;

  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("welcome-screen").classList.remove("hidden");
  introMusic.play();
  loadLeaderboard();
}


// 🧠 Save score to Vercel
async function saveScore(name, score) {
  if (score === 0 || gameDuration === 0) return; // ❌ Don't save if quit early

  try {
    await fetch("https://capcatcher.vercel.app/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score, duration: gameDuration })
    });
  } catch (err) {
    console.error("Failed to save score:", err);
  }
}

// 🌍 Load leaderboard with sections
async function loadLeaderboard() {
  const durations = [60, 180];
  const leaderboardContainer = document.getElementById("leaderboard");
  leaderboardContainer.innerHTML = "";

  for (const duration of durations) {
    try {
      const res = await fetch(`https://capcatcher.vercel.app/api/leaderboard?duration=${duration}`);
      const scores = await res.json();

      const section = document.createElement("div");
      section.innerHTML = `<h4>${duration}s Leaderboard:</h4>` +
        scores.slice(0, 5).map((s, i) => `<p>${i + 1}. ${s.name}: ${s.score}</p>`).join("");

      leaderboardContainer.appendChild(section);
    } catch (err) {
      console.error(`Leaderboard load error for ${duration}s:`, err);
    }
  }
}

// ⌨️ Event Listeners
inputEl.addEventListener("keyup", e => {
  if (e.key === "Enter") checkAnswer();
});
document.getElementById("submit-button").addEventListener("click", checkAnswer);
document.getElementById("player-name").addEventListener("keyup", e => {
  if (e.key === "Enter") startGame();
});
document.getElementById("toggle-dark").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
document.getElementById("quit-button").addEventListener("click", quitGame);

// 🚀 Auto-load leaderboard
window.onload = loadLeaderboard;
