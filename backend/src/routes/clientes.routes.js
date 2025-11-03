// src/routes/clientes.routes.js
import { Router } from 'express';
import { crearCliente, buscarCliente } from '../controllers/clientes.controller.js';
import { verificarToken } from '../middleware/verificarToken.js';
const router = Router();

// Definimos las rutas para Clientes
// Ruta completa será: /api/clientes

// POST: Crear un nuevo cliente (Ruta Protegida)
// 1. El cliente llama a POST /api/clientes
// 2. Se ejecuta 'verificarToken'. Si el token es válido...
// 3. Se ejecuta 'crearCliente'.
router.post('/', verificarToken, crearCliente);

// GET: Buscar un cliente por teléfono (Ruta Protegida)
router.get('/buscar', verificarToken, buscarCliente)


export default router;