// Initialize teams and results from localStorage or defaults
let teams = JSON.parse(localStorage.getItem("teams")) || [
  "Team 1", "Team 2", "Team 3", "Team 4", "Team 5",
  "Team 6", "Team 7", "Team 8", "Team 9", "Team 10"
];

let results = JSON.parse(localStorage.getItem("results")) || {};

// Save teams to localStorage
function saveTeams(newTeams) {
  teams = newTeams;
  localStorage.setItem("teams", JSON.stringify(teams));
}

// Save results to localStorage
function saveResults(newResults) {
  results = newResults;
  localStorage.setItem("results", JSON.stringify(results));
}

// === SETUP PAGE FUNCTIONS ===
function loadSetup() {
  const container = document.getElementById("teamSetupContainer");
  container.innerHTML = "";

  // Check if names are locked (already saved once)
  const namesLocked = localStorage.getItem("teamsLocked") === "true";

  teams.forEach((team, idx) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = team;
    input.dataset.idx = idx;
    input.placeholder = `Team ${idx + 1}`;
    input.classList.add("team-input");
    input.disabled = namesLocked; // disable if already saved
    container.appendChild(input);
  });

  if (!namesLocked) {
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Team Names (Lock Forever)";
    saveBtn.onclick = () => {
      const inputs = container.querySelectorAll("input.team-input");
      const newTeams = Array.from(inputs).map(i => i.value.trim() || `Team ${i.dataset.idx}`);
      saveTeams(newTeams);
      localStorage.setItem("teamsLocked", "true"); // prevent changes
      alert("Teams saved and locked! They cannot be changed anymore.");
      location.reload(); // refresh to reflect locked state
    };
    container.appendChild(saveBtn);
  } else {
    const lockedMsg = document.createElement("p");
    lockedMsg.classList.add("white-text");
    lockedMsg.innerHTML = "✅ Team names have been set and locked. You cannot change them.";
    container.appendChild(lockedMsg);
  }
}

// === MATCHES PAGE FUNCTIONS ===
function generateMatches() {
  // Round-robin all pairings
  const matchList = [];
  for(let i = 0; i < teams.length; i++) {
    for(let j = i + 1; j < teams.length; j++) {
      matchList.push(`${teams[i]} vs ${teams[j]}`);
    }
  }
  return matchList;
}

function loadMatches() {
  const tbody = document.querySelector("#matchesTable tbody");
  tbody.innerHTML = "";

  const matches = generateMatches();

  matches.forEach((match, idx) => {
    const tr = document.createElement("tr");

    // Cells: #, Match, Date input, Winner select, Action (Save)
    const matchKey = match.replace(/\s+/g, "_");

    // Match number
    const tdNum = document.createElement("td");
    tdNum.textContent = idx + 1;

    // Match teams
    const tdMatch = document.createElement("td");
    tdMatch.textContent = match;

    // Date input
    const tdDate = document.createElement("td");
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    // Load saved date if any
    const savedDate = localStorage.getItem(matchKey + "_date");
    if(savedDate) dateInput.value = savedDate;
    dateInput.onchange = () => {
      localStorage.setItem(matchKey + "_date", dateInput.value);
    }
    tdDate.appendChild(dateInput);

    // Winner select
    const tdWinner = document.createElement("td");
    const winnerSelect = document.createElement("select");
    const optionEmpty = document.createElement("option");
    optionEmpty.value = "";
    optionEmpty.textContent = "Select Winner";
    winnerSelect.appendChild(optionEmpty);

    teams.forEach(team => {
      if(match.includes(team)) {
        const opt = document.createElement("option");
        opt.value = team;
        opt.textContent = team;
        winnerSelect.appendChild(opt);
      }
    });
    winnerSelect.value = results[match] || "";
    tdWinner.appendChild(winnerSelect);

    // Action: Save button
    const tdAction = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save Result";
    saveBtn.onclick = () => {
      if(winnerSelect.value === "") {
        alert("Please select a winner");
        return;
      }
      results[match] = winnerSelect.value;
      saveResults(results);
      alert("Result saved!");
      // Trigger live leaderboard update if open on another tab
      window.dispatchEvent(new Event('storage'));
    };
    tdAction.appendChild(saveBtn);

    tr.appendChild(tdNum);
    tr.appendChild(tdMatch);
    tr.appendChild(tdDate);
    tr.appendChild(tdWinner);
    tr.appendChild(tdAction);

    tbody.appendChild(tr);
  });
}

// === LEADERBOARD PAGE FUNCTIONS ===
function loadLeaderboard() {
  updateLeaderboard();

  // Listen for storage changes to update live
  window.addEventListener("storage", (e) => {
    if(e.key === "results") {
      updateLeaderboard();
    }
  });
}

function updateLeaderboard() {
  const tbody = document.querySelector("#leaderboardTable tbody");
  if(!tbody) return;

  tbody.innerHTML = "";

  const stats = {};
  teams.forEach(team => stats[team] = { played: 0, wins: 0, losses: 0 });

  const storedResults = JSON.parse(localStorage.getItem("results") || "{}");

  Object.keys(storedResults).forEach(match => {
    const winner = storedResults[match];
    const [team1, , team2] = match.split(" vs ");
    const loser = winner === team1 ? team2 : team1;
    stats[team1].played++;
    stats[team2].played++;
    stats[winner].wins++;
    stats[loser].losses++;
  });

  const sorted = Object.entries(stats).sort((a,b) => b[1].wins - a[1].wins);

  sorted.forEach(([team, s]) => {
    const winPct = s.played ? ((s.wins / s.played) * 100).toFixed(1) + "%" : "0%";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${team}</td>
      <td>${s.played}</td>
      <td>${s.wins}</td>
      <td>${s.losses}</td>
      <td>${winPct}</td>
    `;
    tbody.appendChild(tr);
  });
}

// === BRACKET PAGE FUNCTIONS ===
function loadBracket() {
  const bracket = document.getElementById("bracketContainer");
  if(!bracket) return;

  bracket.innerHTML = "";

  const winCount = {};
  teams.forEach(team => winCount[team] = 0);

  const storedResults = JSON.parse(localStorage.getItem("results") || "{}");
  Object.values(storedResults).forEach(winner => {
    if(winner) winCount[winner]++;
  });

  const sorted = Object.entries(winCount).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([team, wins], index) => {
    const div = document.createElement("div");
    div.className = "bracket-slot";
    div.style.animationDelay = `${index * 0.1}s`;
    div.innerHTML = `<strong>${team}</strong><br>Wins: ${wins}`;
    bracket.appendChild(div);
  });
}

// === On Page Load Dispatcher ===
document.addEventListener("DOMContentLoaded", () => {
  if(location.pathname.includes("setup.html")) {
    loadSetup();
  } else if(location.pathname.includes("matches.html")) {
    loadMatches();
  } else if(location.pathname.includes("leaderboard.html")) {
    loadLeaderboard();
  } else if(location.pathname.includes("bracket.html")) {
    loadBracket();
  }
});