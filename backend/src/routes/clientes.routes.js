// src/routes/clientes.routes.js
import { Router } from 'express';
import { crearCliente, buscarCliente, getAllClientes, deleteCliente, updateCliente } from '../controllers/clientes.controller.js';
import { verificarToken } from '../middleware/verificarToken.js';

const router = Router();

router.post('/', verificarToken, crearCliente);
router.get('/', verificarToken, getAllClientes);
router.get('/buscar', verificarToken, buscarCliente)
router.delete('/:id', verificarToken, deleteCliente)
router.put('/:id', verificarToken, updateCliente)



export default router;