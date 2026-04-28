async function loadUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`, {
    headers: {
      "Authorization": "Bearer " + getToken()
    }
  });

  const data = await response.json();

  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "";

  data.forEach(u => {
    const li = document.createElement("li");
    li.innerText = u.username;
    lista.appendChild(li);
  });
}