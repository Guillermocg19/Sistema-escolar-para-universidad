window.onload = function () {
  const token = getToken();
  const user = getUsuario();

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  if (user) {
    const bienvenida = document.getElementById("bienvenida");
    if (bienvenida) {
      bienvenida.innerText = `Bienvenido, ${user.nombre || user.usuario}`;
    }
  }
};

async function loadUsuarios() {
  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      headers: { "Authorization": "Bearer " + getToken() }
    });

    const data = await response.json();
    const lista = document.getElementById("listaUsuarios");
    lista.innerHTML = "";

    data.forEach(u => {
      const li = document.createElement("li");
      li.innerText = `${u.nombre || u.usuario} (${u.rol})`;
      lista.appendChild(li);
    });

  } catch (error) {
    alert("No se pudo conectar con el servidor");
  }
}