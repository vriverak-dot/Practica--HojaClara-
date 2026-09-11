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

const state = {}; // Guarda { raw: "=A1+2", value: 5 }
let celdaActiva = null;

function guardarCelda(id, contenido) {
    state[id].raw = contenido;

    // Registro de dependencias (Nivel 4)
    dependenciasDetectadas.forEach(dep => {
        if (!dependencias[dep]) dependencias[dep] = [];
        if (!dependencias[dep].includes(id)) dependencias[dep].push(id);
    });

    // Guardado y evaluación
    if (contenido.startsWith('=')) {
        evaluarFormula(id); // Llama al motor del Nivel 3
    } else {
        state[id].value = isNaN(contenido) || contenido === "" ? contenido : Number(contenido);
    }
    
    // Recálculo en cascada (Nivel 4)
    if (dependencias[id]) {
        dependencias[id].forEach(celdaDependiente => guardarCelda(celdaDependiente, state[celdaDependiente].raw));
    }
}

// ===========================
// NIVEL 3: MOTOR MATEMÁTICO
// ===========================

function evaluarFormula(id) {
    let formula = state[id].raw.substring(1).toUpperCase(); 
    try {
        state[id].value = analizarExpresion(formula);
    } catch (e) {
        // Nivel 6: Manejo de Errores Matemáticos
        state[id].value = e.message.startsWith('#') ? e.message : "#ERROR!";
    }
}

function analizarExpresion(exp) {
    exp = exp.replace(/\s+/g, ''); // Quitar espacios

    function evaluarOperaciones(cadena) {
        if (!cadena) return 0;
        
        // Resolver paréntesis
        if (cadena.startsWith('(') && cadena.endsWith(')')) {
            let bal = 0; let bloqueUnico = true;
            for(let i=0; i<cadena.length-1; i++) {
                if(cadena[i] === '(') bal++;
                if(cadena[i] === ')') bal--;
                if(bal === 0) { bloqueUnico = false; break; }
            }
            if(bloqueUnico) return evaluarOperaciones(cadena.substring(1, cadena.length-1));
        }

        let balance = 0;

        // Sumas y restas 
        for (let i = cadena.length - 1; i >= 0; i--) {
            if (cadena[i] === ')') balance++;
            if (cadena[i] === '(') balance--;
            if (balance === 0 && (cadena[i] === '+' || (cadena[i] === '-' && i > 0 && !'+-*/('.includes(cadena[i-1])))) {
                let izq = evaluarOperaciones(cadena.substring(0, i));
                let der = evaluarOperaciones(cadena.substring(i + 1));
                return cadena[i] === '+' ? izq + der : izq - der;
            }
        }
        
        // Multiplicaciones y divisiones
        balance = 0;
        for (let i = cadena.length - 1; i >= 0; i--) {
            if (cadena[i] === ')') balance++;
            if (cadena[i] === '(') balance--;
            if (balance === 0 && (cadena[i] === '*' || cadena[i] === '/')) {
                let izq = evaluarOperaciones(cadena.substring(0, i));
                let der = evaluarOperaciones(cadena.substring(i + 1));
        }
        
        let numero = parseFloat(cadena);
        if (isNaN(numero)) throw new Error("#ERROR!");
        return numero;
    }
    return evaluarOperaciones(exp);
}

// ====================================
// NIVEL 4: DEPENDENCIAS Y REFERENCIAS
// ====================================

const dependencias = {}; // Almacena qué celdas afectan a cuáles

function reemplazarReferencias(cadena) {
    return cadena.replace(/[A-Z]+\d+/g, (match) => {
        let valorCelda = state[match] ? state[match].value : 0;
        if (String(valorCelda).startsWith('#')) throw new Error(valorCelda);
        return isNaN(valorCelda) || valorCelda === "" ? 0 : valorCelda; 
    });
}


