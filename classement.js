import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  loadRanking();
});

// Variables globales
let currentUser = null;
let rankings = [];

// Vérifier l'authentification
function checkAuthentication() {
  fetch(`${API_URL}/me`, {
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    if (data.username) {
      currentUser = data.username;
      document.getElementById("currentUser").textContent = currentUser;
    } else {
      window.location.href = "/login.html";
    }
  })
  .catch(err => {
    console.error("Erreur d'authentification:", err);
    window.location.href = "/login.html";
  });
}

// Charger le classement
function loadRanking() {
  fetch(`${API_URL}/ranking`, {
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      rankings = data.data;
      updateStats(rankings);
      displayPodium(rankings);
      displayRankingTable(rankings);
    } else {
      console.error("Erreur:", data.message);
    }
  })
  .catch(err => {
    console.error("Erreur:", err);
  });
}

// Mettre à jour les statistiques générales
function updateStats(rankings) {
  // Nombre total de joueurs
  document.getElementById("totalPlayers").textContent = rankings.length;
  
  // Position de l'utilisateur
  const userIndex = rankings.findIndex(user => user.username === currentUser);
  document.getElementById("userRank").textContent = userIndex !== -1 ? (userIndex + 1) : "-";
}

// Afficher le podium (top 3)
function displayPodium(rankings) {
  const podiumContainer = document.getElementById("podium");
  podiumContainer.innerHTML = "";
  
  // S'assurer qu'il y a au moins un utilisateur dans le classement
  if (rankings.length === 0) {
    podiumContainer.innerHTML = "<p>Aucun joueur classé pour le moment.</p>";
    return;
  }
  
  // Définir l'ordre pour le podium (2e, 1er, 3e)
  const positions = [
    { index: 1, class: "podium-step-2" },
    { index: 0, class: "podium-step-1" },
    { index: 2, class: "podium-step-3" }
  ];
  
  // Créer chaque marche du podium
  positions.forEach(pos => {
    if (rankings.length > pos.index) {
      const user = rankings[pos.index];
      const position = pos.index + 1;
      
      const step = document.createElement("div");
      step.className = `podium-step ${pos.class}`;
      
      step.innerHTML = `
        <div class="podium-user">
          <div class="podium-name">${user.username}</div>
          <div class="podium-points">${user.points} pts</div>
        </div>
        <div class="podium-block podium-block-${position}">
          <strong>${position}</strong>
        </div>
      `;
      
      podiumContainer.appendChild(step);
    }
  });
}

// Afficher le tableau de classement complet
function displayRankingTable(rankings) {
  const tableBody = document.querySelector("#rankingTable tbody");
  tableBody.innerHTML = "";
  
  rankings.forEach((user, index) => {
    const position = index + 1;
    const row = document.createElement("tr");
    
    // Mettre en évidence l'utilisateur actuel
    if (user.username === currentUser) {
      row.classList.add("current-user");
    }
    
    // Calculer le taux de réussite simplifié (sans commentaire)
    const successRate = calculateSuccessRate(user);
    
    row.innerHTML = `
      <td>
        ${position <= 3 ? 
          `<span class="medal ${position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze'}">${position}</span>` : 
          position}
      </td>
      <td>${user.username}</td>
      <td><strong>${user.points}</strong></td>
      <td>${user.total_predictions}</td>
      <td>
        <span class="exact-scores">${user.exact_scores}</span>
        ${user.exact_scores > 0 ? `<small>(${Math.round((user.exact_scores / user.total_predictions) * 100)}%)</small>` : ''}
      </td>
      <td>
        <span class="correct-results">${user.correct_results}</span>
        ${user.correct_results > 0 ? `<small>(${Math.round((user.correct_results / user.total_predictions) * 100)}%)</small>` : ''}
      </td>
      <td>
        <div class="success-rate">
          <span class="rate-text">${successRate.percentage}%</span>
          <div class="rate-bar">
            <div class="rate-fill" style="width: ${successRate.percentage}%"></div>
          </div>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Si aucun utilisateur n'est dans le classement
  if (rankings.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7">Aucun joueur classé pour le moment.</td>`;
    tableBody.appendChild(row);
  }
}

// Calculer le taux de réussite sans description
function calculateSuccessRate(user) {
  if (user.total_predictions === 0) {
    return {
      percentage: 0
    };
  }
  
  const exactScores = user.exact_scores || 0;
  const correctResults = user.correct_results || 0;
  const totalPredictions = user.total_predictions || 0;
  
  const successfulPredictions = exactScores + correctResults;
  const percentage = Math.round((successfulPredictions / totalPredictions) * 100);
  
  return {
    percentage
  };
}