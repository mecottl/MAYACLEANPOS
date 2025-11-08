// frontend/src/historial_pedidos.js
import { getHistorialPedidos } from './services/api.js';

let todoElHistorial = [];
const token = localStorage.getItem('lavander_token');
let searchInput;
let filtroFechaSelect; // <-- Nuevo selector

// --- NAVEGACIÓN Y SEGURIDAD ---
document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  
  setupNavigation();
  
  // 1. Asigna los inputs
  searchInput = document.querySelector('#buscar-historial');
  filtroFechaSelect = document.querySelector('#filtro-fecha'); // <-- Nuevo
  
  // 2. Configura los listeners
  setupSearch();
  setupDateFilter(); // <-- Nuevo
  
  // 3. Carga los datos (esto ahora también activará el filtro)
  cargarHistorial();
});

function setupNavigation() {
  // Asigna los listeners a CADA enlace de la sidebar
  document.querySelector('#nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
  document.querySelector('#nav-crear-orden').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'new_order.html'; });
  document.querySelector('#nav-clientes').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'gestion_clientes.html'; });
  document.querySelector('#nav-historial').addEventListener('click', (e) => e.preventDefault());
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
// --- FIN DE NAVEGACIÓN ---


// --- LÓGICA DE LA PÁGINA ---

// Carga los datos desde la API basado en el filtro de fecha
async function cargarHistorial() {
  const rango = filtroFechaSelect.value; // Obtiene el valor del filtro (ej. "30 DAY")
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = '<tr><td colspan="8">Cargando historial...</td></tr>'; // 8 columnas

  try {
    todoElHistorial = await getHistorialPedidos(token, rango); // Pasa el filtro a la API
    
    // Primero renderiza todo...
    renderizarHistorial(todoElHistorial);
    
    // ...luego revisa si hay un filtro de URL
    checkUrlParams(); 
    
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="error">Error al cargar historial: ${error.message}</td></tr>`;
  }
}

// Pinta los datos en la tabla
function renderizarHistorial(pedidos) {
  const tbody = document.querySelector('#lista-historial-body');
  tbody.innerHTML = ''; 

  if (pedidos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No se encontraron pedidos.</td></tr>'; // 8 columnas
    return;
  }

  pedidos.forEach(pedido => {
    const tr = document.createElement('tr');
    
    // --- Funciones Helper para formatear ---
    const formatFecha = (fecha) => {
      return fecha ? new Date(fecha).toLocaleDateString('es-MX') : 'N/A';
    };
    const formatMoneda = (valor) => valor ? `$${Number(valor).toFixed(2)}` : '$0.00';
    const formatEstado = (estado, claseBase) => {
      const clase = estado === 'Pagado' || estado === 'Entregado' ? 'estado-entregado' : 'estado-cancelado';
      return `<span class="estado-badge ${clase}">${estado}</span>`;
    };
    const formatDomicilio = (esDomicilio) => {
      return esDomicilio ? 'Sí' : 'No';
    };
    // --- Fin de Helpers ---

    tr.innerHTML = `
      <td>${pedido.folio.substring(0, 8)}...</td>
      <td>${pedido.nombre_cliente}</td>
      <td>${formatFecha(pedido.fecha_creacion)}</td>
      <td>${formatFecha(pedido.fecha_entrega)}</td>
      <td>${formatDomicilio(pedido.es_domicilio)}</td>
      <td><strong>${formatMoneda(pedido.precio_total)}</strong></td>
      <td>${formatEstado(pedido.estado_pago)}</td>
      <td>${formatEstado(pedido.estado_flujo)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Configura el filtro de texto
function setupSearch() {
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    
    const pedidosFiltrados = todoElHistorial.filter(pedido => {
      return (pedido.nombre_cliente && pedido.nombre_cliente.toLowerCase().includes(searchTerm)) || 
             (pedido.folio && pedido.folio.toLowerCase().includes(searchTerm)) ||
             (pedido.telefono_cliente && pedido.telefono_cliente.includes(searchTerm));
    });
    
    renderizarHistorial(pedidosFiltrados);
  });
}

// Configura el filtro de fecha
function setupDateFilter() {
  filtroFechaSelect.addEventListener('change', () => {
    // Cuando el filtro <select> cambia, vuelve a cargar todo desde la API
    cargarHistorial();
  });
}

// Revisa si la URL tiene un ?search=...
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const busqueda = urlParams.get('search'); 

  if (busqueda) {
    searchInput.value = busqueda;
    searchInput.dispatchEvent(new Event('input'));
  }
}