// ============================================
// script.js - Cochinita Taquería
// Sistema de Reservas (v5.0)
// ============================================

// Configuración de mesas
const CONFIG = {
    mesas: {
        grandes: { cantidad: 2, capacidad: 20 },
        medianas: { cantidad: 5, capacidad: 4 },
        pequenas: { cantidad: 5, capacidad: 2 }
    },
    bloques: ['13-15', '15-17', '17-19', '19-21'],
    capacidadMaximaBloque: 70,
    horarios: {
        '13-15': '13:00 - 15:00',
        '15-17': '15:00 - 17:00',
        '17-19': '17:00 - 19:00',
        '19-21': '19:00 - 21:00'
    }
};

// Validación de teléfono chileno
function validarTelefono(telefono) {
    // Eliminar espacios y guiones
    const tel = telefono.replace(/[\s-]/g, '');
    
    // Patrones: +569XXXXXXXX, +562XXXXXXXX, 569XXXXXXXX, 562XXXXXXXX
    const patronMovil = /^(\+56|56)?9\d{8}$/;
    const patronFijo = /^(\+56|56)?2\d{8}$/;
    
    return patronMovil.test(tel) || patronFijo.test(tel);
}

// Formatear teléfono para mostrar
function formatearTelefono(telefono) {
    const tel = telefono.replace(/[\s-]/g, '');
    if (tel.startsWith('+')) {
        return tel.replace(/(\+\d{2})(\d{1})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    return tel.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '+$1 $2 $3 $4');
}

// Validar fecha (no permitir fechas pasadas)
function validarFecha(fecha) {
    const fechaSeleccionada = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaSeleccionada >= hoy;
}

// Obtener reservas de localStorage
function getReservas() {
    return JSON.parse(localStorage.getItem('reservas')) || [];
}

// Guardar reservas en localStorage
function guardarReservas(reservas) {
    localStorage.setItem('reservas', JSON.stringify(reservas));
}

// Calcular ocupación de un bloque específico
function calcularOcupacionBloque(fecha, bloque) {
    const reservas = getReservas();
    return reservas.filter(r => r.fecha === fecha && r.bloque === bloque);
}

// Verificar disponibilidad de mesas
function verificarDisponibilidad(personas, ocupacionActual) {
    const personasOcupadas = ocupacionActual.reduce((sum, r) => sum + r.personas, 0);
    const disponibles = CONFIG.capacidadMaximaBloque - personasOcupadas;
    
    if (personas > disponibles) {
        return { disponible: false, mensaje: `No hay suficiente capacidad. Disponibles: ${disponibles} personas` };
    }
    
    // Calcular mesas disponibles
    const mesasOcupadas = ocupacionActual.reduce((acc, r) => {
        acc.grandes += r.mesasAsignadas.grandes;
        acc.medianas += r.mesasAsignadas.medianas;
        acc.pequenas += r.mesasAsignadas.pequenas;
        return acc;
    }, { grandes: 0, medianas: 0, pequenas: 0 });
    
    const mesasDisponibles = {
        grandes: CONFIG.mesas.grandes.cantidad - mesasOcupadas.grandes,
        medianas: CONFIG.mesas.medianas.cantidad - mesasOcupadas.medianas,
        pequenas: CONFIG.mesas.pequenas.cantidad - mesasOcupadas.pequenas
    };
    
    return asignarMesas(personas, mesasDisponibles);
}

// Asignar mesas según cantidad de personas
function asignarMesas(personas, mesasDisponibles) {
    let personasRestantes = personas;
    let asignacion = { grandes: 0, medianas: 0, pequenas: 0 };
    
    // Intentar con mesas grandes primero (para grupos grandes)
    if (personasRestantes >= 20 && mesasDisponibles.grandes > 0) {
        const mesasNecesarias = Math.floor(personasRestantes / 20);
        const mesasAUsar = Math.min(mesasNecesarias, mesasDisponibles.grandes);
        asignacion.grandes = mesasAUsar;
        personasRestantes -= mesasAUsar * 20;
    }
    
    // Luego mesas medianas
    if (personasRestantes > 0 && mesasDisponibles.medianas > 0) {
        const mesasNecesarias = Math.ceil(personasRestantes / 4);
        const mesasAUsar = Math.min(mesasNecesarias, mesasDisponibles.medianas);
        asignacion.medianas = mesasAUsar;
        personasRestantes -= mesasAUsar * 4;
    }
    
    // Finalmente mesas pequeñas
    if (personasRestantes > 0 && mesasDisponibles.pequenas > 0) {
        const mesasNecesarias = Math.ceil(personasRestantes / 2);
        const mesasAUsar = Math.min(mesasNecesarias, mesasDisponibles.pequenas);
        asignacion.pequenas = mesasAUsar;
        personasRestantes -= mesasAUsar * 2;
    }
    
    if (personasRestantes > 0) {
        return { 
            disponible: false, 
            mensaje: 'No hay combinación de mesas disponible para ese número de personas' 
        };
    }
    
    return { 
        disponible: true, 
        asignacion,
        mensaje: `Mesas asignadas: ${asignacion.grandes} grandes, ${asignacion.medianas} medianas, ${asignacion.pequenas} pequeñas`
    };
}

// Actualizar información de disponibilidad
function actualizarInfoDisponibilidad() {
    const fecha = document.getElementById('fecha').value;
    const bloque = document.getElementById('bloque').value;
    const infoDiv = document.getElementById('infoDisponibilidad');
    
    if (!fecha || !bloque) {
        infoDiv.innerHTML = '<p class="text-muted">Selecciona fecha y bloque para ver disponibilidad</p>';
        return;
    }
    
    const ocupacion = calcularOcupacionBloque(fecha, bloque);
    const personasOcupadas = ocupacion.reduce((sum, r) => sum + r.personas, 0);
    const disponibles = CONFIG.capacidadMaximaBloque - personasOcupadas;
    
    // Calcular mesas disponibles
    const mesasOcupadas = ocupacion.reduce((acc, r) => {
        acc.grandes += r.mesasAsignadas.grandes;
        acc.medianas += r.mesasAsignadas.medianas;
        acc.pequenas += r.mesasAsignadas.pequenas;
        return acc;
    }, { grandes: 0, medianas: 0, pequenas: 0 });
    
    const mesasDisponibles = {
        grandes: CONFIG.mesas.grandes.cantidad - mesasOcupadas.grandes,
        medianas: CONFIG.mesas.medianas.cantidad - mesasOcupadas.medianas,
        pequenas: CONFIG.mesas.pequenas.cantidad - mesasOcupadas.pequenas
    };
    
    infoDiv.innerHTML = `
        <div class="mb-2">
            <strong>📊 Bloque ${CONFIG.horarios[bloque]}</strong>
        </div>
        <div class="progress mb-3" style="height: 25px;">
            <div class="progress-bar bg-danger" role="progressbar" 
                 style="width: ${(personasOcupadas / CONFIG.capacidadMaximaBloque * 100)}%">
                ${personasOcupadas}/70 personas
            </div>
        </div>
        <div class="row small">
            <div class="col-4">
                <span class="badge bg-danger">${mesasDisponibles.grandes}</span> mesas grandes
            </div>
            <div class="col-4">
                <span class="badge bg-warning">${mesasDisponibles.medianas}</span> mesas medianas
            </div>
            <div class="col-4">
                <span class="badge bg-success">${mesasDisponibles.pequenas}</span> mesas pequeñas
            </div>
        </div>
        <p class="mt-2 mb-0"><strong>Disponibles:</strong> ${disponibles} personas</p>
    `;
}

// Mostrar reservas del bloque seleccionado
function mostrarReservasBloque() {
    const fecha = document.getElementById('fecha').value;
    const bloque = document.getElementById('bloque').value;
    const contenedor = document.getElementById('listaReservas');
    
    if (!fecha || !bloque) {
        contenedor.innerHTML = '<p class="text-muted text-center py-3">Selecciona fecha y bloque</p>';
        return;
    }
    
    const reservas = getReservas();
    const reservasBloque = reservas
        .filter(r => r.fecha === fecha && r.bloque === bloque)
        .sort((a, b) => a.id < b.id ? 1 : -1);
    
    if (reservasBloque.length === 0) {
        contenedor.innerHTML = '<p class="text-muted text-center py-3">No hay reservas en este bloque</p>';
        return;
    }
    
    let html = '';
    reservasBloque.forEach(r => {
        html += `
            <div class="reserva-item">
                <div class="d-flex justify-content-between">
                    <strong>${r.nombre}</strong>
                    <span class="badge bg-secondary">${r.personas} pers.</span>
                </div>
                <small class="text-muted d-block">📧 ${r.email}</small>
                <small class="text-muted d-block">📞 ${r.telefono}</small>
                <small class="text-muted d-block">
                    🪑 ${r.mesasAsignadas.grandes}G / ${r.mesasAsignadas.medianas}M / ${r.mesasAsignadas.pequenas}P
                </small>
                ${r.comentarios ? `<small class="text-muted">💬 ${r.comentarios}</small>` : ''}
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

// Limpiar todas las reservas
function limpiarReservas() {
    if (confirm('¿Eliminar TODAS las reservas? (solo para pruebas)')) {
        localStorage.removeItem('reservas');
        actualizarInfoDisponibilidad();
        mostrarReservasBloque();
    }
}

// Inicializar el formulario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formReserva');
    const fechaInput = document.getElementById('fecha');
    const bloqueSelect = document.getElementById('bloque');
    
    // Configurar fecha mínima (hoy)
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;
    
    // Eventos para actualizar disponibilidad
    fechaInput.addEventListener('change', () => {
        actualizarInfoDisponibilidad();
        mostrarReservasBloque();
    });
    
    bloqueSelect.addEventListener('change', () => {
        actualizarInfoDisponibilidad();
        mostrarReservasBloque();
    });
    
    // Manejar envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener valores
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const fecha = fechaInput.value;
        const bloque = bloqueSelect.value;
        const personas = parseInt(document.getElementById('personas').value);
        const comentarios = document.getElementById('comentarios').value.trim();
        
        // Validaciones
        if (!nombre || !email || !telefono || !fecha || !bloque || !personas) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (!validarFecha(fecha)) {
            alert('La fecha no puede ser anterior a hoy');
            return;
        }
        
        if (!validarTelefono(telefono)) {
            alert('El teléfono debe ser chileno válido (+56 9 u +56 2 seguido de 8 dígitos)');
            return;
        }
        
        // Verificar disponibilidad
        const ocupacionActual = calcularOcupacionBloque(fecha, bloque);
        const disponibilidad = verificarDisponibilidad(personas, ocupacionActual);
        
        if (!disponibilidad.disponible) {
            alert(disponibilidad.mensaje);
            return;
        }
        
        // Verificar que no haya reserva duplicada (mismo nombre/email en mismo bloque)
        const reservaExistente = ocupacionActual.some(r => 
            r.nombre.toLowerCase() === nombre.toLowerCase() || 
            r.email.toLowerCase() === email.toLowerCase()
        );
        
        if (reservaExistente) {
            alert('Ya existe una reserva con ese nombre o email en este bloque');
            return;
        }
        
        // Crear reserva
        const reserva = {
            id: Date.now(),
            nombre,
            email,
            telefono: formatearTelefono(telefono),
            fecha,
            bloque,
            personas,
            comentarios,
            mesasAsignadas: disponibilidad.asignacion,
            fechaCreacion: new Date().toLocaleString('es-CL')
        };
        
        // Guardar
        const reservas = getReservas();
        reservas.push(reserva);
        guardarReservas(reservas);
        
        // Mostrar éxito
        alert(`✅ ¡Reserva confirmada!\n\n${disponibilidad.mensaje}`);
        
        // Limpiar formulario
        form.reset();
        
        // Actualizar vistas
        actualizarInfoDisponibilidad();
        mostrarReservasBloque();
    });
    
    // Mostrar estado inicial
    mostrarReservasBloque();
});

// Hacer funciones globales para los botones
window.limpiarReservas = limpiarReservas;