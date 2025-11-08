// frontend/src/dashboard.js
import { getDashboardPedidos, actualizarEstadoPedido, toggleDomicilio, buscarCliente } from './services/api.js';

// --- CONSTANTES ---
// (Necesarias para la lógica del ticket de lealtad)
const PUNTOS_PARA_GRATIS = 9;

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Elementos del DOM ---
  const pedidosTbody = document.querySelector('#pedidos-lista-body');
  const token = localStorage.getItem('lavander_token');
  const userString = localStorage.getItem('lavander_user');

  // --- 2. Verificación de Seguridad ---
  if (!token || !userString) {
    localStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  // --- 3. Setup Inicial ---
  setupNavigation();
  setupRoles();
  cargarPedidos();

  // Cierra menús abiertos si haces clic fuera
  window.addEventListener('click', (event) => {
    if (!event.target.closest('.acciones-container')) {
      document.querySelectorAll('.acciones-menu.visible').forEach(menu => {
        menu.classList.remove('visible');
      });
    }
  });

  // --- Lógica de Navegación (Tus enlaces del Sidebar) ---
  function setupNavigation() {
    document.querySelector('#nav-dashboard').addEventListener('click', (e) => e.preventDefault());
    document.querySelector('#nav-crear-orden').addEventListener('click', (e) => window.location.href = 'new_order.html');
    document.querySelector('#nav-clientes').addEventListener('click', (e) => window.location.href = 'gestion_clientes.html');
    document.querySelector('#nav-historial').addEventListener('click', (e) => window.location.href = 'historial_pedidos.html');
    document.querySelector('#btn-crear-orden').addEventListener('click', () => window.location.href = 'new_order.html');
    document.querySelector('.logout').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'index.html';
    });
    const contabilidadBtn = document.querySelector('#nav-contabilidad');
    if (contabilidadBtn) contabilidadBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Página en construcción'); });
  }

  // --- Lógica de Roles ---
  function setupRoles() {
    const user = JSON.parse(userString);
    if (user.rol !== 'admin') {
      const contabilidadBtn = document.querySelector('#nav-contabilidad');
      if (contabilidadBtn) contabilidadBtn.style.display = 'none';
    }
  }

  // --- Función Principal: Cargar Pedidos ---
  async function cargarPedidos() {
    try {
      const pedidos = await getDashboardPedidos(token);
      pedidosTbody.innerHTML = '';

      if (pedidos.length === 0) {
        pedidosTbody.innerHTML = '<tr><td colspan="6">No hay pedidos en curso. ¡Buen trabajo!</td></tr>';
        return;
      }
      pedidos.forEach(pedido => {
        pedidosTbody.appendChild(crearFilaPedido(pedido));
      });
    } catch (error) {
      console.error('Error al cargar pedidos:', error.message);
      pedidosTbody.innerHTML = `<tr><td colspan="6" class="error">Error al cargar pedidos: ${error.message}</td></tr>`;
    }
  };


  // --- FUNCIÓN DE CREAR FILA (Estilo Odoo-Lista) ---
  function crearFilaPedido(pedido) {
    const tr = document.createElement('tr');

    // Lógica de Tiempo y Estado
    const fechaCreacion = new Date(pedido.fecha_creacion);
    const fechaEntregaMax = new Date(fechaCreacion.getTime() + 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const horasPasadas = (ahora.getTime() - fechaCreacion.getTime()) / 3600000;

    let estadoTiempoTag = '';
    if (horasPasadas < 18) {
      estadoTiempoTag = `<span class="estado-badge estado-entregado">A Tiempo</span>`;
    } else if (horasPasadas >= 18 && horasPasadas < 24) {
      estadoTiempoTag = `<span class="estado-badge estado-pendiente">Demorado</span>`;
    } else {
      estadoTiempoTag = `<span class="estado-badge estado-cancelado">Atrasado</span>`;
    }

    // Formateadores
    const formatFechaHora = (fecha) => `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    const formatMoneda = (valor) => valor ? `$${Number(valor).toFixed(2)}` : '$0.00';

    // Definir Etiquetas (Tags)
    let estadoFlujoTag = '';
    if (pedido.estado_flujo === 'En Proceso') {
      estadoFlujoTag = `<span class="estado-badge estado-pendiente">En Proceso</span>`;
    } else if (pedido.estado_flujo === 'Listo') {
      estadoFlujoTag = `<span class="estado-badge estado-entregado">Listo</span>`;
    }
    const estadoPagoTag = pedido.estado_pago === 'Pagado' ? `<span class="estado-badge estado-entregado">Pagado</span>` : `<span class="estado-badge estado-pendiente">Pendiente</span>`;
    const domicilioTag = pedido.es_domicilio ? `<span class="estado-badge tag-domicilio">Domicilio</span>` : '';

    // Definir Botones de Acción
    let botonesMenu = '';
    if (pedido.estado_flujo === 'En Proceso') {
      botonesMenu += `<button class="btn-actualizar-estado" data-folio="${pedido.folio}" data-nuevo-estado="Listo">Marcar Listo</button>`;
    } else if (pedido.estado_flujo === 'Listo') {
      botonesMenu += `<button class="btn-actualizar-estado" data-folio="${pedido.folio}" data-nuevo-estado="Entregado" data-nuevo-pago="Pagado">Entregar y Pagar</button>`;
      if (pedido.telefono_cliente) {
        botonesMenu += `<button class="btn-avisar-listo" data-folio="${pedido.folio}" data-telefono="${pedido.telefono_cliente}" data-nombre="${pedido.nombre_cliente}">Avisar (WhatsApp)</button>`;
      }
    }
    if (pedido.es_domicilio) {
      botonesMenu += `<button class="btn-toggle-domicilio danger" data-folio="${pedido.folio}" data-accion="quitar">Quitar Domicilio</button>`;
    } else {
      botonesMenu += `<button class="btn-toggle-domicilio" data-folio="${pedido.folio}" data-accion="agregar">Agregar Domicilio</button>`;
    }
    botonesMenu += `<button class="btn-reenviar-ticket" data-folio="${pedido.folio}" data-telefono="${pedido.telefono_cliente}" data-nombre="${pedido.nombre_cliente}">Reenviar Ticket (WA)</button>`;
    if (pedido.estado_flujo !== 'Listo') {
      botonesMenu += `<button class="btn-actualizar-estado danger" data-folio="${pedido.folio}" data-nuevo-estado="Cancelado">Cancelar Pedido</button>`;
    }

    // Construir el HTML de la FILA (<tr>)
    tr.innerHTML = `
      <td data-label="Cliente">
        <strong>${pedido.nombre_cliente}</strong>
        <small>${pedido.folio.substring(0, 8)}...</small>
      </td>
      <td data-label="Hora Pedido">${formatFechaHora(fechaCreacion)}</td>
      <td data-label="Entrega Máx.">${formatFechaHora(fechaEntregaMax)}</td>
      <td data-label="Total">
        <strong class="precio-total-tabla">${formatMoneda(pedido.precio_total)}</strong>
      </td>
      <td data-label="Estado">
        <div class="tags-container">
          <div>${estadoFlujoTag}</div>
          <div>${estadoPagoTag}</div>
          <div>${estadoTiempoTag}</div>
          <div>${domicilioTag}</div>
        </div>
      </td>
      <td data-label="Acciones">
        <div class="acciones-container">
          <button class="btn-acciones-toggle">Acciones</button>
          <div class="acciones-menu">
            ${botonesMenu}
          </div>
        </div>
      </td>
    `;

    return tr;
  };

  // --- LISTENER DE EVENTOS PRINCIPAL ---
  pedidosTbody.addEventListener('click', async (event) => {
    const boton = event.target.closest('button');
    if (!boton) return;
    event.stopPropagation();

    // --- ACCIÓN 1: Abrir/Cerrar el menú de acciones ---
    if (boton.classList.contains('btn-acciones-toggle')) {
      const menu = boton.nextElementSibling;
      document.querySelectorAll('.acciones-menu.visible').forEach(m => {
        if (m !== menu) m.classList.remove('visible');
      });
      menu.classList.toggle('visible');
      return;
    }

    // --- ACCIÓN 2: Manejar un clic DENTRO del menú ---
    const folio = boton.dataset.folio;
    if (!folio) return;

    boton.closest('.acciones-menu')?.classList.remove('visible');

    // Acción: Actualizar Estado (Listo, Entregado, Cancelar)
    if (boton.classList.contains('btn-actualizar-estado')) {
      const nuevoEstado = boton.dataset.nuevoEstado;
      const nuevoPago = boton.dataset.nuevoPago;
      let datosActualizados = { estado_flujo: nuevoEstado };
      if (nuevoPago) datosActualizados.estado_pago = nuevoPago;

      let confirmMessage = `¿Marcar pedido como "${nuevoEstado}"?`;
      if (nuevoEstado === 'Entregado') confirmMessage = `¿Confirmar entrega y pago? (Sumará +1 a lealtad).`;
      if (nuevoEstado === 'Cancelado') confirmMessage = `¿ESTÁS SEGURO DE CANCELAR ESTE PEDIDO?`;

      if (!confirm(confirmMessage)) return;

      try {
        await actualizarEstadoPedido(folio, datosActualizados, token);
        await cargarPedidos();
      } catch (error) { alert(`Error: ${error.message}`); }
    }

    // Acción: Agregar/Quitar Domicilio
    else if (boton.classList.contains('btn-toggle-domicilio')) {
      const accion = boton.dataset.accion;
      const esDomicilio = (accion === 'agregar');
      const confirmMessage = esDomicilio ? `¿Añadir servicio a domicilio por $30.00?` : `¿Quitar servicio a domicilio y restar $30.00?`;

      if (!confirm(confirmMessage)) return;

      try {
        await toggleDomicilio(folio, esDomicilio, token);
        await cargarPedidos();
      } catch (error) { alert(`Error: ${error.message}`); }
    }

    // Acción: Avisar que está Listo (WhatsApp)
    else if (boton.classList.contains('btn-avisar-listo')) {
      const telefono = boton.dataset.telefono;
      const nombre = boton.dataset.nombre;

      const mensaje = encodeURIComponent(`¡Hola ${nombre}! 👋 Tu pedido de Mayaclean está listo para recoger.`);
      const waLink = `https://wa.me/52${telefono}?text=${mensaje}`;
      window.open(waLink, '_blank');
    }

    // Acción: Reenviar Ticket (WhatsApp)
    else if (boton.classList.contains('btn-reenviar-ticket')) {
      const telefono = boton.dataset.telefono;
      const nombre = boton.dataset.nombre;
      let cliente = null;
      try {
        const dataCliente = await buscarCliente(telefono, token);
        cliente = dataCliente.cliente;
      } catch (e) {
        console.error("No se pudo encontrar el cliente para el ticket");
        cliente = { contador_servicios: 0 }; // Fallback
      }

      // Volvemos a buscar el pedido para tener los datos más frescos
      const pedido = (await getDashboardPedidos(token)).find(p => p.folio === folio);
      if (!pedido) return;

      // --- Lógica de Contador de Lealtad (SIN EMOJIS) ---
      const lealtadProgreso = `Progreso Actual: ${cliente.contador_servicios}/${PUNTOS_PARA_GRATIS + 1}`;

      const domicilio = pedido.es_domicilio ? 'Sí' : 'No';
      const folioCorto = pedido.folio.substring(0, 8);

      // Construye el mensaje con saltos de línea %0A
      const mensaje =
        `*Reenvío de Ticket Mayaclean*%0A%0A` +
        `¡Hola ${encodeURIComponent(nombre)}! 👋%0A` +
        `*Folio:* ${encodeURIComponent(folioCorto)}%0A` +
        `*Servicio a Domicilio:* ${encodeURIComponent(domicilio)}%0A` +
        `*TOTAL:* $${encodeURIComponent(Number(pedido.precio_total).toFixed(2))}%0A%0A` +
        `*Estado actual:* ${encodeURIComponent(pedido.estado_flujo)}%0A` +
        `*Progreso Lealtad:* ${encodeURIComponent(lealtadProgreso)}`;

      const waLink = `https://wa.me/52${telefono}?text=${mensaje}`;
      window.open(waLink, '_blank');
    }
  });
});