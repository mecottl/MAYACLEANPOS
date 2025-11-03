// src/middleware/verificarToken.js
import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar el token JWT en las peticiones.
 */
export const verificarToken = (req, res, next) => {
  try {
    // 1. Obtener el token del header 'Authorization'
    // El formato esperado es: "Bearer <token>"
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    // 2. Separar "Bearer" del token
    const token = authHeader.split(' ')[1]; // [0] = 'Bearer', [1] = <token>

    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. Formato de token inválido.' });
    }

    // 3. Verificar el token usando el secreto del .env
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 4. ¡Éxito! El token es válido.
    // Añadimos el 'payload' (que tiene id, rol, email) al objeto 'req'
    // para que las rutas protegidas sepan QUIÉN está haciendo la petición.
    req.user = payload;
    
    // 5. Continuar a la siguiente función (el controlador)
    next();

  } catch (error) {
    // El token expiró o es inválido
    console.error('Error al verificar token:', error.message);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};