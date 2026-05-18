  
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

CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',   'Acceso total al sistema'),
  ('docente', 'Acceso a módulos académicos'),
  ('alumno',  'Acceso a portal de estudiante')
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES roles(id);
UPDATE usuarios u SET rol_id = r.id FROM roles r WHERE u.rol = r.nombre;

CREATE TABLE IF NOT EXISTS grupos (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(50) UNIQUE NOT NULL,
  grado     INTEGER NOT NULL,
  turno     VARCHAR(20) DEFAULT 'matutino' CHECK (turno IN ('matutino', 'vespertino')),
  activo    BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

INSERT INTO grupos (nombre, grado, turno) VALUES
  ('1-A', 1, 'matutino'),
  ('1-B', 1, 'vespertino'),
  ('2-A', 2, 'matutino'),
  ('3-A', 3, 'matutino')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS alumnos (
  id         SERIAL PRIMARY KEY,
  matricula  VARCHAR(8) UNIQUE NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  apellidos  VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE,
  telefono   VARCHAR(15),
  grupo_id   INTEGER REFERENCES grupos(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  activo     BOOLEAN DEFAULT TRUE,
  creado_en  TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_matricula CHECK (matricula ~ '^2[1-9][0-9]{6}$')
);

CREATE TABLE IF NOT EXISTS docentes (
  id              SERIAL PRIMARY KEY,
  numero_empleado VARCHAR(20) UNIQUE NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  apellidos       VARCHAR(100) NOT NULL,
  email           VARCHAR(100) UNIQUE,
  telefono        VARCHAR(15),
  especialidad    VARCHAR(100),
  usuario_id      INTEGER REFERENCES usuarios(id),
  activo          BOOLEAN DEFAULT TRUE,
  creado_en       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materias (
  id          SERIAL PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  creditos    INTEGER DEFAULT 0,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT NOW()
);

INSERT INTO materias (clave, nombre, creditos) VALUES
  ('MAT101', 'Matemáticas I',   5),
  ('ESP101', 'Español I',       4),
  ('FIS101', 'Física I',        5),
  ('INF101', 'Informática I',   4),
  ('QUI101', 'Química I',       5)
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE IF NOT EXISTS materia_grupo (
  id         SERIAL PRIMARY KEY,
  materia_id INTEGER NOT NULL REFERENCES materias(id),
  grupo_id   INTEGER NOT NULL REFERENCES grupos(id),
  docente_id INTEGER REFERENCES docentes(id),
  activo     BOOLEAN DEFAULT TRUE,
  creado_en  TIMESTAMP DEFAULT NOW(),
  UNIQUE(materia_id, grupo_id)
);

CREATE SEQUENCE IF NOT EXISTS seq_matricula START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_empleado  START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION generar_matricula()
RETURNS VARCHAR AS $$
DECLARE num INTEGER;
BEGIN
  num := nextval('seq_matricula');
  RETURN '22' || LPAD(num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_numero_empleado()
RETURNS VARCHAR AS $$
DECLARE num INTEGER;
BEGIN
  num := nextval('seq_empleado');
  RETURN '11' || LPAD(num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;