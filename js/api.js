const API_URL = "http://localhost:3000";
 
function getToken() {
  return localStorage.getItem("token");
}
 
function getUsuario() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}
 