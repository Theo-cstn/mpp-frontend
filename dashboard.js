import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
  });
  
  function checkAuthentication() {
    fetch(`${API_URL}/me`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      if (data.username) {
        // Afficher le nom d'utilisateur
        document.getElementById("currentUser").textContent = data.username;
        document.getElementById("welcomeUser").textContent = data.username;
        
        // Vérifier si c'est un admin
        checkAdminStatus();
      } else {
        // Non connecté, rediriger vers login
        window.location.href = "/login.html";
      }
    })
    .catch(err => {
      console.error("Erreur d'authentification:", err);
      window.location.href = "/login.html";
    });
  }
  
  function checkAdminStatus() {
    fetch(`${API_URL}/admin/check`, {
      credentials: "include"
    })
    .then(res => {
      if (res.ok) {
        // L'utilisateur est admin, afficher le lien admin
        document.getElementById("adminLink").style.display = "block";
      }
      // Si ce n'est pas ok, on ne fait rien (le lien reste caché)
    })
    .catch(err => {
      // Pas admin, on ne fait rien
      console.log("Utilisateur non-admin");
    });
  }