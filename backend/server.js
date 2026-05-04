const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'escuela',
  password: 'jona',
  port: 5432
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos correctamente');
    release();
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Usuario y contrasena requeridos' });
  }

  try {
    const result = await pool.query(
      'SELECT id, usuario, nombre, rol FROM usuarios WHERE usuario = $1 AND contrasena = $2 AND activo = TRUE',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const token = Buffer.from(`${user.id}:${user.usuario}:${user.rol}`).toString('base64');

      res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          usuario: user.usuario,
          nombre: user.nombre,
          rol: user.rol
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, usuario, nombre, rol FROM usuarios WHERE activo = TRUE ORDER BY id'
    );
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/usuarios', async (req, res) => {
  const { usuario, contrasena, nombre, rol } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ message: 'Usuario y contrasena son requeridos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO usuarios (usuario, contrasena, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, usuario, nombre, rol',
      [usuario, contrasena, nombre || '', rol || 'alumno']
    );
    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});