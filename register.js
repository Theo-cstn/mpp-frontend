import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", function () {
  const registerButton = document.getElementById("registerButton");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  if (registerButton) {
    registerButton.addEventListener("click", async function (event) {
      event.preventDefault();

      const username = usernameInput.value;
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!username || !password) {
        alert("Username and password are required");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/register`, {          
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Registration successful:", data.message);
        window.location.href = "/login.html"; 
      } catch (error) {
        console.error("Error:", error);
        alert("Registration failed: " + error.message);
      }
    });
  } else {
    console.error("Register button not found");
  }
});
