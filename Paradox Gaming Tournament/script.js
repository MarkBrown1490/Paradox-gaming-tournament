// Load saved team names or fallback to default
let teams = JSON.parse(localStorage.getItem("teams")) || [
  "Team 1", "Team 2", "Team 3", "Team 4", "Team 5",
  "Team 6", "Team 7", "Team 8", "Team 9", "Team 10"
];

const defaultMatches = [];

function saveTeams(newTeams) {
  teams = newTeams;
  localStorage.setItem("teams", JSON.stringify(teams));
  generateAndSaveMatchSchedule(); // regenerate if team names change
}

function generateRoundRobinMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push([i, j]); // store by index
    }
  }
  return matches;
}

function generateAndSaveMatchSchedule() {
  const matchups = generateRoundRobinMatches(teams);
  const savedMatches = matchups.map((match) => ({
    team1: match[0],
    team2: match[1],
    date: "",
    result: ""
  }));
  localStorage.setItem("matches", JSON.stringify(savedMatches));
}

// Setup page: Only allow team name input once
function loadSetup() {
  const container = document.getElementById("teamSetupContainer");
  container.innerHTML = "";

  const namesLocked = localStorage.getItem("teamsLocked") === "true";

  teams.forEach((team, idx) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = team;
    input.dataset.idx = idx;
    input.placeholder = `Team ${idx + 1}`;
    input.classList.add("team-input");
    input.disabled = namesLocked;
    container.appendChild(input);
  });

  if (!namesLocked) {
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Team Names (Lock Forever)";
    saveBtn.onclick = () => {
      const inputs = container.querySelectorAll("input.team-input");
      const newTeams = Array.from(inputs).map(i => i.value.trim() || `Team ${i.dataset.idx}`);
      saveTeams(newTeams);
      localStorage.setItem("teamsLocked", "true");
      alert("Teams saved and locked! They cannot be changed anymore.");
      location.reload();
    };
    container.appendChild(saveBtn);
  } else {
    const msg = document.createElement("p");
    msg.classList.add("white-text");
    msg.innerHTML = "✅ Team names are locked and cannot be changed.";
    container.appendChild(msg);
  }
}

// Match Schedule Page
function loadMatches() {
  const container = document.getElementById("matchesContainer");
  container.innerHTML = "";

  const savedMatches = JSON.parse(localStorage.getItem("matches")) || [];
  const matchups = generateRoundRobinMatches(teams);

  matchups.forEach((match, index) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("match-row");

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = savedMatches[index]?.date || "";
    dateInput.onchange = () => saveMatch(index, "date", dateInput.value);

    const team1 = teams[match[0]];
    const team2 = teams[match[1]];

    const label = document.createElement("span");
    label.textContent = `${team1} vs ${team2}`;
    label.classList.add("white-text");
    label.style.margin = "0 10px";

    const resultInput = document.createElement("select");
    resultInput.innerHTML = `
      <option value="">-- Result --</option>
      <option value="${team1}">${team1} wins</option>
      <option value="${team2}">${team2} wins</option>
    `;
    resultInput.value = savedMatches[index]?.result || "";
    resultInput.onchange = () => saveMatch(index, "result", resultInput.value);

    wrapper.appendChild(dateInput);
    wrapper.appendChild(label);
    wrapper.appendChild(resultInput);

    container.appendChild(wrapper);
  });
}

function saveMatch(index, key, value) {
  const savedMatches = JSON.parse(localStorage.getItem("matches")) || [];
  savedMatches[index] = savedMatches[index] || {
    team1: teams.indexOf(savedMatches[index]?.team1),
    team2: teams.indexOf(savedMatches[index]?.team2),
    date: "",
    result: ""
  };
  savedMatches[index][key] = value;
  localStorage.setItem("matches", JSON.stringify(savedMatches));
}

// Leaderboard Page
function loadLeaderboard() {
  const container = document.getElementById("leaderboardContainer");
  container.innerHTML = "";

  const savedMatches = JSON.parse(localStorage.getItem("matches")) || [];

  const leaderboard = teams.map(name => ({
    name,
    played: 0,
    wins: 0,
    losses: 0,
    points: 0
  }));

  savedMatches.forEach(match => {
    if (match && match.result) {
      const winnerIndex = leaderboard.findIndex(t => t.name === match.result);
      const team1 = teams[match.team1];
      const team2 = teams[match.team2];
      const loserName = team1 === match.result ? team2 : team1;
      const loserIndex = leaderboard.findIndex(t => t.name === loserName);

      if (winnerIndex >= 0) {
        leaderboard[winnerIndex].wins++;
        leaderboard[winnerIndex].played++;
        leaderboard[winnerIndex].points += 3;
      }
      if (loserIndex >= 0) {
        leaderboard[loserIndex].losses++;
        leaderboard[loserIndex].played++;
      }
    }
  });

  leaderboard.sort((a, b) => b.points - a.points || b.wins - a.wins);

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Position</th>
        <th>Team</th>
        <th>Played</th>
        <th>Wins</th>
        <th>Losses</th>
        <th>Points</th>
      </tr>
    </thead>
    <tbody>
      ${leaderboard.map((team, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${team.name}</td>
          <td>${team.played}</td>
          <td>${team.wins}</td>
          <td>${team.losses}</td>
          <td>${team.points}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.appendChild(table);
}

// Bracket Page (basic animated bracket generator)
function loadBracket() {
  const container = document.getElementById("bracketContainer");
  container.innerHTML = "";

  const savedMatches = JSON.parse(localStorage.getItem("matches")) || [];
  const winners = new Set(savedMatches.map(m => m.result).filter(r => r));

  // Display a simple vertical flow bracket
  const roundDiv = document.createElement("div");
  roundDiv.classList.add("bracket-round");

  teams.forEach(team => {
    const div = document.createElement("div");
    div.classList.add("bracket-team");
    div.textContent = team;
    if (winners.has(team)) div.classList.add("bracket-winner");
    roundDiv.appendChild(div);
  });

  container.appendChild(roundDiv);
}

// 🧠 Auto-load relevant function per page
window.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("setup")) loadSetup();
  else if (path.includes("matches")) loadMatches();
  else if (path.includes("leaderboard")) loadLeaderboard();
  else if (path.includes("bracket")) loadBracket();
});