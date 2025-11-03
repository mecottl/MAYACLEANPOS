import { verificarToken } from '../middleware/verificarToken.js';
import { esAdmin } from '../middleware/esAdmin.js'; // <-- Lo importas

// Esta ruta solo la puede ver un admin
router.get(
  '/contabilidad', 
  verificarToken, // 1. Revisa si tiene token
  esAdmin,          // 2. Revisa si el rol es 'admin'
  getReporteContabilidad // 3. Si pasa ambos, ejecuta la función
);