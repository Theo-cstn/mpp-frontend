import { API_URL, WS_URL } from './config.mjs';
document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chatContainer");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  
  let currentUsername = null;
  let socket = null;

  // Vérifier si l'utilisateur est connecté
  checkAuthentication();

  function checkAuthentication() {
    console.log("Checking authentication...");
    fetch(`${API_URL}/me`, {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      console.log("Authentication response:", data);
      if (data.username) {
        currentUsername = data.username;
        console.log("Logged in as:", currentUsername);
        const currentUserElement = document.getElementById("currentUser");
        if (currentUserElement) {
          currentUserElement.textContent = currentUsername;
        }
        connectWebSocket();
      } else {
        console.log("Not logged in, redirecting to login page");
        window.location.href = "/login.html";
      }
    })
    .catch(err => {
      console.error("Error checking authentication:", err);
      window.location.href = "/login.html";
    });
  }

  function connectWebSocket() {
    console.log("Connecting to WebSocket...");
    // Establish WebSocket connection
    socket = new WebSocket(`${WS_URL}/ws`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
      appendSystemMessage("Connected to chat server!");
    };

    socket.onmessage = (event) => {
      console.log("Raw message received:", event.data);

      try {
        const message = JSON.parse(event.data);
        console.log("Parsed message:", message);

        if (message.type === "system") {
          // Messages système
          appendSystemMessage(message.message);
        } else if (message.username && message.message) {
          // Messages utilisateur
          appendUserMessage(message.username, message.message);
        } else {
          console.error("Invalid message format:", message);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    socket.onclose = (event) => {
      console.error("WebSocket connection closed", event);
      appendSystemMessage("Connection to chat server closed.");
      
      if (!event.wasClean) {
        appendSystemMessage("Connection lost. You may need to log in again.");
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      appendSystemMessage("Error connecting to chat server");
    };
  }

  function appendSystemMessage(text) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", "system");
    messageElement.innerHTML = `<em>${text}</em>`;
    chatContainer.appendChild(messageElement);
    scrollToBottom();
  }

  function appendUserMessage(username, text) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(username === currentUsername ? "user" : "other");
    messageElement.innerHTML = `<strong>${username}</strong>: ${text}`;
    chatContainer.appendChild(messageElement);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Send a message when the button is clicked
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }

  // Send a message when Enter is pressed
  if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  function sendMessage() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      appendSystemMessage("Not connected to chat server!");
      return;
    }

    const message = messageInput.value.trim();
    if (message) {
      console.log("Sending message:", message);
      try {
        const payload = { message };
        socket.send(JSON.stringify(payload));
        messageInput.value = ""; // Clear the input field
      } catch (error) {
        console.error("Error sending message:", error);
        appendSystemMessage("Failed to send message. Please try again.");
      }
    }
  }
});