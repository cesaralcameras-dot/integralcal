const NOMBRES_GRADO = ["constante", "primer", "segundo", "tercer"];

// ---------- Lectura de la función ----------
function limpiar(texto) {
    let t = texto.toLowerCase().replace(/\s+/g, "");
    if (t.includes("=")) t = t.split("=")[1];
    return t;
}

function prepararParte(t) {
    while (t.startsWith("(") && t.endsWith(")")) t = t.slice(1, -1);
    if (/[()]/.test(t)) {
        throw new Error("Escribe cada polinomio expandido, sin paréntesis internos.");
    }
    return t;
}

// "2x^2-5x+6" -> [6, -5, 2, 0]
function parsePolinomio(texto) {
    const coef = [0, 0, 0, 0];
    const terminos = texto.match(/[+-]?[^+-]+/g);
    if (!terminos) throw new Error("La expresión está vacía.");

    for (const t of terminos) {
        const m = t.match(/^([+-]?\d*\.?\d*)(x(\^(\d+))?)?$/);
        if (!m || ((m[1] === "" || m[1] === "+" || m[1] === "-") && !m[2])) {
            throw new Error("No entiendo el término: " + t);
        }
        const c = (m[1] === "" || m[1] === "+") ? 1 : (m[1] === "-" ? -1 : Number(m[1]));
        const exp = m[2] ? (m[4] ? Number(m[4]) : 1) : 0;
        if (exp > 3) throw new Error("Solo se permiten funciones hasta tercer grado.");
        coef[exp] += c;
    }
    return coef;
}

function parseFuncion(texto) {
    const t = limpiar(texto);
    if (t === "") throw new Error("Ingresa una función.");

    let num, den;
    if (t.includes("/")) {
        const partes = t.split("/");
        if (partes.length !== 2) throw new Error("Usa una sola división: (numerador)/(denominador).");
        num = parsePolinomio(prepararParte(partes[0]));
        den = parsePolinomio(prepararParte(partes[1]));
        if (den.every(c => c === 0)) throw new Error("El denominador no puede ser cero.");
    } else {
        num = parsePolinomio(prepararParte(t));
        den = [1, 0, 0, 0];
    }
    return { num, den };
}

// ---------- Herramientas de polinomios ----------
function grado(c) {
    for (let i = 3; i >= 0; i--) {
        if (Math.abs(c[i]) > 1e-12) return i;
    }
    return 0;
}

function evaluar(c, x) {
    return c[0] + c[1] * x + c[2] * x * x + c[3] * x * x * x;
}

function derivada(c) {
    return [c[1], 2 * c[2], 3 * c[3], 0];
}

const redondear = n => Number(n.toFixed(6));
const fmt = n => String(Number(n.toFixed(4)));

function unicos(lista) {
    const res = [];
    for (const v of lista) {
        if (!res.some(r => Math.abs(r - v) < 1e-6)) res.push(v);
    }
    return res.sort((a, b) => a - b);
}

// ---------- Raíces reales hasta grado 3 ----------
function raicesReales(c) {
    const g = grado(c);
    let r = [];

    if (g === 1) {
        r = [-c[0] / c[1]];
    } else if (g === 2) {
        const disc = c[1] * c[1] - 4 * c[2] * c[0];
        if (Math.abs(disc) < 1e-12) {
            r = [-c[1] / (2 * c[2])];
        } else if (disc > 0) {
            r = [(-c[1] + Math.sqrt(disc)) / (2 * c[2]), (-c[1] - Math.sqrt(disc)) / (2 * c[2])];
        }
    } else if (g === 3) {
        // x^3 + a x^2 + b x + d = 0  ->  t^3 + p t + q = 0  con x = t - a/3
        const a = c[2] / c[3], b = c[1] / c[3], d = c[0] / c[3];
        const p = b - (a * a) / 3;
        const q = (2 * a ** 3) / 27 - (a * b) / 3 + d;
        const disc = (q / 2) ** 2 + (p / 3) ** 3;
        let t = [];

        if (Math.abs(p) < 1e-12 && Math.abs(q) < 1e-12) {
            t = [0];
        } else if (Math.abs(disc) < 1e-12) {
            t = [(3 * q) / p, (-3 * q) / (2 * p)];
        } else if (disc > 0) {
            const s = Math.sqrt(disc);
            t = [Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s)];
        } else {
            const m = 2 * Math.sqrt(-p / 3);
            const ang = Math.acos(((3 * q) / (2 * p)) * Math.sqrt(-3 / p)) / 3;
            t = [0, 1, 2].map(k => m * Math.cos(ang - (2 * Math.PI * k) / 3));
        }
        r = t.map(v => v - a / 3);
    }
    return unicos(r.map(redondear));
}

// ---------- Cálculos de cada resultado ----------
function textoGrado(num, den) {
    const gn = grado(num), gd = grado(den);
    if (gd === 0) return "Función de " + NOMBRES_GRADO[gn] + " grado";
    return "Función racional (numerador de " + NOMBRES_GRADO[gn] + " grado, denominador de " +
        NOMBRES_GRADO[gd] + " grado)";
}

function calcularOrdenada(num, den) {
    if (Math.abs(den[0]) < 1e-12) return "No existe (no está definida en x = 0)";
    return fmt(num[0] / den[0]);
}

function calcularDominio(den) {
    const prohibidas = raicesReales(den);
    if (prohibidas.length === 0) return "ℝ";
    return "ℝ − {" + prohibidas.map(fmt).join(", ") + "}";
}

function calcularHuecos(num, den) {
    const comunes = raicesReales(num).filter(r =>
        raicesReales(den).some(d => Math.abs(r - d) < 1e-4));
    return { comunes };
}

function calcularRango(num, den) {
    if (grado(den) !== 0) return "No calculado para funciones racionales";
    const a = num.map(v => v / den[0]); // polinomio simplificado
    const g = grado(a);
    if (g === 0) return "{" + fmt(a[0]) + "}";
    if (g % 2 === 1) return "ℝ";
    const xv = -a[1] / (2 * a[2]);
    const yv = evaluar(a, xv);
    return a[2] > 0 ? "[" + fmt(yv) + ", ∞)" : "(-∞, " + fmt(yv) + "]";
}

function calcularAH(num, den) {
    const n = grado(num), m = grado(den);
    if (n < m) return "y = 0";
    if (n === m) return "y = " + fmt(num[n] / den[m]);
    return n === m + 1 ? "No tiene (tiene asíntota oblicua)" : "No tiene";
}

// ---------- Botón principal ----------
function analizarFuncion() {
    const nombre = document.getElementById("nombre").value.trim();
    const texto = document.getElementById("funcion").value;

    try {
        const { num, den } = parseFuncion(texto);
        const { comunes } = calcularHuecos(num, den);

        const raices = raicesReales(num).filter(r => !comunes.some(c => Math.abs(c - r) < 1e-4));
        const asintotasV = raicesReales(den).filter(r => !comunes.some(c => Math.abs(c - r) < 1e-4));

        const huecos = comunes.map(x => {
            const dn = evaluar(derivada(num), x), dd = evaluar(derivada(den), x);
            const y = Math.abs(dd) > 1e-9 ? fmt(dn / dd) : "?";
            return "(" + fmt(x) + ", " + y + ")";
        });

        mostrar("grado", textoGrado(num, den));
        mostrar("raices", raices.length ? raices.map(r => "x = " + fmt(r)).join(", ") : "Sin raíces reales");
        mostrar("ordenada", calcularOrdenada(num, den));
        mostrar("dominio", calcularDominio(den));
        mostrar("rango", calcularRango(num, den));
        mostrar("AV", asintotasV.length ? asintotasV.map(x => "x = " + fmt(x)).join(", ") : "No tiene");
        mostrar("AH", calcularAH(num, den));
        mostrar("huecos", huecos.length ? huecos.join(", ") : "No tiene");
    } catch (error) {
        ["grado", "raices", "ordenada", "dominio", "rango", "AV", "AH", "huecos"].forEach(id => mostrar(id, "-"));
        mostrar("grado", error.message);
    }
}

function mostrar(id, valor) {
    document.getElementById(id).textContent = valor;
}