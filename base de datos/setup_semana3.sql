-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Insertar roles base
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',   'Acceso total al sistema'),
  ('docente', 'Acceso a módulos académicos'),
  ('alumno',  'Acceso a portal de estudiante')
ON CONFLICT (nombre) DO NOTHING;

-- Agregar columna rol_id a usuarios (relación con tabla roles)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id INTEGER REFERENCES roles(id);

-- Sincronizar rol_id con la columna rol existente
UPDATE usuarios u SET rol_id = r.id FROM roles r WHERE u.rol = r.nombre;

SELECT u.id, u.usuario, u.nombre, u.rol, r.descripcion
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id;