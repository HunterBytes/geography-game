let countries = [];
let currentCountry = null;
let score = 0;
let totalTimeLeft = 180;
let gameTimerInterval = null;
let playerName = "";

const countryEl = document.getElementById("country-name");
const flagEl = document.getElementById("flag");
const inputEl = document.getElementById("capital-input");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");

function startGame() {
  playerName = document.getElementById("player-name").value.trim();
  if (!playerName) return alert("Please enter your name!");

  document.getElementById("welcome-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  fetch("https://restcountries.com/v3.1/all?fields=name,capital,flags,independent")
    .then(res => res.json())
    .then(data => {
      countries = data.filter(c =>
        c.capital && c.capital.length > 0 &&
        c.flags && c.flags.png &&
        c.independent === true
      );
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

function newRound() {
  inputEl.value = "";
  document.getElementById("result")?.remove();

  const randomIndex = Math.floor(Math.random() * countries.length);
  currentCountry = countries[randomIndex];

  countryEl.innerText = currentCountry.name.common;
  flagEl.src = currentCountry.flags.png;
  flagEl.alt = `${currentCountry.name.common} flag`;

  gsap.from("#flag", { opacity: 0, y: -40, duration: 0.5 });
  gsap.from("#country-name", { opacity: 0, x: -100, duration: 0.5 });
}

function checkAnswer() {
  const userAnswer = inputEl.value.trim().toLowerCase();
  const correct = currentCountry.capital[0].toLowerCase();

  if (userAnswer === correct) {
    score++;
    scoreEl.innerText = score;
    showResult("✅ Correct!");
    gsap.from("#score", { scale: 1.5, duration: 0.3, ease: "bounce" });
  } else {
    showResult(`❌ Wrong! It's ${currentCountry.capital[0]}`);
  }

  setTimeout(newRound, 2000);
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

inputEl.addEventListener("keyup", e => {
  if (e.key === "Enter") checkAnswer();
});

document.getElementById("player-name").addEventListener("keyup", e => {
  if (e.key === "Enter") startGame();
});

function endGame() {
  countryEl.innerText = "🏁 Time's Up!";
  flagEl.style.display = "none";
  inputEl.style.display = "none";
  document.querySelector("button").style.display = "none";
  showResult(`Your final score is ${score}`);
}

window.addEventListener("DOMContentLoaded", () => {
  const highscores = JSON.parse(localStorage.getItem("geogame-scores") || "[]");
  const list = document.getElementById("highscores");
  highscores.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} — ${entry.score}`;
    list.appendChild(li);
  });
});

window.addEventListener("beforeunload", () => {
  const leaderboard = JSON.parse(localStorage.getItem("geogame-scores") || "[]");
  leaderboard.push({ name: playerName, score });
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("geogame-scores", JSON.stringify(leaderboard.slice(0, 5)));
});
