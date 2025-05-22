import { API_URL, WS_URL } from './config.mjs';

document.addEventListener("DOMContentLoaded", function () {
  const loginButton = document.getElementById("loginButton");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");

  if (loginButton) {
    loginButton.addEventListener("click", async function (event) {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        showError("Username and password are required");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Pour envoyer les cookies
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        console.log("Login successful:", data.message);
        // Rediriger vers le dashboard au lieu du chat directement
        window.location.href = "/dashboard.html";
      } catch (error) {
        console.error("Error:", error);
        showError("Échec de connexion: " + error.message);
      }
    });

    // Activation du bouton de login en appuyant sur Enter
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loginButton.click();
      }
    });
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    } else {
      alert(message);
    }
  }
});