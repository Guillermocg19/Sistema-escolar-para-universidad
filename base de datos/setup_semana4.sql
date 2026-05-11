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
