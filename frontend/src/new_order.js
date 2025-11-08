// frontend/src/new_order.js
import { buscarCliente, crearCliente, crearPedido } from './services/api.js';

// --- CONSTANTES DE PRECIOS ---
const PRECIO_POR_KG = 15;
const TARIFA_DOMICILIO_FIJA = 30;
const MIN_KG = 5;
const MAX_KG_GRATIS = 10;
const PUNTOS_PARA_GRATIS = 9; // El 10º pedido (9+1) es gratis

let clienteSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
  // --- SEGURIDAD ---
  const token = localStorage.getItem('lavander_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // --- NAVEGACIÓN ---
  setupNavigation();

  // --- 1. SELECCIONAR ELEMENTOS DEL DOM ---
  const formPedido = document.querySelector('.orden-form');
  const inputBuscarTelefono = document.querySelector('#telefono-buscar');
  const btnBuscar = document.querySelector('.form-row-search .btn-secondary');
  const btnMostrarNuevo = document.querySelector('#btn-mostrar-nuevo');
  const infoContainer = document.querySelector('#cliente-info-container');
  const infoNombre = document.querySelector('#cliente-nombre');
  const infoTelefono = document.querySelector('#cliente-telefono');
  const infoDireccion = document.querySelector('#cliente-direccion');
  const seccionNuevoCliente = document.querySelector('.nuevo-cliente-section');
  const inputNombreNuevo = document.querySelector('#nombre-completo');
  const inputTelefonoNuevo = document.querySelector('#telefono-nuevo');
  const inputDireccionNuevo = document.querySelector('#direccion-cliente');
  const btnGuardarCliente = seccionNuevoCliente.querySelector('.btn-secondary');
  const fieldsetPedido = document.querySelector('.pedido-fieldset');
  const inputKilos = document.querySelector('#input-kilos');
  const checkDomicilio = document.querySelector('#check-domicilio');
  const displayPrecioTotal = document.querySelector('#precio-total');
  const checkPagado = document.querySelector('#check-pagado');


  // --- 2. FUNCIONES DE AYUDA (Helpers) ---

  const seleccionarCliente = (cliente) => {
    clienteSeleccionado = cliente;
    infoNombre.textContent = cliente.nombre;
    infoTelefono.textContent = cliente.telefono;
    infoDireccion.textContent = cliente.direccion || 'N/A';
    infoContainer.classList.remove('oculto');
    seccionNuevoCliente.classList.add('oculto');
    fieldsetPedido.disabled = false;
    actualizarTotal();
  };

  const mostrarFormularioNuevoCliente = (telefonoBuscado = '') => {
    clienteSeleccionado = null;
    infoContainer.classList.add('oculto');
    fieldsetPedido.disabled = true;
    inputTelefonoNuevo.value = telefonoBuscado;
    seccionNuevoCliente.classList.remove('oculto');
    inputBuscarTelefono.value = '';
    inputNombreNuevo.focus();
    actualizarTotal();
  };

  const actualizarTotal = () => {
    let kilos = parseFloat(inputKilos.value) || 0;
    const domicilio = checkDomicilio.checked ? TARIFA_DOMICILIO_FIJA : 0;

    let servicio = 0;
    let esPedidoGratis = false;
    let descuento = 0;

    const servicioBruto = kilos * PRECIO_POR_KG;

    if (clienteSeleccionado && clienteSeleccionado.contador_servicios >= PUNTOS_PARA_GRATIS) {
      esPedidoGratis = true;
      if (kilos <= MAX_KG_GRATIS) {
        descuento = servicioBruto;
        servicio = 0;
      } else {
        descuento = MAX_KG_GRATIS * PRECIO_POR_KG;
        servicio = (kilos - MAX_KG_GRATIS) * PRECIO_POR_KG;
      }
    } else {
      servicio = servicioBruto;
    }

    const total = servicio + domicilio;

    const displayTotalEl = document.querySelector('#precio-total');
    if (esPedidoGratis) {
      displayTotalEl.innerHTML = `$${total.toFixed(2)} <span class="free-order-tag">(Descuento de $${descuento.toFixed(2)} aplicado)</span>`;
    } else {
      displayTotalEl.innerHTML = `$${total.toFixed(2)}`;
    }
  };

  const resetFormularioCompleto = () => {
    clienteSeleccionado = null;
    fieldsetPedido.disabled = true;
    infoContainer.classList.add('oculto');
    seccionNuevoCliente.classList.add('oculto');
    inputBuscarTelefono.value = '';
    inputKilos.value = MIN_KG;
    checkDomicilio.checked = false;
    checkPagado.checked = false;
    actualizarTotal();
  };


  // --- 3. EVENT LISTENERS ---

  btnBuscar.addEventListener('click', async () => {
    const telefono = inputBuscarTelefono.value;
    if (!telefono) return;
    try {
      const data = await buscarCliente(telefono, token);
      seleccionarCliente(data.cliente);
    } catch (error) {
      console.warn(error.message);
      mostrarFormularioNuevoCliente(telefono);
    }
  });

  btnMostrarNuevo.addEventListener('click', () => {
    mostrarFormularioNuevoCliente();
  });

  btnGuardarCliente.addEventListener('click', async () => {
    const datosCliente = {
      nombre: inputNombreNuevo.value,
      telefono: inputTelefonoNuevo.value,
      direccion: inputDireccionNuevo.value,
    };
    if (!datosCliente.nombre || !datosCliente.telefono) {
      alert('Nombre y teléfono son requeridos');
      return;
    }
    try {
      const data = await crearCliente(datosCliente, token);
      seleccionarCliente(data.cliente);
    } catch (error) {
      alert(`Error al guardar cliente: ${error.message}`);
    }
  });

  inputKilos.addEventListener('input', actualizarTotal);
  checkDomicilio.addEventListener('change', actualizarTotal);
  actualizarTotal(); // Calcula el total inicial

  // --- 4. Formulario Principal "Crear Pedido" ---
  formPedido.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!clienteSeleccionado) {
      alert('Debe seleccionar un cliente antes de crear un pedido.');
      return;
    }

    const kilos = parseFloat(inputKilos.value) || 0;
    if (kilos < MIN_KG) {
      alert(`El mínimo es de ${MIN_KG} kg.`);
      inputKilos.value = MIN_KG;
      actualizarTotal();
      return;
    }

    let precio_servicio = 0;
    if (clienteSeleccionado && clienteSeleccionado.contador_servicios >= PUNTOS_PARA_GRATIS) {
      precio_servicio = 0;
    } else {
      precio_servicio = kilos * PRECIO_POR_KG;
    }

    const tarifa_domicilio = checkDomicilio.checked ? TARIFA_DOMICILIO_FIJA : 0;
    const estado_pago = checkPagado.checked ? 'Pagado' : 'Pendiente';

    const datosPedido = {
      cliente_id: clienteSeleccionado.id,
      kilos: kilos,
      es_domicilio: checkDomicilio.checked,
      estado_pago: estado_pago
    };

    try {
      const data = await crearPedido(datosPedido, token);
      const pedidoCreado = data.pedido;

      const confirmacionWA = confirm(
        `${data.message}\n\n¿Deseas enviar el ticket por WhatsApp al cliente?`
      );

      if (confirmacionWA) {
        // --- ¡¡AQUÍ ESTÁ LA CORRECCIÓN DE EMOJIS!! ---

        // 1. Genera la "ruta de lealtad" con CONTADOR
        let lealtadTitulo = '';
        let lealtadProgreso = '';
        const esPedidoGratis = data.message.includes('gratis');

        if (esPedidoGratis) {
          lealtadTitulo = '¡Felicidades, usaste tu pedido gratis!';
          // El contador se reseteó a 0 en el backend
          lealtadProgreso = `Progreso: 10/${PUNTOS_PARA_GRATIS + 1}`;
        } else {
          lealtadTitulo = '¡Gracias por tu compra!';
          // El contador sumará +1 al *entregar*. Mostramos el contador actual + 1 (este pedido)
          const contadorActual = clienteSeleccionado.contador_servicios + 1;
          lealtadProgreso = `Progreso: ${contadorActual}/${PUNTOS_PARA_GRATIS + 1}`;
        }

        // 2. Genera el desglose de precios
        const precioBrutoServicio = kilos * PRECIO_POR_KG;
        const descuento = precioBrutoServicio - pedidoCreado.precio_servicio;

        const nombreCliente = clienteSeleccionado.nombre;
        const telefonoCliente = clienteSeleccionado.telefono;
        const total = pedidoCreado.precio_total;
        const folioCorto = pedidoCreado.folio.substring(0, 8);
        const domicilio = pedidoCreado.es_domicilio ? 'Sí' : 'No';

        // 3. Construye el mensaje CON saltos de línea %0A
        //    y usa encodeURIComponent SÓLO en las variables
        const mensaje =
          `¡Hola ${encodeURIComponent(nombreCliente)}! 👋%0A` +
          `Aquí está tu ticket de Mayaclean:%0A%0A` +
          `*Folio:* ${encodeURIComponent(folioCorto)}%0A` +
          `*Estado de pago:* ${encodeURIComponent(estado_pago)}%0A%0A` +
          `--- DESGLOSE ---%0A` +
          `*Servicio (Lavado ${encodeURIComponent(kilos)}kg):* $${encodeURIComponent(precioBrutoServicio.toFixed(2))}%0A` +
          `*Servicio a Domicilio:* $${encodeURIComponent(Number(pedidoCreado.tarifa_domicilio).toFixed(2))}%0A` +
          `*Descuento de Lealtad:* -$${encodeURIComponent(descuento.toFixed(2))}%0A` +
          `*TOTAL A PAGAR:* $${encodeURIComponent(Number(total).toFixed(2))}%0A%0A` +
          `--- TU LEALTAD ---%0A` +
          `${encodeURIComponent(lealtadTitulo)}%0A` +
          `${encodeURIComponent(lealtadProgreso)}%0A%0A` +
          `¡Gracias por tu preferencia!`;

        // 4. Crea el enlace (sin encodeURIComponent en el 'mensaje')
        const waLink = `https://wa.me/52${telefonoCliente}?text=${mensaje}`;
        window.open(waLink, '_blank');
      }

      alert('¡Pedido guardado! Listo para crear el siguiente.');
      resetFormularioCompleto();

    } catch (error) {
      alert(`Error al crear el pedido: ${error.message}`);
    }
  });
});


// --- FUNCIÓN DE NAVEGACIÓN ---
function setupNavigation() {
  document.querySelector('#nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
  document.querySelector('#nav-crear-orden').addEventListener('click', (e) => e.preventDefault()); // Ya está aquí
  document.querySelector('#nav-clientes').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'gestion_clientes.html'; });
  document.querySelector('#nav-historial').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'historial_pedidos.html'; });
  document.querySelector('.logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
  });

  const contabilidadBtn = document.querySelector('#nav-contabilidad');
  if (contabilidadBtn) {
    contabilidadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('¡Página de Contabilidad en construcción!');
    });
  }
}