// ================================
// NIVEL 1. CONFIGURACIÓN BÁSICA
// ================================

let COLS = 10; 
let ROWS = 15; 

function obtenerLetraCol(index) {
    let letra = "";
    while (index >= 0) {
        letra = String.fromCharCode((index % 26) + 65) + letra;
        index = Math.floor(index / 26) - 1;
    }
    return letra;
}

function generarCuadricula() {
    const container = document.getElementById('hojaclara-container');
    if(!container) return; 
    container.innerHTML = ''; 
    const table = document.createElement('table');

    // Fila de encabezados (Letras)
    const trHead = document.createElement('tr');
    trHead.appendChild(document.createElement('th')); 
    for (let c = 0; c < COLS; c++) {
        const th = document.createElement('th');
        th.textContent = obtenerLetraCol(c);
        trHead.appendChild(th);
    }
    table.appendChild(trHead);

    // Filas de datos (Números)
    for (let r = 1; r <= ROWS; r++) {
        const tr = document.createElement('tr');
        const thRow = document.createElement('th');
        thRow.textContent = r;
        tr.appendChild(thRow);

        for (let c = 0; c < COLS; c++) {
            const td = document.createElement('td');
            const id = obtenerLetraCol(c) + r; 
            
            if (!state[id]) state[id] = { raw: "", value: "" };

            const input = document.createElement('input');
            input.id = id; 
            input.value = state[id].value;
            
            // Eventos del Nivel 2 (Interacción)
            input.addEventListener('focus', () => {
                celdaActiva = id;
                input.value = state[id].raw; // Muestra fórmula original al editar
            });
            input.addEventListener('blur', (e) => guardarCelda(id, e.target.value));

            td.appendChild(input); 
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    container.appendChild(table);
}

// ==================================================
// NIVEL 2: ESTADO INDEPENDIENTE Y LÓGICA DE EDICIÓN
// ==================================================

const state = {}; // Guarda  el contenido original y el valor evaluado de cada celda
let celdaActiva = null;

function guardarCelda(id, contenido) {
    state[id].raw = contenido;
    
    }

    // Guardado y evaluación
    if (contenido.startsWith('=')) {
        evaluarFormula(id); // Llama al motor del Nivel 3
    } else {
        state[id].value = isNaN(contenido) || contenido === "" ? contenido : Number(contenido);
    }