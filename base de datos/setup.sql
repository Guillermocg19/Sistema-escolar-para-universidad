  
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  usuario    VARCHAR(50) UNIQUE NOT NULL,
  contrasena VARCHAR(100) NOT NULL,
  nombre     VARCHAR(100),
  rol        VARCHAR(20) DEFAULT 'alumno' CHECK (rol IN ('admin', 'docente', 'alumno')),
  activo     BOOLEAN DEFAULT TRUE,
  creado_en  TIMESTAMP DEFAULT NOW()
);

INSERT INTO usuarios (usuario, contrasena, nombre, rol) VALUES
  ('admin',   'admin123', 'Administrador',  'admin'),
  ('jlopez',  'pass123',  'Jonathan Lopez', 'alumno'),
  ('mgarcia', 'pass123',  'Maria Garcia',   'docente')
ON CONFLICT (usuario) DO NOTHING;

SELECT id, usuario, nombre, rol FROM usuarios;