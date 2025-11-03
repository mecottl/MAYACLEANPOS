import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import pool from './config/db.config.js'; 
import authRoutes from './routes/auth.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones de otros dominios
app.use(express.json()); // Permite a Express entender JSON

app.get('/', (req, res) => {
  res.json({ message: '¡API de MAYACLEANPOS funcionando en ESM!' });
});

// Ruta de prueba para la base de datos
app.get('/ping', async (req, res) => {
  try {
    // Hacemos una consulta simple a Neon
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Conexión a Neon exitosa ✅',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    res.status(500).json({ message: 'Error al conectar a la DB' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/pedidos', pedidosRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});