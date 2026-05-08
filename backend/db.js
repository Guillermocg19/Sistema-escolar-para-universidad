const { Pool } = require('pg');

const pool = new Pool({
  user:     'postgres',
  host:     'localhost',
  database: 'escuela',
  password: 'password',
  port:     5432
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos correctamente');
    release();
  }
});

module.exports = pool;