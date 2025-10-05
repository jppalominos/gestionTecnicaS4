// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRbnSyy0PVVOGPzfNR-uIlKpaV7XZjAMA",
    authDomain: "gestion-tecnica-16316.firebaseapp.com",
    databaseURL: "https://gestion-tecnica-16316-default-rtdb.firebaseio.com",
    projectId: "gestion-tecnica-16316",
    storageBucket: "gestion-tecnica-16316.firebasestorage.app",
    messagingSenderId: "499818297675",
    appId: "1:499818297675:web:f20dbb7abed02d718090ce"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Referencias a las colecciones
const desarrollosRef = db.ref('desarrollos');
const fioriRef = db.ref('fiori');
const transportesRef = db.ref('transportes');

// Estado de conexión Firebase
db.ref('.info/connected').on('value', (snapshot) => {
    const statusBadge = document.getElementById('firebaseStatus');
    if (snapshot.val() === true) {
        statusBadge.innerHTML = '🟢 Conectado';
        statusBadge.classList.add('connected');
    } else {
        statusBadge.innerHTML = '🔴 Desconectado';
        statusBadge.classList.remove('connected');
    }
});

// Estado global
let currentTab = 'desarrollos';
let allDesarrollos = {};
let allFiori = {};
let allTransportes = {};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateCurrentDate();
    setupTabs();
    setupForms();
    setupFilters();
    loadAllData();
}

// Actualizar fecha
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('currentDate').textContent = date;
}

// Configurar tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Configurar formularios
function setupForms() {
    document.getElementById('desarrollosForm').addEventListener('submit', handleDesarrolloSubmit);
    document.getElementById('fioriForm').addEventListener('submit', handleFioriSubmit);
    document.getElementById('transportesForm').addEventListener('submit', handleTransporteSubmit);
}

// Configurar filtros y búsqueda
function setupFilters() {
    // Desarrollos
    document.getElementById('searchDesarrollos').addEventListener('input', applyFiltersDesarrollos);
    document.getElementById('filterDesarrollosTipo').addEventListener('change', applyFiltersDesarrollos);
    document.getElementById('filterDesarrollosEstado').addEventListener('change', applyFiltersDesarrollos);
    document.getElementById('filterDesarrollosModulo').addEventListener('change', applyFiltersDesarrollos);
    
    // Fiori
    document.getElementById('searchFiori').addEventListener('input', applyFiltersFiori);
    document.getElementById('filterFioriTipo').addEventListener('change', applyFiltersFiori);
    document.getElementById('filterFioriEstado').addEventListener('change', applyFiltersFiori);
    
    // Transportes
    document.getElementById('searchTransportes').addEventListener('input', applyFiltersTransportes);
    document.getElementById('filterTransportesTipo').addEventListener('change', applyFiltersTransportes);
    document.getElementById('filterTransportesAmbiente').addEventListener('change', applyFiltersTransportes);
    document.getElementById('filterTransportesEstado').addEventListener('change', applyFiltersTransportes);
}

// Cargar todos los datos
function loadAllData() {
    showLoading();
    Promise.all([
        loadDesarrollos(),
        loadFiori(),
        loadTransportes()
    ]).then(() => {
        hideLoading();
        updateKPIs();
    });
}

// ========== DESARROLLOS ==========
function loadDesarrollos() {
    return new Promise((resolve) => {
        desarrollosRef.on('value', (snapshot) => {
            const data = snapshot.val();
            allDesarrollos = data || {};
            applyFiltersDesarrollos();
            resolve();
        });
    });
}

function applyFiltersDesarrollos() {
    const searchTerm = document.getElementById('searchDesarrollos').value.toLowerCase();
    const filterTipo = document.getElementById('filterDesarrollosTipo').value;
    const filterEstado = document.getElementById('filterDesarrollosEstado').value;
    const filterModulo = document.getElementById('filterDesarrollosModulo').value;
    
    const filtered = Object.entries(allDesarrollos).filter(([key, item]) => {
        const matchSearch = !searchTerm || 
            item.id.toLowerCase().includes(searchTerm) ||
            item.nombre.toLowerCase().includes(searchTerm) ||
            item.desarrollador.toLowerCase().includes(searchTerm) ||
            item.funcional.toLowerCase().includes(searchTerm);
        
        const matchTipo = !filterTipo || item.tipo === filterTipo;
        const matchEstado = !filterEstado || item.estado === filterEstado;
        const matchModulo = !filterModulo || item.modulo === filterModulo;
        
        return matchSearch && matchTipo && matchEstado && matchModulo;
    });
    
    renderDesarrollos(Object.fromEntries(filtered));
}

function clearFiltersDesarrollos() {
    document.getElementById('searchDesarrollos').value = '';
    document.getElementById('filterDesarrollosTipo').value = '';
    document.getElementById('filterDesarrollosEstado').value = '';
    document.getElementById('filterDesarrollosModulo').value = '';
    applyFiltersDesarrollos();
}

function renderDesarrollos(data) {
    const tbody = document.getElementById('desarrollosBody');
    tbody.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center;">No se encontraron desarrollos</td></tr>';
        return;
    }
    
    Object.entries(data).forEach(([key, item]) => {
        const row = `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.nombre}</td>
                <td><span class="badge badge-dev">${item.tipo}</span></td>
                <td>${item.modulo}</td>
                <td>${item.funcional}</td>
                <td>${item.desarrollador}</td>
                <td><span class="badge badge-${normalizeClass(item.estado)}">${item.estado}</span></td>
                <td>${item.ot || '-'}</td>
                <td>${item.fecha_inicio}</td>
                <td>${item.fecha_termino || '-'}</td>
                <td style="white-space: nowrap;">
                    <button class="btn-edit" onclick="editDesarrollo('${key}')">✏️</button>
                    <button class="btn-delete" onclick="deleteDesarrollo('${key}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleDesarrolloSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const key = document.getElementById('desarrollo_key').value;
    const data = {
        id: document.getElementById('desarrollo_id').value,
        nombre: document.getElementById('desarrollo_nombre').value,
        tipo: document.getElementById('desarrollo_tipo').value,
        modulo: document.getElementById('desarrollo_modulo').value,
        funcional: document.getElementById('desarrollo_funcional').value,
        desarrollador: document.getElementById('desarrollo_desarrollador').value,
        estado: document.getElementById('desarrollo_estado').value,
        ot: document.getElementById('desarrollo_ot').value || null,
        fecha_inicio: document.getElementById('desarrollo_fecha_inicio').value,
        fecha_termino: document.getElementById('desarrollo_fecha_termino').value || null,
        observaciones: document.getElementById('desarrollo_observaciones').value || null
    };
    
    if (key) {
        desarrollosRef.child(key).update(data).then(() => {
            hideLoading();
            closeModal('desarrollosModal');
            showNotification('Desarrollo actualizado correctamente');
            updateKPIs();
        });
    } else {
        desarrollosRef.push(data).then(() => {
            hideLoading();
            closeModal('desarrollosModal');
            showNotification('Desarrollo creado correctamente');
            updateKPIs();
        });
    }
}

function editDesarrollo(key) {
    desarrollosRef.child(key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('desarrollo_key').value = key;
        document.getElementById('desarrollo_id').value = data.id;
        document.getElementById('desarrollo_nombre').value = data.nombre;
        document.getElementById('desarrollo_tipo').value = data.tipo;
        document.getElementById('desarrollo_modulo').value = data.modulo;
        document.getElementById('desarrollo_funcional').value = data.funcional;
        document.getElementById('desarrollo_desarrollador').value = data.desarrollador;
        document.getElementById('desarrollo_estado').value = data.estado;
        document.getElementById('desarrollo_ot').value = data.ot || '';
        document.getElementById('desarrollo_fecha_inicio').value = data.fecha_inicio;
        document.getElementById('desarrollo_fecha_termino').value = data.fecha_termino || '';
        document.getElementById('desarrollo_observaciones').value = data.observaciones || '';
        document.getElementById('desarrollosModalTitle').textContent = 'Editar Desarrollo';
        document.getElementById('desarrollo_id').disabled = true;
        openModal('desarrollosModal');
    });
}

function deleteDesarrollo(key) {
    if (confirm('¿Estás seguro de eliminar este desarrollo?')) {
        showLoading();
        desarrollosRef.child(key).remove().then(() => {
            hideLoading();
            showNotification('Desarrollo eliminado correctamente');
            updateKPIs();
        });
    }
}

// ========== FIORI ==========
function loadFiori() {
    return new Promise((resolve) => {
        fioriRef.on('value', (snapshot) => {
            const data = snapshot.val();
            allFiori = data || {};
            applyFiltersFiori();
            resolve();
        });
    });
}

function applyFiltersFiori() {
    const searchTerm = document.getElementById('searchFiori').value.toLowerCase();
    const filterTipo = document.getElementById('filterFioriTipo').value;
    const filterEstado = document.getElementById('filterFioriEstado').value;
    
    const filtered = Object.entries(allFiori).filter(([key, item]) => {
        const matchSearch = !searchTerm || 
            item.id.toLowerCase().includes(searchTerm) ||
            item.nombre.toLowerCase().includes(searchTerm) ||
            item.semantic.toLowerCase().includes(searchTerm) ||
            item.desarrollador.toLowerCase().includes(searchTerm);
        
        const matchTipo = !filterTipo || item.tipo === filterTipo;
        const matchEstado = !filterEstado || item.estado === filterEstado;
        
        return matchSearch && matchTipo && matchEstado;
    });
    
    renderFiori(Object.fromEntries(filtered));
}

function clearFiltersFiori() {
    document.getElementById('searchFiori').value = '';
    document.getElementById('filterFioriTipo').value = '';
    document.getElementById('filterFioriEstado').value = '';
    applyFiltersFiori();
}

function renderFiori(data) {
    const tbody = document.getElementById('fioriBody');
    tbody.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No se encontraron aplicaciones</td></tr>';
        return;
    }
    
    Object.entries(data).forEach(([key, item]) => {
        const row = `
            <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.nombre}</td>
                <td><span class="badge badge-qas">${item.tipo}</span></td>
                <td>${item.tx_app}</td>
                <td>${item.semantic}</td>
                <td>${item.catalogo}</td>
                <td>${item.desarrollador}</td>
                <td><span class="badge badge-${normalizeClass(item.estado)}">${item.estado}</span></td>
                <td>${item.fecha}</td>
                <td style="white-space: nowrap;">
                    <button class="btn-edit" onclick="editFiori('${key}')">✏️</button>
                    <button class="btn-delete" onclick="deleteFiori('${key}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleFioriSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const key = document.getElementById('fiori_key').value;
    const data = {
        id: document.getElementById('fiori_id').value,
        nombre: document.getElementById('fiori_nombre').value,
        tipo: document.getElementById('fiori_tipo').value,
        tx_app: document.getElementById('fiori_tx_app').value,
        semantic: document.getElementById('fiori_semantic').value,
        catalogo: document.getElementById('fiori_catalogo').value,
        desarrollador: document.getElementById('fiori_desarrollador').value,
        estado: document.getElementById('fiori_estado').value,
        fecha: document.getElementById('fiori_fecha').value
    };
    
    if (key) {
        fioriRef.child(key).update(data).then(() => {
            hideLoading();
            closeModal('fioriModal');
            showNotification('Aplicación actualizada correctamente');
            updateKPIs();
        });
    } else {
        fioriRef.push(data).then(() => {
            hideLoading();
            closeModal('fioriModal');
            showNotification('Aplicación creada correctamente');
            updateKPIs();
        });
    }
}

function editFiori(key) {
    fioriRef.child(key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('fiori_key').value = key;
        document.getElementById('fiori_id').value = data.id;
        document.getElementById('fiori_nombre').value = data.nombre;
        document.getElementById('fiori_tipo').value = data.tipo;
        document.getElementById('fiori_tx_app').value = data.tx_app;
        document.getElementById('fiori_semantic').value = data.semantic;
        document.getElementById('fiori_catalogo').value = data.catalogo;
        document.getElementById('fiori_desarrollador').value = data.desarrollador;
        document.getElementById('fiori_estado').value = data.estado;
        document.getElementById('fiori_fecha').value = data.fecha;
        document.getElementById('fioriModalTitle').textContent = 'Editar Aplicación Fiori';
        document.getElementById('fiori_id').disabled = true;
        openModal('fioriModal');
    });
}

function deleteFiori(key) {
    if (confirm('¿Estás seguro de eliminar esta aplicación?')) {
        showLoading();
        fioriRef.child(key).remove().then(() => {
            hideLoading();
            showNotification('Aplicación eliminada correctamente');
            updateKPIs();
        });
    }
}

// ========== TRANSPORTES ==========
function loadTransportes() {
    return new Promise((resolve) => {
        transportesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            allTransportes = data || {};
            applyFiltersTransportes();
            resolve();
        });
    });
}

function applyFiltersTransportes() {
    const searchTerm = document.getElementById('searchTransportes').value.toLowerCase();
    const filterTipo = document.getElementById('filterTransportesTipo').value;
    const filterAmbiente = document.getElementById('filterTransportesAmbiente').value;
    const filterEstado = document.getElementById('filterTransportesEstado').value;
    
    const filtered = Object.entries(allTransportes).filter(([key, item]) => {
        const matchSearch = !searchTerm || 
            item.orden.toLowerCase().includes(searchTerm) ||
            item.descripcion.toLowerCase().includes(searchTerm) ||
            item.solicitante.toLowerCase().includes(searchTerm);
        
        const matchTipo = !filterTipo || item.tipo === filterTipo;
        const matchAmbiente = !filterAmbiente || item.ambiente === filterAmbiente;
        const matchEstado = !filterEstado || item.estado === filterEstado;
        
        return matchSearch && matchTipo && matchAmbiente && matchEstado;
    });
    
    renderTransportes(Object.fromEntries(filtered));
}

function clearFiltersTransportes() {
    document.getElementById('searchTransportes').value = '';
    document.getElementById('filterTransportesTipo').value = '';
    document.getElementById('filterTransportesAmbiente').value = '';
    document.getElementById('filterTransportesEstado').value = '';
    applyFiltersTransportes();
}

function renderTransportes(data) {
    const tbody = document.getElementById('transportesBody');
    tbody.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No se encontraron órdenes</td></tr>';
        return;
    }
    
    Object.entries(data).forEach(([key, item]) => {
        const row = `
            <tr>
                <td><strong>${item.orden}</strong></td>
                <td><span class="badge badge-dev">${item.tipo}</span></td>
                <td>${item.descripcion}</td>
                <td><span class="badge badge-${item.ambiente.toLowerCase()}">${item.ambiente}</span></td>
                <td><span class="badge badge-${normalizeClass(item.estado)}">${item.estado}</span></td>
                <td>${item.usuario_sap}</td>
                <td>${item.fecha}</td>
                <td style="white-space: nowrap;">
                    <button class="btn-edit" onclick="editTransporte('${key}')">✏️</button>
                    <button class="btn-delete" onclick="deleteTransporte('${key}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function handleTransporteSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const key = document.getElementById('transporte_key').value;
    const data = {
        orden: document.getElementById('transporte_orden').value,
        tipo: document.getElementById('transporte_tipo').value,
        descripcion: document.getElementById('transporte_descripcion').value,
        ambiente: document.getElementById('transporte_ambiente').value,
        estado: document.getElementById('transporte_estado').value,
        usuario_sap: document.getElementById('transporte_usuario_sap').value,
        fecha: document.getElementById('transporte_fecha').value
    };
    
    if (key) {
        transportesRef.child(key).update(data).then(() => {
            hideLoading();
            closeModal('transportesModal');
            showNotification('Orden actualizada correctamente');
            updateKPIs();
        });
    } else {
        transportesRef.push(data).then(() => {
            hideLoading();
            closeModal('transportesModal');
            showNotification('Orden creada correctamente');
            updateKPIs();
        });
    }
}

function editTransporte(key) {
    transportesRef.child(key).once('value', (snapshot) => {
        const data = snapshot.val();
        document.getElementById('transporte_key').value = key;
        document.getElementById('transporte_orden').value = data.orden;
        document.getElementById('transporte_tipo').value = data.tipo;
        document.getElementById('transporte_descripcion').value = data.descripcion;
        document.getElementById('transporte_ambiente').value = data.ambiente;
        document.getElementById('transporte_estado').value = data.estado;
        document.getElementById('transporte_usuario_sap').value = data.usuario_sap;
        document.getElementById('transporte_fecha').value = data.fecha;
        document.getElementById('transportesModalTitle').textContent = 'Editar Orden de Transporte';
        openModal('transportesModal');
    });
}

function deleteTransporte(key) {
    if (confirm('¿Estás seguro de eliminar esta orden?')) {
        showLoading();
        transportesRef.child(key).remove().then(() => {
            hideLoading();
            showNotification('Orden eliminada correctamente');
            updateKPIs();
        });
    }
}

// ========== KPIs ==========
function updateKPIs() {
    Promise.all([
        desarrollosRef.once('value'),
        fioriRef.once('value'),
        transportesRef.once('value')
    ]).then(([desarrollosSnap, fioriSnap, transportesSnap]) => {
        const desarrollos = desarrollosSnap.val() || {};
        const fiori = fioriSnap.val() || {};
        const transportes = transportesSnap.val() || {};
        
        // KPIs Desarrollos - Nueva lógica
        const desarrollosArray = Object.values(desarrollos);
        const totalDesarrollos = desarrollosArray.length;
        const desarrollosPendientes = desarrollosArray.filter(d => d.estado === 'PENDIENTE').length;
        const desarrollosTerminados = desarrollosArray.filter(d => d.estado === 'TERMINADO').length;
        const desarrollosEnProceso = totalDesarrollos - desarrollosPendientes - desarrollosTerminados;
        
        animateNumber('totalDesarrollos', totalDesarrollos);
        animateNumber('desarrollosPendientes', desarrollosPendientes);
        animateNumber('desarrollosEnProceso', desarrollosEnProceso);
        animateNumber('desarrollosTerminados', desarrollosTerminados);
        
        // KPIs Fiori
        const fioriArray = Object.values(fiori);
        const totalFiori = fioriArray.length;
        const fioriEstandar = fioriArray.filter(f => f.tipo === 'Transacción Estándar').length;
        const fioriZ = fioriArray.filter(f => f.tipo === 'Transacción Z').length;
        const fioriApps = fioriArray.filter(f => f.tipo === 'App Fiori').length;
        
        animateNumber('totalFiori', totalFiori);
        animateNumber('fioriEstandar', fioriEstandar);
        animateNumber('fioriZ', fioriZ);
        animateNumber('fioriApps', fioriApps);
        
        // KPIs Transportes
        const transportesArray = Object.values(transportes);
        const totalOTs = transportesArray.length;
        const otsDEV = transportesArray.filter(t => t.ambiente === 'DEV').length;
        const otsQAS = transportesArray.filter(t => t.ambiente === 'QAS').length;
        const otsPRD = transportesArray.filter(t => t.ambiente === 'PRD').length;
        
        animateNumber('totalOTs', totalOTs);
        animateNumber('otsDEV', otsDEV);
        animateNumber('otsQAS', otsQAS);
        animateNumber('otsPRD', otsPRD);
    });
}

// Animar números de KPIs
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    
    if (currentValue === targetValue) return;
    
    element.classList.add('updating');
    
    const duration = 800;
    const steps = 30;
    const stepValue = (targetValue - currentValue) / steps;
    const stepDuration = duration / steps;
    
    let current = currentValue;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += stepValue;
        
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
            setTimeout(() => {
                element.classList.remove('updating');
            }, 100);
        } else {
            element.textContent = Math.round(current);
        }
    }, stepDuration);
}

// ========== MODAL ==========
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    
    if (modalId === 'desarrollosModal' && !document.getElementById('desarrollo_key').value) {
        document.getElementById('desarrollosForm').reset();
        document.getElementById('desarrollosModalTitle').textContent = 'Nuevo Desarrollo';
        document.getElementById('desarrollo_id').disabled = false;
    }
    if (modalId === 'fioriModal' && !document.getElementById('fiori_key').value) {
        document.getElementById('fioriForm').reset();
        document.getElementById('fioriModalTitle').textContent = 'Nueva Aplicación Fiori';
        document.getElementById('fiori_id').disabled = false;
    }
    if (modalId === 'transportesModal' && !document.getElementById('transporte_key').value) {
        document.getElementById('transportesForm').reset();
        document.getElementById('transportesModalTitle').textContent = 'Nueva Orden de Transporte';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    
    if (modalId === 'desarrollosModal') {
        document.getElementById('desarrollosForm').reset();
        document.getElementById('desarrollo_key').value = '';
        document.getElementById('desarrollo_id').disabled = false;
    }
    if (modalId === 'fioriModal') {
        document.getElementById('fioriForm').reset();
        document.getElementById('fiori_key').value = '';
        document.getElementById('fiori_id').disabled = false;
    }
    if (modalId === 'transportesModal') {
        document.getElementById('transportesForm').reset();
        document.getElementById('transporte_key').value = '';
    }
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// ========== UTILIDADES ==========
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function showNotification(message) {
    alert(message);
}

function normalizeClass(str) {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '');
}