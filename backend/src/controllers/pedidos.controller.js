// backend/src/controllers/pedidos.controller.js
import pool from '../config/db.config.js';

/**
 * 1. Obtiene pedidos ACTIVOS para el Dashboard
 * (En Proceso, Listo)
 */
export const getPedidosDashboard = async (req, res) => {
  try {
    const pedidosActivos = await pool.query(
      `SELECT 
         p.folio, 
         p.precio_total, 
         p.estado_flujo, 
         p.estado_pago, 
         p.fecha_creacion,
         p.es_domicilio,
         c.nombre AS nombre_cliente,
         c.telefono AS telefono_cliente
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       WHERE p.estado_flujo IN ('En Proceso', 'Listo')
       ORDER BY p.fecha_creacion ASC`
    );
    res.status(200).json(pedidosActivos.rows);
  } catch (error) {
    console.error('Error al obtener pedidos del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 2. Crea un nuevo pedido.
 */
export const crearPedido = async (req, res) => {
  try {
    const { cliente_id, precio_servicio, tarifa_domicilio = 0 } = req.body;

    if (!cliente_id || !precio_servicio) {
      return res.status(400).json({ message: 'El cliente_id y el precio_servicio son requeridos' });
    }

    const es_domicilio = Number(tarifa_domicilio) > 0;

    const nuevoPedido = await pool.query(
      `INSERT INTO pedidos (cliente_id, precio_servicio, tarifa_domicilio, es_domicilio) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cliente_id, precio_servicio, tarifa_domicilio, es_domicilio]
    );

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      pedido: nuevoPedido.rows[0]
    });
  } catch (error) {
    if (error.code === '23503') { 
      return res.status(404).json({ message: 'Error: El cliente_id no existe' });
    }
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 3. Actualiza el estado de un pedido y la lealtad del cliente.
 */
export const actualizarEstadoPedido = async (req, res) => {
  try {
    const { folio } = req.params;
    const { estado_flujo, estado_pago } = req.body;

    if (!estado_flujo && !estado_pago) {
      return res.status(400).json({ message: 'Se requiere al menos un estado para actualizar' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (estado_flujo) {
      fields.push(`estado_flujo = $${paramIndex++}`);
      values.push(estado_flujo);
      if (estado_flujo === 'Listo') {
        fields.push(`fecha_listo = NOW()`);
      } else if (estado_flujo === 'Entregado') {
        fields.push(`fecha_entrega = NOW()`);
      }
    }

    if (estado_pago) {
      fields.push(`estado_pago = $${paramIndex++}`);
      values.push(estado_pago);
    }

    values.push(folio);
    const query = `
      UPDATE pedidos
      SET ${fields.join(', ')} 
      WHERE folio = $${paramIndex} 
      RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedidoActualizado = result.rows[0];
    let mensajeRespuesta = 'Pedido actualizado exitosamente';

    if (pedidoActualizado.estado_flujo === 'Entregado' && pedidoActualizado.estado_pago === 'Pagado') {
      await pool.query(
        'UPDATE clientes SET contador_servicios = contador_servicios + 1 WHERE id = $1',
        [pedidoActualizado.cliente_id]
      );
      mensajeRespuesta = 'Pedido actualizado y 1 punto de lealtad sumado al cliente';
    }

    res.status(200).json({
      message: mensajeRespuesta,
      pedido: pedidoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * 4. Obtiene TODOS los pedidos para el Historial
 * (Sin filtro de estado, pero con filtro de fecha)
 */
export const getHistorialPedidos = async (req, res) => {
  try {
    const { rango } = req.query;
    let sqlFiltroFecha = ""; 

    // Si hay un filtro de rango, se convierte en la cláusula WHERE
    if (rango) {
      sqlFiltroFecha = `WHERE (p.fecha_entrega >= (NOW() - INTERVAL '${rango}') OR p.fecha_creacion >= (NOW() - INTERVAL '${rango}'))`;
    }

    const pedidosHistorial = await pool.query(
      `SELECT 
         p.folio,
         p.precio_servicio,
         p.tarifa_domicilio,
         p.precio_total,
         p.estado_flujo,
         p.estado_pago,
         p.fecha_creacion,
         p.fecha_listo,
         p.fecha_entrega,
         p.es_domicilio,
         c.nombre AS nombre_cliente,
         c.telefono AS telefono_cliente
       FROM pedidos p
       JOIN clientes c ON p.cliente_id = c.id
       ${sqlFiltroFecha} -- <-- Se añade el WHERE aquí (si existe)
       ORDER BY
         CASE 
           WHEN p.estado_flujo = 'En Proceso' THEN 1
           WHEN p.estado_flujo = 'Listo' THEN 2
           WHEN p.estado_flujo = 'Entregado' THEN 3
           WHEN p.estado_flujo = 'Cancelado' THEN 4
           ELSE 5 
         END ASC, -- Ordena por la prioridad (1, 2, 3...)
         p.fecha_creacion DESC -- Luego, por fecha de creación` // Ordenamos por creación
    );
    
    res.status(200).json(pedidosHistorial.rows);

  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};