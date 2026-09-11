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
    
    // Extraer referencias para el Nivel 4 y Nivel 6
    let dependenciasDetectadas = contenido.startsWith('=') ? contenido.match(/[A-Z]+\d+/g) || [] : [];
    
    // Validación del Nivel 6
    if (detectarCiclo(id, dependenciasDetectadas)) {
        state[id].value = "#CIRCULAR!";
        actualizarUI(id);
        return;
    }

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
    exp = procesarFunciones(exp);  // Llama al Nivel 5
    exp = reemplazarReferencias(exp); // Llama al Nivel 4
    
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
                if (cadena[i] === '/' && der === 0) throw new Error("#DIV/0!"); // Error del Nivel 6
                return cadena[i] === '*' ? izq * der : izq / der;
            }
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

// ============================
// NIVEL 5: FUNCIONES Y RANGOS
// ============================

function procesarFunciones(exp) {
    return exp.replace(/(SUMA|PROMEDIO|MAX|MIN)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/g, (match, funcion, colIniStr, rowIniStr, colFinStr, rowFinStr) => {
        let valores = obtenerValoresRango(colIniStr, parseInt(rowIniStr), colFinStr, parseInt(rowFinStr));
        if (valores.length === 0) return 0;

        switch(funcion) {
            case 'SUMA': return valores.reduce((a, b) => a + b, 0);
            case 'PROMEDIO': return valores.reduce((a, b) => a + b, 0) / valores.length;
            case 'MAX': return Math.max(...valores);
            case 'MIN': return Math.min(...valores);
            default: return 0;
        }
    });
}

function convertirLetraANumero(letra) {
    let num = 0;
    for (let i = 0; i < letra.length; i++) num = num * 26 + (letra.charCodeAt(i) - 64);
    return num - 1; 
}

function obtenerValoresRango(colIniStr, rowIni, colFinStr, rowFin) {
    let colIni = convertirLetraANumero(colIniStr);
    let colFin = convertirLetraANumero(colFinStr);
    let valores = [];
    
    for(let c = Math.min(colIni, colFin); c <= Math.max(colIni, colFin); c++) {
        for(let r = Math.min(rowIni, rowFin); r <= Math.max(rowIni, rowFin); r++) {
            let id = obtenerLetraCol(c) + r;
            let val = Number(state[id]?.value);
            if (!isNaN(val)) valores.push(val);
        }
    }
    return valores;
}

// ===============================
// NIVEL 6: PREVENCIÓN DE ERRORES
// ===============================

function detectarCiclo(id, dependenciasDetectadas) {
    for (let dep of dependenciasDetectadas) {
        if (dep === id) return true; // Celdas que se llaman a sí mismas (Ej: A1 = A1 + 1)
        if (dependencias[id] && dependencias[id].includes(dep)) return true; // Ciclo cruzado
    }
    return false;
}

// =====================================
// NIVEL 7: PERSISTENCIA Y EXPORTACIÓN
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar datos si existen
    const guardados = JSON.parse(localStorage.getItem('hojaclara_datos'));
    if (guardados) {
        ROWS = guardados.ROWS || 15; COLS = guardados.COLS || 10;
        Object.assign(state, guardados.state);
    }
    
    generarCuadricula(); // Inicia la aplicación (Llama al Nivel 1)

    // 2. Guardar estado
    document.getElementById('btn-save')?.addEventListener('click', () => {
        localStorage.setItem('hojaclara_datos', JSON.stringify({ state, ROWS, COLS }));
        alert('Guardado exitosamente.');
    });

    // 3. Exportar a CSV
    document.getElementById('btn-csv')?.addEventListener('click', () => {
        let csv = '';
        for (let r = 1; r <= ROWS; r++) {
            let fila = [];
            for (let c = 0; c < COLS; c++) {
                let id = obtenerLetraCol(c) + r;
                fila.push(state[id] ? state[id].value : "");
            }
            csv += fila.join(',') + '\n';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'hojaclara.csv'; a.click();
    });

    