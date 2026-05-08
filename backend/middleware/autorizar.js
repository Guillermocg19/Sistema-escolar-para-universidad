/**
 * Middleware de autorización por roles.
 * Uso: router.get('/ruta', autorizar(['admin']), handler)
 */
function autorizar(rolesPermitidos = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Decodificamos el token base64: "id:usuario:rol"
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [id, usuario, rol] = decoded.split(':');

      if (!id || !usuario || !rol) {
        return res.status(401).json({ message: 'Token inválido' });
      }

      // Verificar si el rol tiene permiso
      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
        return res.status(403).json({
          message: `Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
        });
      }

      // Adjuntamos el usuario al request para usarlo en los handlers
      req.usuario = { id: parseInt(id), usuario, rol };
      next();

    } catch (error) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };
}

module.exports = autorizar;