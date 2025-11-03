// src/controllers/pedidos.controller.js
import pool from '../config/db.config.js'; // Importamos el pool de Neon

/**
 * Obtiene todos los pedidos activos para el dashboard.
 * (Pedidos que están 'En Proceso' o 'Listo')
 */
export const getPedidosDashboard = async (req, res) => {
  try {
    // 1. Consultar la Base de Datos
    // Unimos (JOIN) con la tabla Clientes para obtener el nombre del cliente
    const pedidosActivos = await pool.query(
      `SELECT 
         p.folio, 
         p.precio_total, 
         p.estado_flujo, 
         p.estado_pago, 
         p.fecha_creacion, 
         c.nombre AS nombre_cliente,
         c.telefono AS telefono_cliente
       FROM Pedidos p
       JOIN Clientes c ON p.cliente_id = c.id
       WHERE p.estado_flujo IN ('En Proceso', 'Listo')
       ORDER BY p.fecha_creacion ASC` // Los más antiguos primero
    );

    // 2. Responder con la lista de pedidos
    res.status(200).json(pedidosActivos.rows);

  } catch (error) {
    console.error('Error al obtener pedidos del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ... (importaciones) ...
// ... (tu función 'getPedidosDashboard' se queda igual) ...

// --- FUNCIÓN 'crearPedido' MODIFICADA ---
export const crearPedido = async (req, res) => {
  try {
    // 1. Obtenemos los nuevos datos del body
    // 'tarifa_domicilio' es opcional, si no viene, será 0
    const { cliente_id, precio_servicio, tarifa_domicilio = 0 } = req.body;

    // 2. Validación
    if (!cliente_id || !precio_servicio) {
      return res.status(400).json({ message: 'El cliente_id y el precio_servicio son requeridos' });
    }

    // 3. Lógica de negocio: es domicilio si la tarifa es mayor a 0
    const es_domicilio = Number(tarifa_domicilio) > 0;

    // 4. Guardar en la Base de Datos
    // Nota: NO insertamos 'precio_total', se genera solo.
    const nuevoPedido = await pool.query(
      `INSERT INTO Pedidos (cliente_id, precio_servicio, tarifa_domicilio, es_domicilio) 
       VALUES ($1, $2, $3, $4) RETURNING *`, // <-- MODIFICADO
      [cliente_id, precio_servicio, tarifa_domicilio, es_domicilio]
    );

    // 5. Responder al cliente (¡el 'precio_total' ya vendrá calculado!)
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

// ... (tu función 'actualizarEstadoPedido' se queda igual) ...

export const actualizarEstadoPedido = async (req, res) => {
  try {
    // 1. Obtenemos el 'folio' de los parámetros de la URL
    const { folio } = req.params;
    // 2. Obtenemos los estados que se quieren actualizar del body
    const { estado_flujo, estado_pago } = req.body;

    if (!estado_flujo && !estado_pago) {
      return res.status(400).json({ message: 'Se requiere al menos un estado (estado_flujo o estado_pago) para actualizar' });
    }

    // 3. Construimos la consulta de actualización dinámicamente
    // Esto nos permite actualizar solo uno o ambos estados
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (estado_flujo) {
      fields.push(`estado_flujo = $${paramIndex++}`);
      values.push(estado_flujo);
    }
    if (estado_pago) {
      fields.push(`estado_pago = $${paramIndex++}`);
      values.push(estado_pago);
    }

    // Añadimos el 'folio' al final para el WHERE
    values.push(folio);
    const query = `
      UPDATE Pedidos 
      SET ${fields.join(', ')} 
      WHERE folio = $${paramIndex} 
      RETURNING *`; // RETURNING * nos devuelve el pedido actualizado

    // 4. Ejecutamos la actualización
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedidoActualizado = result.rows[0];
    let mensajeRespuesta = 'Pedido actualizado exitosamente';

    // --- PASO 2.6: LÓGICA DE LEALTAD ---
    // 5. Verificamos si debemos actualizar la lealtad
    if (pedidoActualizado.estado_flujo === 'Entregado' && pedidoActualizado.estado_pago === 'Pagado') {
      
      // Usamos el cliente_id del pedido que acabamos de actualizar
      await pool.query(
        'UPDATE Clientes SET contador_servicios = contador_servicios + 1 WHERE id = $1',
        [pedidoActualizado.cliente_id]
      );
      mensajeRespuesta = 'Pedido actualizado y 1 punto de lealtad sumado al cliente';
    }

    // 6. Respondemos con éxito
    res.status(200).json({
      message: mensajeRespuesta,
      pedido: pedidoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};