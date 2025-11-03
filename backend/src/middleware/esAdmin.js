// src/middleware/esAdmin.js
export const esAdmin = (req, res, next) => {
  // Este middleware DEBE correr DESPUÉS de 'verificarToken'
  // por eso podemos confiar en que 'req.user' existe.
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Se requiere rol de administrador.' 
    });
  }
  
  // Si es 'admin', continúa
  next();
};