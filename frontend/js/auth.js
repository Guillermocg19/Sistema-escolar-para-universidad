async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  if (!username || !password) {
    errorEl.innerText = "Ingresa tu usuario y contrasena";
    return;
  }

  errorEl.innerText = "";

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      errorEl.innerText = data.message || "Usuario o contrasena incorrectos";
    }

  } catch (error) {
    errorEl.innerText = "No se pudo conectar con el servidor";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}