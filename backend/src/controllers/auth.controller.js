// src/controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import pool from '../config/db.config.js';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const newUser = await pool.query(
      'INSERT INTO Usuarios (email, password) VALUES ($1, $2) RETURNING id, email, rol',
      [email, hashedPassword]
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
export const login = async (req, res) => {
  try {
    // 1. Obtenemos email y password del cuerpo
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    // 2. Buscar al usuario por email en la DB
    const userResult = await pool.query(
      'SELECT * FROM Usuarios WHERE email = $1',
      [email]
    );

    // 3. Verificar si el usuario existe
    if (userResult.rows.length === 0) {
      // Usamos un mensaje genérico por seguridad
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // 4. Comparar la contraseña
    const isPasswordCorrect = await bcrypt.compare(
      password,       // La contraseña que envía el usuario
      user.password   // La contraseña hasheada en la DB
    );

    if (!isPasswordCorrect) {
      // Mismo mensaje genérico
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 5. ¡Éxito! Crear el token JWT
    const payload = {
      id: user.id,
      rol: user.rol,
      email: user.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // Usamos el secreto del .env
      { expiresIn: '30d' } // El token expira en 1 día
    );

    // 6. Enviar el token al cliente
    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProfile = async (req, res) => {
  try {
    // Gracias al middleware 'verificarToken', ya tenemos 'req.user'
    // No necesitamos consultar la DB, el token ya tiene la info.
    res.status(200).json({
      message: 'Perfil obtenido exitosamente',
      user: req.user // Devolvemos el payload del token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};