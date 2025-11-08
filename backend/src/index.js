// backend/src/index.js
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors'; // <-- Asegúrate de que esto esté importado
import pool from './config/db.config.js'; 
import authRoutes from './routes/auth.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES (¡ESTE ORDEN ES VITAL!) ---
app.use(cors()); // 1. Habilita CORS para todas las peticiones
app.use(express.json()); // 2. Habilita la lectura de JSON
// ------------------------------------------

// --- RUTAS (DEBEN IR DESPUÉS DE LOS MIDDLEWARES) ---
app.get('/', (req, res) => {
  res.json({ message: '¡API de MAYACLEANPOS funcionando en ESM!' });
});

app.get('/ping', async (req, res) => {
});

app.get('/api/keep-alive', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ message: '¡Database pinged successfully!' });
  } catch (error) {
    console.error('Error en keep-alive ping:', error.message);
    res.status(500).json({ message: 'Database ping failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Mayaclean corriendo en http://localhost:${PORT}`);
});