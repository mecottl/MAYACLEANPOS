// src/config/db.config.js
import { Pool } from 'pg'
import 'dotenv/config'

// Creamos el pool de conexiones usando la URL de Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requiere SSL, esta es la configuración simple para que funcione
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool