// Login komponent
export function createLoginComponent(containerId, updateUserName) {
  const container = document.getElementById(containerId);

  // Lav HTML for login
  const loginHTML = `
        <div id="login-component">
            <form id="loginForm">
                <img src="assets/hjv_logo.svg" alt="Login" width="100">
                <br>
                <h1>Velkommen</h1>
                <p>For at kunne anvende Verner, skal du først logge ind!</p>
                <br>
                <label for="username">Username:</label>
                <input type="text" id="username" required>
                <br>
                <label for="password">Password:</label>
                <input type="password" id="password" required>
                <br>
                <button type="submit">Login</button>
                <p id="login-message"></p>
            </form>
        </div>
    `;

  container.innerHTML = loginHTML;

  // Tilføj event listener
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      const messageElement = document.getElementById("login-message");
      if (data.success) {
        console.log("Login godkendt");
        messageElement.textContent = "Login successful!";
        messageElement.style.color = "green";
        document.documentElement.style.setProperty("--userName", name);

        // Skjul login-containeren og vis resten af siden
        document.getElementById("login-component").style.display = "none";
        document.querySelectorAll("header, #chat_container").forEach((el) => {
          el.style.display = ""; // Vis de skjulte elementer
        });

        updateUserName(name); // Ensure updateUserName is called with the correct name
      } else {
        messageElement.textContent = "Login failed!";
        messageElement.style.color = "red";
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
}
