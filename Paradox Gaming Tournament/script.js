const teams = [
  'Eclipse', 'Los Frogones', 'MaD Synergy', 'Origin', 'Oryx AetherFrost',
  'PG Bloodborn Legion', 'PG Shenanigans Syndicate', 'RAZE', 'UG Sköll', 'UG Vanguards'
];

const matches = [];
for (let i = 0; i < teams.length; i++) {
  for (let j = i + 1; j < teams.length; j++) {
    matches.push([teams[i], teams[j]]);
  }
}

function loadMatches() {
  const container = document.getElementById('matches');
  if (!container) return;
  container.innerHTML = '';
  matches.forEach((pair, index) => {
    const result = localStorage.getItem(`match-result-${index}`) || "";
    const date = localStorage.getItem(`match-date-${index}`) || "";
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.innerHTML = `
      <h3>${pair[0]} vs ${pair[1]}</h3>
      <label>Date:
        <input type="date" id="match-date-${index}" value="${date}">
      </label>
      <label>Result:
        <select id="match-result-${index}">
          <option value="">-- Select Winner --</option>
          <option value="${pair[0]}" ${result === pair[0] ? "selected" : ""}>${pair[0]}</option>
          <option value="${pair[1]}" ${result === pair[1] ? "selected" : ""}>${pair[1]}</option>
        </select>
      </label>
    `;
    container.appendChild(matchDiv);

    document.getElementById(`match-date-${index}`).addEventListener('change', (e) => {
      localStorage.setItem(`match-date-${index}`, e.target.value);
    });

    document.getElementById(`match-result-${index}`).addEventListener('change', (e) => {
      localStorage.setItem(`match-result-${index}`, e.target.value);
      loadLeaderboard();
    });
  });
}

function loadLeaderboard() {
  const container = document.getElementById('leaderboard');
  if (!container) return;

  const scores = {};
  teams.forEach(team => scores[team] = 0);
  matches.forEach((pair, index) => {
    const winner = localStorage.getItem(`match-result-${index}`);
    if (winner && scores[winner] !== undefined) {
      scores[winner]++;
    }
  });

  const sortedTeams = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  container.innerHTML = `
    <table>
      <tr><th>Team</th><th>Wins</th></tr>
      ${sortedTeams.map(([team, wins]) => `<tr><td>${team}</td><td>${wins}</td></tr>`).join("")}
    </table>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadMatches();
  loadLeaderboard();
});