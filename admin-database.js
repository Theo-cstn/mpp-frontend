import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", () => {
    checkAdminAccess();
    loadAllData();
  });
  
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
    loadUsers();
    loadLeagues();
    loadTeams();
  }
  
  // Charger les utilisateurs
  function loadUsers() {
    fetch(`${API_URL}/admin/users`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const sortedUsers = data.data.sort((a, b) => a.id - b.id);
        displayUsers(sortedUsers);
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Afficher les utilisateurs
  function displayUsers(users) {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    
    users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td>${user.points}</td>
        <td>${formatDate(user.created_at)}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Charger les championnats
  function loadLeagues() {
    fetch(`${API_URL}/leagues`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const sortedLeagues = data.data.sort((a, b) => a.id - b.id);
        displayLeagues(sortedLeagues);
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Afficher les championnats
  function displayLeagues(leagues) {
    const tbody = document.querySelector("#leaguesTable tbody");
    tbody.innerHTML = "";
    
    leagues.forEach(league => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${league.id}</td>
        <td>${league.name}</td>
        <td>${league.country || "International"}</td>
        <td>${league.season}</td>
        <td>${league.is_cup ? "Oui" : "Non"}</td>
        <td>${league.active ? "Oui" : "Non"}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Charger les équipes
  function loadTeams() {
    fetch(`${API_URL}/teams`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const sortedTeams = data.data.sort((a, b) => a.id - b.id);
        displayTeams(sortedTeams);
      }
    })
    .catch(err => console.error("Erreur:", err));
  }
  
  // Afficher les équipes
  function displayTeams(teams) {
    const tbody = document.querySelector("#teamsTable tbody");
    tbody.innerHTML = "";
    
    teams.forEach(team => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${team.id}</td>
        <td>${team.name}</td>
        <td>League ID: ${team.league_id}</td>
      `;
      tbody.appendChild(row);
    });
  }
  
  // Formater la date
  function formatDate(dateString) {
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