-- Secuencias para matrículas y números de empleado
CREATE SEQUENCE IF NOT EXISTS seq_matricula START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_empleado  START 1 INCREMENT 1;

-- Función para generar matrícula: 22XXXXXX
CREATE OR REPLACE FUNCTION generar_matricula()
RETURNS VARCHAR AS $$
DECLARE
  num INTEGER;
BEGIN
  num := nextval('seq_matricula');
  RETURN '22' || LPAD(num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de empleado: 11XXXXXX
CREATE OR REPLACE FUNCTION generar_numero_empleado()
RETURNS VARCHAR AS $$
DECLARE
  num INTEGER;
BEGIN
  num := nextval('seq_empleado');
  RETURN '11' || LPAD(num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;