const express  = require('express');
const cors     = require('cors');
const pool     = require('./db');

const usuariosRouter = require('./routes/usuarios');
const rolesRouter    = require('./routes/roles');
const alumnosRouter  = require('./routes/alumnos');
const docentesRouter = require('./routes/docentes');
const gruposRouter   = require('./routes/grupos');
<<<<<<< HEAD
const materiasRouter  = require('./routes/materias');
=======
>>>>>>> bb4f642c97d9e518ea3ab6f21ea3ebece2d240c2

const app = express();
app.use(cors());
app.use(express.json());

app.use('/usuarios', usuariosRouter);
app.use('/roles',    rolesRouter);
app.use('/alumnos',  alumnosRouter);
app.use('/docentes', docentesRouter);
app.use('/grupos',   gruposRouter);
<<<<<<< HEAD
app.use('/materias', materiasRouter);
=======
>>>>>>> bb4f642c97d9e518ea3ab6f21ea3ebece2d240c2

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
  try {
    const result = await pool.query(
      'SELECT id, usuario, nombre, rol FROM usuarios WHERE usuario = $1 AND contrasena = $2 AND activo = TRUE',
      [username, password]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = Buffer.from(`${user.id}:${user.usuario}:${user.rol}`).toString('base64');
      res.json({ success: true, token, user });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
