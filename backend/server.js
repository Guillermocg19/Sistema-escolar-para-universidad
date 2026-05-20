const express  = require('express');
const cors     = require('cors');
const pool     = require('./db');

const usuariosRouter = require('./routes/usuarios');
const rolesRouter    = require('./routes/roles');
const alumnosRouter  = require('./routes/alumnos');
const docentesRouter = require('./routes/docentes');
const gruposRouter   = require('./routes/grupos');
const materiasRouter = require('./routes/materias');
const aulasRouter    = require('./routes/aulas');
const carrerasRouter  = require('./routes/carreras');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/usuarios', usuariosRouter);
app.use('/roles',    rolesRouter);
app.use('/alumnos',  alumnosRouter);
app.use('/docentes', docentesRouter);
app.use('/grupos',   gruposRouter);
app.use('/materias', materiasRouter);
app.use('/aulas',    aulasRouter);
app.use('/carreras', carrerasRouter);

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });

  try {
    // Busca por usuario normal, matrícula de alumno, o número de empleado
    const result = await pool.query(
      `SELECT u.id, u.usuario, u.nombre, u.rol, u.nip, u.correo_institucional
       FROM usuarios u
       WHERE (
         u.usuario = $1
         OR u.id IN (SELECT usuario_id FROM alumnos WHERE matricula = $1 AND activo = TRUE)
         OR u.id IN (SELECT usuario_id FROM docentes WHERE numero_empleado = $1 AND activo = TRUE)
       )
       AND (u.contrasena = $2 OR u.nip = $2)
       AND u.activo = TRUE`,
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
