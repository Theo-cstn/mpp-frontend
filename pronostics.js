import { API_URL, WS_URL } from './config.mjs';
// pronostics.js
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    setupTabs();
    setupFilters();
    loadLeaguesForFilters();
    loadUpcomingMatches();
    loadMyPredictions();
  });
  
  let currentUser = null;
  
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
  
  // Configuration des onglets
  function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Retirer la classe active de tous les onglets
        tabs.forEach(t => t.classList.remove('active'));
        // Ajouter la classe active à l'onglet cliqué
        tab.classList.add('active');
        
        // Cacher tout le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
          content.style.display = 'none';
        });
        
        // Afficher le contenu correspondant
        const tabId = tab.dataset.tab;
        document.getElementById(tabId).style.display = 'block';
        
        // Recharger les données si nécessaire
        if (tabId === 'upcoming') {
          loadUpcomingMatches();
        } else if (tabId === 'my-predictions') {
          loadMyPredictions();
        }
      });
    });
  }
  
  // Charger les matchs à venir
  async function loadUpcomingMatches(leagueId = '', round = '') {
    try {
      let url = `${API_URL}/matches/upcoming`;
      const params = new URLSearchParams();
      
      if (leagueId) params.append('league_id', leagueId);
      if (round) params.append('round', round);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url, {
        credentials: "include"  
      });
      const data = await response.json();
      
      if (data.success) {
        await displayUpcomingMatches(data.data);
      }
    } catch (err) {
      console.error("Erreur:", err);
    }
  }
  
  // Afficher les matchs à venir
  async function displayUpcomingMatches(matches) {
    const container = document.getElementById('upcomingMatches');
    container.innerHTML = '';
    
    // Récupérer les pronostics de l'utilisateur
    try {
      const response = await fetch(`${API_URL}/predictions/mine`, {
        credentials: "include"
      });
      const data = await response.json();
      const userPredictions = data.success ? data.data : [];
      
      // Filtrer les matchs pour lesquels l'utilisateur n'a pas encore fait de pronostic
      const matchesWithoutPrediction = matches.filter(match => 
        !userPredictions.some(p => p.match_id === match.id)
      );
      
      if (matchesWithoutPrediction.length === 0) {
        container.innerHTML = '<p>Aucun match à venir sans pronostic. Consultez l\'onglet "Mes pronostics" pour voir vos pronostics existants.</p>';
        return;
      }
      
      matchesWithoutPrediction.forEach(match => {
        const matchCard = createMatchCard(match);
        container.appendChild(matchCard);
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des pronostics:", error);
      // En cas d'erreur, afficher tous les matchs
      matches.forEach(match => {
        const matchCard = createMatchCard(match);
        container.appendChild(matchCard);
      });
    }
  }
  
  // Créer une carte de match (simplifié pour les matchs sans pronostic)
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const matchDate = new Date(match.match_date).toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    card.innerHTML = `
      <div class="match-header">
        <div class="match-info">
          <div><strong>${match.league_name}</strong> - ${match.round || 'N/A'}</div>
          <div>${matchDate}</div>
        </div>
        <span class="match-status status-scheduled">À venir</span>
      </div>
      
      <div class="teams">
        <div class="team">${match.home_team_name}</div>
        <div class="vs">VS</div>
        <div class="team">${match.away_team_name}</div>
      </div>
      
      <div class="prediction-form" id="form-${match.id}">
        <input type="number" class="score-input" id="home-${match.id}" min="0" value="0">
        <span>-</span>
        <input type="number" class="score-input" id="away-${match.id}" min="0" value="0">
        <button class="btn btn-primary" onclick="submitPrediction(${match.id})">
          Valider
        </button>
      </div>
      <p style="font-size: 0.9rem; color: #666; text-align: center; margin-top: 10px;">
        ⚠️ Une fois validé, vous pourrez modifier votre pronostic jusqu'au début du match
      </p>
    `;
    
    return card;
  }
  
  
  // Soumettre un pronostic
  function submitPrediction(matchId) {
    const homeScore = parseInt(document.getElementById(`home-${matchId}`).value);
    const awayScore = parseInt(document.getElementById(`away-${matchId}`).value);
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showError("Veuillez entrer des scores valides");
      return;
    }
    
    const predictionData = {
      match_id: matchId,
      home_score_prediction: homeScore,
      away_score_prediction: awayScore
    };
    
    fetch(`${API_URL}/predictions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(predictionData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess("Pronostic enregistré avec succès !");
        loadUpcomingMatches();
        loadMyPredictions();
      } else {
        showError(data.message);
      }
    })
    .catch(err => {
      console.error("Erreur:", err);
      showError("Erreur lors de l'enregistrement du pronostic");
    });
  }
  
  // Charger mes pronostics
  function loadMyPredictions(leagueId = '', round = '') {
    fetch(`${API_URL}/predictions/mine`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        let filteredPredictions = data.data;
        
        // Appliquer les filtres côté client
        if (leagueId) {
          filteredPredictions = filteredPredictions.filter(p => 
            p.league_id === parseInt(leagueId)
          );
        }
        
        if (round) {
          filteredPredictions = filteredPredictions.filter(p => 
            p.round === round
          );
        }
        
        displayMyPredictions(filteredPredictions);
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Afficher mes pronostics
  function displayMyPredictions(predictions) {
    const container = document.getElementById('myPredictions');
    container.innerHTML = '';
    
    if (predictions.length === 0) {
      container.innerHTML = '<p>Vous n\'avez pas encore fait de pronostics.</p>';
      return;
    }
    
    predictions.forEach(prediction => {
      const predictionCard = createPredictionCard(prediction);
      container.appendChild(predictionCard);
    });
  }
  
  // Créer une carte de pronostic
function createPredictionCard(prediction) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const matchDate = new Date(prediction.match_date).toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let statusClass = prediction.match_status === 'finished' ? 'status-finished' : 'status-scheduled';
    let statusText = prediction.match_status === 'finished' ? 'Terminé' : 'À venir';
    
    let resultSection = '';
    if (prediction.match_status === 'finished' && prediction.actual_home_score !== undefined) {
      resultSection = `
        <div class="match-result">
          Score final : ${prediction.actual_home_score} - ${prediction.actual_away_score}
        </div>
        <div class="points-earned">
          Points gagnés : ${prediction.points_earned}
        </div>
      `;
    }
    
    let predictionSection = '';
    if (prediction.match_status === 'scheduled') {
      predictionSection = `
        <div class="prediction-info" id="info-${prediction.match_id}">
          Votre pronostic : ${prediction.home_score_prediction} - ${prediction.away_score_prediction}
          <button class="btn btn-success" onclick="switchToModifyMode(${prediction.match_id}, ${prediction.id}, ${prediction.home_score_prediction}, ${prediction.away_score_prediction})">
            Modifier
          </button>
        </div>
        <div class="prediction-form" id="form-${prediction.match_id}" style="display: none;">
          <input type="number" class="score-input" id="home-${prediction.match_id}" 
                 min="0" value="${prediction.home_score_prediction}">
          <span>-</span>
          <input type="number" class="score-input" id="away-${prediction.match_id}" 
                 min="0" value="${prediction.away_score_prediction}">
          <button class="btn btn-success" onclick="updatePrediction(${prediction.id}, ${prediction.match_id})">
            Confirmer
          </button>
          <button class="btn btn-secondary" onclick="cancelModify(${prediction.match_id}, ${prediction.home_score_prediction}, ${prediction.away_score_prediction})">
            Annuler
          </button>
        </div>
      `;
    } else {
      predictionSection = `
        <div class="prediction-info">
          Votre pronostic : ${prediction.home_score_prediction} - ${prediction.away_score_prediction}
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="match-header">
        <div class="match-info">
          <div><strong>${prediction.league_name || 'Championnat'}</strong> - ${prediction.round || 'N/A'}</div>
          <div>${matchDate}</div>
        </div>
        <span class="match-status ${statusClass}">${statusText}</span>
      </div>
      
      <div class="teams">
        <div class="team">${prediction.home_team_name}</div>
        <div class="vs">VS</div>
        <div class="team">${prediction.away_team_name}</div>
      </div>
      
      ${predictionSection}
      ${resultSection}
    `;
    
    return card;
  }
  
  // Mettre à jour un pronostic
  function updatePrediction(predictionId, matchId) {
    const homeScore = parseInt(document.getElementById(`home-${matchId}`).value);
    const awayScore = parseInt(document.getElementById(`away-${matchId}`).value);
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showError("Veuillez entrer des scores valides");
      return;
    }
    
    const predictionData = {
      home_score_prediction: homeScore,
      away_score_prediction: awayScore
    };
    
    fetch(`${API_URL}/predictions/${predictionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(predictionData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess("Pronostic modifié avec succès !");
        loadMyPredictions();
      } else {
        showError(data.message);
      }
    })
    .catch(err => {
      console.error("Erreur:", err);
      showError("Erreur lors de la modification du pronostic");
    });
  }
  
  // Afficher un message d'erreur
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
  
  // Afficher un message de succès
  function showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";
    
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  }
  
  // Passer en mode modification
  function switchToModifyMode(matchId, predictionId, homeScore, awayScore) {
    const infoDiv = document.getElementById(`info-${matchId}`);
    const formDiv = document.getElementById(`form-${matchId}`);
    
    if (infoDiv) infoDiv.style.display = 'none';
    if (formDiv) formDiv.style.display = 'flex';
  }
  
  // Annuler la modification
  function cancelModify(matchId, originalHomeScore, originalAwayScore) {
    const infoDiv = document.getElementById(`info-${matchId}`);
    const formDiv = document.getElementById(`form-${matchId}`);
    
    if (infoDiv) infoDiv.style.display = 'block';
    if (formDiv) formDiv.style.display = 'none';
    
    // Restaurer les valeurs originales
    document.getElementById(`home-${matchId}`).value = originalHomeScore;
    document.getElementById(`away-${matchId}`).value = originalAwayScore;
  }

  // Charger les championnats pour les filtres
  async function loadLeaguesForFilters() {
    try {
    const response = await fetch(`${API_URL}/leagues`, {
        credentials: "include"
    });
    const data = await response.json();
    
    if (data.success) {
        // Remplir les deux sélecteurs de championnats
        const leagueFilter = document.getElementById('leagueFilter');
        const myLeagueFilter = document.getElementById('myLeagueFilter');
        
        data.data.forEach(league => {
        // Pour l'onglet "Matchs à venir"
        const option1 = document.createElement('option');
        option1.value = league.id;
        option1.textContent = league.name;
        leagueFilter.appendChild(option1);
        
        // Pour l'onglet "Mes pronostics"
        const option2 = document.createElement('option');
        option2.value = league.id;
        option2.textContent = league.name;
        myLeagueFilter.appendChild(option2);
        });
    }
    } catch (error) {
    console.error("Erreur lors du chargement des championnats:", error);
    }
}

// Charger les journées pour un championnat donné
  async function loadRoundsForLeague(leagueId, selectElement) {
    if (!leagueId) {
      selectElement.innerHTML = '<option value="">Toutes les journées</option>';
      selectElement.disabled = true;
      return;
    }
    
    try {
      // Pour l'instant, on va créer les options manuellement
      // Idéalement, il faudrait une API pour récupérer les journées existantes
      const response = await fetch(`${API_URL}/leagues/${leagueId}`, {
        credentials: "include"
      });
      const data = await response.json();
      
      if (data.success) {
        selectElement.innerHTML = '<option value="">Toutes les journées</option>';
        selectElement.disabled = false;
        
        if (data.data.is_cup) {
          // Pour les coupes
          const phases = [
            "Phase de groupes",
            "8èmes de finale", 
            "Quarts de finale",
            "Demi-finales",
            "Finale"
          ];
          phases.forEach(phase => {
            const option = document.createElement('option');
            option.value = phase;
            option.textContent = phase;
            selectElement.appendChild(option);
          });
        } else {
          // Pour les championnats
          for (let i = 1; i <= 38; i++) {
            const option = document.createElement('option');
            option.value = `Journée ${i}`;
            option.textContent = `Journée ${i}`;
            selectElement.appendChild(option);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des journées:", error);
    }
  }
  
  // Configurer les filtres
  function setupFilters() {
    const leagueFilter = document.getElementById('leagueFilter');
    const roundFilter = document.getElementById('roundFilter');
    const myLeagueFilter = document.getElementById('myLeagueFilter');
    const myRoundFilter = document.getElementById('myRoundFilter');
    
    // Événements pour les filtres des matchs à venir
    leagueFilter.addEventListener('change', async () => {
      const leagueId = leagueFilter.value;
      await loadRoundsForLeague(leagueId, roundFilter);
      filterUpcomingMatches();
    });
    
    roundFilter.addEventListener('change', () => {
      filterUpcomingMatches();
    });
    
    // Événements pour les filtres de mes pronostics
    myLeagueFilter.addEventListener('change', async () => {
      const leagueId = myLeagueFilter.value;
      await loadRoundsForLeague(leagueId, myRoundFilter);
      filterMyPredictions();
    });
    
    myRoundFilter.addEventListener('change', () => {
      filterMyPredictions();
    });
  }
  
  // Filtrer les matchs à venir
  function filterUpcomingMatches() {
    const leagueId = document.getElementById('leagueFilter').value;
    const round = document.getElementById('roundFilter').value;
    
    // Recharger les matchs avec les filtres
    loadUpcomingMatches(leagueId, round);
  }
  
  // Filtrer mes pronostics
  function filterMyPredictions() {
    const leagueId = document.getElementById('myLeagueFilter').value;
    const round = document.getElementById('myRoundFilter').value;
    
    // Recharger les pronostics avec les filtres
    loadMyPredictions(leagueId, round);
  }

// ===== EXPOSITION DES FONCTIONS POUR LES ONCLICK =====
// Exposer les fonctions dans le scope global pour les gestionnaires onclick
window.submitPrediction = submitPrediction;
window.updatePrediction = updatePrediction;
window.switchToModifyMode = switchToModifyMode;
window.cancelModify = cancelModify;