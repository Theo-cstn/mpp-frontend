import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", () => {
    checkAdminAccess();
    loadAllData();
    setupMatchForm();
  });
  
  // Variables globales
  let allLeagues = [];
  let allTeams = [];
  
  // Vérifier si l'utilisateur est admin
  function checkAdminAccess() {
    fetch(`${API_URL}/admin/check`, {
      credentials: "include"
    })
    .then(res => {
      if (!res.ok) {
        throw new Error("Accès non autorisé");
      }
      return res.json();
    })
    .then(data => {
      if (data.username) {
        document.getElementById("adminUsername").textContent = `Admin: ${data.username}`;
      }
    })
    .catch(err => {
      console.error("Erreur d'accès admin:", err);
      window.location.href = "/dashboard.html";
    });
  }
  
  // Charger toutes les données
  function loadAllData() {
    loadLeagues();
    loadTeams();
    loadMatches();
  }
  
  // Charger les championnats
  function loadLeagues() {
    fetch(`${API_URL}/leagues`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        allLeagues = data.data;
        populateLeagueSelect();
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Charger les équipes
  function loadTeams() {
    fetch(`${API_URL}/teams`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        allTeams = data.data;
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Charger les matchs
  function loadMatches() {
    fetch(`${API_URL}/matches`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        displayMatches(data.data);
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Afficher les matchs
  function displayMatches(matches) {
    const tbody = document.querySelector("#matchesTable tbody");
    tbody.innerHTML = "";
    
    matches.forEach(match => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${match.id}</td>
        <td>${match.league_name}</td>
        <td>${match.round || "N/A"}</td>
        <td>${match.home_team_name}</td>
        <td>${match.away_team_name}</td>
        <td>${formatDateTime(match.match_date)}</td>
        <td>${formatStatus(match.status)}</td>
        <td id="score-${match.id}">
          ${match.status === 'finished' ? 
            `${match.home_score} - ${match.away_score}` :
            `<input type="number" class="score-input" id="home-${match.id}" min="0" value="${match.home_score || 0}">
             -
             <input type="number" class="score-input" id="away-${match.id}" min="0" value="${match.away_score || 0}">`
          }
        </td>
        <td>
          <div class="actions">
            ${match.status !== 'finished' ? 
              `<button class="btn btn-success" onclick="updateScore(${match.id})">Valider score</button>` : 
              ''
            }
            <button class="btn btn-danger" onclick="deleteMatch(${match.id})">Supprimer</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Formater le statut
  function formatStatus(status) {
    switch (status) {
      case 'scheduled': return 'Programmé';
      case 'in_progress': return 'En cours';
      case 'finished': return 'Terminé';
      default: return status;
    }
  }
  
  // Configurer le formulaire de match
  function setupMatchForm() {
    const form = document.getElementById('createMatchForm');
    const leagueSelect = document.getElementById('matchLeague');
    
    form.addEventListener('submit', createMatch);

    // Ajout de l'événement pour mettre à jour les équipes ET les journées
    leagueSelect.addEventListener('change', () => {
      updateTeamSelects();
      updateRoundOptions(); 
    });
  }
  
  // Peupler le select des championnats
  function populateLeagueSelect() {
    const select = document.getElementById('matchLeague');
    select.innerHTML = '<option value="">Sélectionner un championnat</option>';
    
    allLeagues.forEach(league => {
      const option = document.createElement('option');
      option.value = league.id;
      option.textContent = league.name;
      select.appendChild(option);
    });
  }
  
  // Mettre à jour les selects des équipes
  function updateTeamSelects() {
    const leagueId = parseInt(document.getElementById('matchLeague').value);
    const homeSelect = document.getElementById('matchHomeTeam');
    const awaySelect = document.getElementById('matchAwayTeam');
    
    if (!leagueId) {
      homeSelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
      awaySelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
      return;
    }
    
    const leagueTeams = allTeams.filter(team => team.league_id === leagueId);
    
    homeSelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
    awaySelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
    
    leagueTeams.forEach(team => {
      const homeOption = document.createElement('option');
      homeOption.value = team.id;
      homeOption.textContent = team.name;
      homeSelect.appendChild(homeOption);
      
      const awayOption = document.createElement('option');
      awayOption.value = team.id;
      awayOption.textContent = team.name;
      awaySelect.appendChild(awayOption);
    });
  }
  
  // Créer un match
  function createMatch(event) {
    event.preventDefault();
    
    const leagueId = parseInt(document.getElementById('matchLeague').value);
    const homeTeamId = parseInt(document.getElementById('matchHomeTeam').value);
    const awayTeamId = parseInt(document.getElementById('matchAwayTeam').value);
    const matchDate = document.getElementById('matchDate').value;
    const round = document.getElementById('matchRound').value;
    
    // Validation
    if (!leagueId || !homeTeamId || !awayTeamId || !matchDate || !round) {
      showError("Tous les champs sont obligatoires");
      return;
    }
    
    if (homeTeamId === awayTeamId) {
      showError("Une équipe ne peut pas jouer contre elle-même");
      return;
    }
    
    const matchData = {
      league_id: leagueId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: new Date(matchDate).toISOString(),
      round: round,
      status: "scheduled"
    };
    
    console.log("Sending match data:", matchData); // Pour déboguer
    
    fetch(`${API_URL}/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(matchData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess("Match créé avec succès");
        loadMatches();
        event.target.reset();
        // Réinitialiser les sélecteurs
        updateTeamSelects();
        updateRoundOptions();
      } else {
        showError(data.message);
      }
    })
    .catch(err => {
      console.error("Erreur:", err);
      showError("Erreur lors de la création du match");
    });
  }
  
  // Mettre à jour le score
  function updateScore(matchId) {
    const homeScore = parseInt(document.getElementById(`home-${matchId}`).value);
    const awayScore = parseInt(document.getElementById(`away-${matchId}`).value);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
      showError("Les scores doivent être des nombres");
      return;
    }
    
    fetch(`${API_URL}/matches/${matchId}/score`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        home_score: homeScore,
        away_score: awayScore
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess("Score mis à jour avec succès");
        loadMatches();
      } else {
        showError(data.message);
      }
    })
    .catch(err => {
      console.error("Erreur:", err);
      showError("Erreur lors de la mise à jour du score");
    });
  }
  
  // Supprimer un match
  function deleteMatch(matchId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) {
      return;
    }
    
    fetch(`${API_URL}/matches/${matchId}`, {
      method: "DELETE",
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess("Match supprimé avec succès");
        loadMatches();
      } else {
        showError(data.message);
      }
    })
    .catch(err => {
      console.error("Erreur:", err);
      showError("Erreur lors de la suppression du match");
    });
  }
  
  // Formater la date et l'heure
  function formatDateTime(dateString) {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }
  
  // Afficher les erreurs
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
  
  // Afficher les succès
  function showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";
    
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  }

// Fonction pour mettre à jour les options de journée selon le championnat
function updateRoundOptions() {
  const leagueId = parseInt(document.getElementById('matchLeague').value);
  const roundSelect = document.getElementById('matchRound');
  
  if (!leagueId) {
    roundSelect.innerHTML = '<option value="">Sélectionner une journée/phase</option>';
    roundSelect.disabled = true;
    return;
  }
  
  roundSelect.disabled = false;
  const selectedLeague = allLeagues.find(league => league.id === leagueId);
  
  if (!selectedLeague) return;
  
  if (selectedLeague.is_cup) {
    // Pour les coupes (comme Champions League)
    roundSelect.innerHTML = `
      <option value="">Sélectionner une phase</option>
      <option value="Phase de groupes">Phase de groupes</option>
      <option value="8èmes de finale">8èmes de finale</option>
      <option value="Quarts de finale">Quarts de finale</option>
      <option value="Demi-finales">Demi-finales</option>
      <option value="Finale">Finale</option>
    `;
  } else {
    // Pour les championnats réguliers
    roundSelect.innerHTML = '<option value="">Sélectionner une journée</option>';
    for (let i = 1; i <= 38; i++) {
      const option = document.createElement('option');
      option.value = `Journée ${i}`;
      option.textContent = `Journée ${i}`;
      roundSelect.appendChild(option);
    }
  }
}