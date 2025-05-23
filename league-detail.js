import { API_URL, WS_URL } from './config.mjs';
// league-detail.js
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    setupEventListeners();
    
    // Récupérer l'ID de la ligue depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get('id');
    
    if (!leagueId) {
      showError("ID de ligue non spécifié");
      return;
    }
    
    loadLeagueDetails(leagueId);
  });
  
  let currentUser = null;
  let currentUserId = null;
  let leagueId = null;
  let leagueChatSocket = null;
  
  // Vérifier l'authentification
  function checkAuthentication() {
    fetch(`${API_URL}/me`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.username) {
        currentUser = data.username;
        currentUserId = data.id;
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
  
  // Configurer les événements
  function setupEventListeners() {
    const chatInput = document.getElementById("leagueChatInput");
    const chatSendBtn = document.getElementById("leagueChatSend");
    
    // Envoyer un message lorsqu'on clique sur le bouton
    chatSendBtn.addEventListener("click", sendChatMessage);
    
    // Envoyer un message lorsqu'on appuie sur Enter
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }
  
  // Charger les détails de la ligue
  async function loadLeagueDetails(id) {
    try {
      const response = await fetch(`${API_URL}/private-leagues/${id}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des détails");
      }
      
      const data = await response.json();
      
      if (data.success) {
        leagueId = id;
        displayLeagueDetails(data.data);
        connectToChat(id);
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError("Erreur lors du chargement des détails");
      console.error(error);
    }
  }
  
  // Afficher les détails de la ligue
  function displayLeagueDetails(data) {
    const { league, members } = data;
    
    // Remplir les informations de la ligue
    document.getElementById("leagueName").textContent = league.name;
    document.getElementById("leagueDescription").textContent = league.description || 'Aucune description';
    document.getElementById("inviteCode").textContent = league.invite_code;
    document.getElementById("creatorName").textContent = league.creator_username;
    document.getElementById("memberCount").textContent = league.member_count;
    document.getElementById("maxMembers").textContent = league.max_members;
    
    // Afficher le classement
    displayRanking(members);
    
    // Configurer les boutons d'action
    setupActionButtons(league, members);
  }
  
  // Afficher le classement (VERSION CORRIGÉE)
  function displayRanking(members) {
    const tableBody = document.getElementById("leagueRanking");
    tableBody.innerHTML = "";
    
    // S'assurer qu'il y a au moins un utilisateur dans le classement
    if (!members || members.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="4">Aucun membre dans cette ligue.</td>`;
      tableBody.appendChild(row);
      return;
    }
    
    // Trier les membres par points (du plus haut au plus bas)
    const sortedMembers = [...members].sort((a, b) => (b.points || 0) - (a.points || 0));
    
    sortedMembers.forEach((member, index) => {
      const row = document.createElement("tr");
      if (member.username === currentUser) {
        row.classList.add("current-user");
      }
      
      // Calculer le rang avec gestion des ex aequo (VERSION SÉCURISÉE)
      let rank = index + 1;
      if (index > 0 && sortedMembers[index-1].points === member.points) {
        // Récupérer le rang précédent de manière sécurisée
        const previousRow = tableBody.children[index - 1];
        if (previousRow && previousRow.firstChild && previousRow.firstChild.textContent) {
          const previousRankText = previousRow.firstChild.textContent.trim();
          const previousRank = parseInt(previousRankText);
          if (!isNaN(previousRank)) {
            rank = previousRank;
          }
        }
      }
      
      row.innerHTML = `
        <td>${rank}</td>
        <td>${member.username || 'Utilisateur inconnu'}</td>
        <td>${member.points || 0}</td>
        <td>${member.role === 'admin' ? 'Admin' : 'Membre'}</td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  // Configurer les boutons d'action
  function setupActionButtons(league, members) {
    const leaveBtn = document.getElementById("leaveLeagueBtn");
    const deleteBtn = document.getElementById("deleteLeagueBtn");
    
    const currentMember = members.find(m => m.username === currentUser);
    
    if (currentMember) {
      // Pour tous les membres sauf le créateur
      if (currentMember.user_id !== league.creator_id) {
        leaveBtn.style.display = "inline-block";
        leaveBtn.onclick = () => leaveLeague(league.id);
      }
      
      // Seulement pour les admins
      if (currentMember.role === 'admin') {
        deleteBtn.style.display = "inline-block";
        deleteBtn.onclick = () => deleteLeague(league.id);
      }
    }
  }
  
  // Connexion au chat WebSocket
  function connectToChat(leagueId) {
    console.log(`Connecting to WebSocket for league ${leagueId}`);
    
    // Fermer l'ancienne connexion si elle existe
    if (leagueChatSocket) {
      leagueChatSocket.close();
    }
    
    // Se connecter au WebSocket
    leagueChatSocket = new WebSocket(`${WS_URL}/ws/league-${leagueId}`);
    
    leagueChatSocket.onopen = () => {
      console.log("WebSocket connection established");
      appendSystemMessage("Connecté au chat de la ligue");
    };
    
    leagueChatSocket.onmessage = (event) => {
      console.log("Message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "system") {
          appendSystemMessage(data.message);
        } else if (data.type === "history") {
          if (data.messages && Array.isArray(data.messages)) {
            data.messages.forEach(msg => {
              appendChatMessage(msg.username, msg.message);
            });
          }
        } else if (data.username && data.message) {
          appendChatMessage(data.username, data.message);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
    
    leagueChatSocket.onclose = () => {
      console.log("WebSocket connection closed");
      appendSystemMessage("Déconnecté du chat de la ligue");
    };
    
    leagueChatSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      appendSystemMessage("Erreur de connexion au chat");
    };
  }
  
  // Envoyer un message de chat
  function sendChatMessage() {
    const chatInput = document.getElementById("leagueChatInput");
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    if (!leagueChatSocket || leagueChatSocket.readyState !== WebSocket.OPEN) {
      appendSystemMessage("Non connecté au chat de la ligue");
      return;
    }
    
    console.log("Sending message:", message);
    leagueChatSocket.send(JSON.stringify({ message }));
    chatInput.value = "";
    chatInput.focus();
  }
  
  // Ajouter un message système au chat
  function appendSystemMessage(text) {
    const chatContainer = document.getElementById("leagueChatContainer");
    const messageEl = document.createElement("div");
    messageEl.classList.add("chat-message", "system");
    messageEl.innerHTML = `<em>${text}</em>`;
    chatContainer.appendChild(messageEl);
    scrollChatToBottom();
  }
  
  // Ajouter un message utilisateur au chat
  function appendChatMessage(username, text) {
    const chatContainer = document.getElementById("leagueChatContainer");
    const messageEl = document.createElement("div");
    messageEl.classList.add("chat-message");
    messageEl.classList.add(username === currentUser ? "user" : "other");
    messageEl.innerHTML = `<strong>${username}</strong>: ${text}`;
    chatContainer.appendChild(messageEl);
    scrollChatToBottom();
  }
  
  // Défiler le chat vers le bas
  function scrollChatToBottom() {
    const chatContainer = document.getElementById("leagueChatContainer");
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  // Quitter une ligue
  async function leaveLeague(leagueId) {
    if (!confirm("Êtes-vous sûr de vouloir quitter cette ligue ?")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/private-leagues/${leagueId}/leave`, {
        method: "POST",
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message);
        setTimeout(() => {
          window.location.href = "/private-leagues.html";
        }, 2000);
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError("Erreur lors de la tentative de quitter la ligue");
    }
  }
  
  // Supprimer une ligue
  async function deleteLeague(leagueId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ligue ? Cette action est irréversible.")) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/private-leagues/${leagueId}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message);
        setTimeout(() => {
          window.location.href = "/private-leagues.html";
        }, 2000);
      } else {
        showError(data.message);
      }
    } catch (error) {
      showError("Erreur lors de la suppression de la ligue");
    }
  }
  
  // Afficher les messages d'erreur
  function showError(message) {
    alert("Erreur: " + message);
  }
  
  // Afficher les messages de succès
  function showSuccess(message) {
    alert("Succès: " + message);
  }