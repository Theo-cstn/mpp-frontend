import { API_URL, WS_URL } from './config.mjs';
// private-leagues.js mis à jour pour utiliser la page dédiée
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    loadUserLeagues();
    setupForms();
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
  
  // Configurer les formulaires
  function setupForms() {
    // Formulaire de création
    document.getElementById("createLeagueForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const name = document.getElementById("leagueName").value;
      const description = document.getElementById("leagueDescription").value;
      const max_members = parseInt(document.getElementById("maxMembers").value);
      
      try {
        const response = await fetch(`${API_URL}/private-leagues`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ name, description, max_members })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showSuccess("Ligue créée avec succès ! Code d'invitation : " + data.data.invite_code);
          e.target.reset();
          loadUserLeagues();
        } else {
          showError(data.message);
        }
      } catch (error) {
        showError("Erreur lors de la création de la ligue");
      }
    });
    
    // Formulaire pour rejoindre
    document.getElementById("joinLeagueForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const invite_code = document.getElementById("inviteCode").value.toUpperCase();
      
      try {
        const response = await fetch(`${API_URL}/private-leagues/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ invite_code })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showSuccess("Vous avez rejoint la ligue avec succès !");
          e.target.reset();
          loadUserLeagues();
        } else {
          showError(data.message);
        }
      } catch (error) {
        showError("Erreur lors de la tentative de rejoindre la ligue");
      }
    });
  }
  
  // Charger les ligues de l'utilisateur
  async function loadUserLeagues() {
    try {
      const response = await fetch(`${API_URL}/private-leagues`, {
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        displayLeagues(data.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  }
  
  // Afficher les ligues
  function displayLeagues(leagues) {
    const container = document.getElementById("leaguesContainer");
    container.innerHTML = "";
    
    if (leagues.length === 0) {
      container.innerHTML = '<p>Vous ne faites partie d\'aucune ligue pour le moment.</p>';
      return;
    }
    
    leagues.forEach(league => {
      const card = document.createElement("div");
      card.className = "league-card";
      card.innerHTML = `
        <h3>${league.name}</h3>
        <p>${league.description || 'Aucune description'}</p>
        <div class="league-stats">
          <span>Membres: ${league.member_count}/${league.max_members}</span>
          <span>Créateur: ${league.creator_username}</span>
        </div>
        <a href="/league-detail.html?id=${league.id}" class="btn btn-primary">
          Voir les détails
        </a>
      `;
      container.appendChild(card);
    });
  }
  
  // Afficher les messages d'erreur
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
  
  // Afficher les messages de succès
  function showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";
    
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  }