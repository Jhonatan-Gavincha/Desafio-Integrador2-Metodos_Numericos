// ============================================================
// ANALIZADOR INTERACTIVO DE MÉTODOS NUMÉRICOS
// ============================================================

const $ = (id) => document.getElementById(id);

function num(id) {
    const value = Number($(id).value);
    return Number.isFinite(value) ? value : NaN;
}

function fmt(value, digits = 8) {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(digits);
}

function fmtSci(value) {
    if (!Number.isFinite(value)) return "—";
    return value.toExponential(4);
}

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[ch]));
}

// ============================================================
// NAVEGACIÓN
// ============================================================

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.section));
});

document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.go));
});

function showSection(id) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.section === id);
    });

    const section = $(id);
    if (section) section.classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// ERRORES
// ============================================================

function calcularErrores() {
    const datos = [
        ["Ingreso diario", num("err-real-1"), num("err-aprox-1")],
        ["Costo operativo", num("err-real-2"), num("err-aprox-2")],
        ["Utilidad estimada", num("err-real-3"), num("err-aprox-3")]
    ];

    if (datos.some(d => !Number.isFinite(d[1]) || !Number.isFinite(d[2]))) {
        $("erroresResultado").innerHTML =
            `<div class="error-message">Completa todos los valores antes de calcular.</div>`;
        return;
    }

    let mayor = null;

    const filas = datos.map(([nombre, real, registrado]) => {
        const absoluto = Math.abs(real - registrado);
        const relativo = real === 0 ? NaN : absoluto / Math.abs(real);
        const porcentual = relativo * 100;

        if (!mayor || porcentual > mayor.porcentual) {
            mayor = { nombre, porcentual };
        }

        return `
            <tr>
                <td><strong>${escapeHTML(nombre)}</strong></td>
                <td>${real.toLocaleString("es-BO", {minimumFractionDigits: 2})}</td>
                <td>${registrado.toLocaleString("es-BO", {minimumFractionDigits: 2})}</td>
                <td>${fmt(absoluto, 2)}</td>
                <td>${fmt(relativo, 6)}</td>
                <td><strong>${fmt(porcentual, 4)}%</strong></td>
            </tr>
        `;
    }).join("");

    $("erroresResultado").innerHTML = `
        <div class="result-card">
            <h3>Resultados</h3>
            <div style="overflow:auto;">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>Dato</th>
                            <th>Referencia</th>
                            <th>Registrado</th>
                            <th>Error absoluto</th>
                            <th>Error relativo</th>
                            <th>Error %</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div class="note highlight">
                <strong>Mayor error porcentual:</strong>
                ${escapeHTML(mayor.nombre)} · ${fmt(mayor.porcentual, 4)}%
            </div>
        </div>
    `;
}

$("calcularErrores").addEventListener("click", calcularErrores);

$("resetErrores").addEventListener("click", () => {
    const values = {
        "err-real-1": 12500, "err-aprox-1": 12420,
        "err-real-2": 7800, "err-aprox-2": 7860,
        "err-real-3": 4700, "err-aprox-3": 4560
    };
    Object.entries(values).forEach(([id, value]) => $(id).value = value);
    calcularErrores();
});

// ============================================================
// TAYLOR
// C(t) = C0 * e^(r*t)
// ============================================================

function calcularTaylor() {
    const C0 = num("tay-capital");
    const r = num("tay-rate");
    const t0 = num("tay-t0");
    const t = num("tay-t");

    if (![C0, r, t0, t].every(Number.isFinite)) {
        $("taylorResultado").innerHTML =
            `<div class="error-message">Completa todos los parámetros.</div>`;
        return;
    }

    const h = t - t0;
    const exacto = C0 * Math.exp(r * t);

    const C_t0 = C0 * Math.exp(r * t0);
    const d1 = C_t0 * r;
    const d2 = C_t0 * r * r;
    const d3 = C_t0 * r * r * r;

    const t1 = C_t0 + d1 * h;
    const t2 = t1 + (d2 / 2) * Math.pow(h, 2);
    const t3 = t2 + (d3 / 6) * Math.pow(h, 3);

    const resultados = [
        { orden: 1, valor: t1, error: Math.abs(exacto - t1) },
        { orden: 2, valor: t2, error: Math.abs(exacto - t2) },
        { orden: 3, valor: t3, error: Math.abs(exacto - t3) }
    ];

    const mejor = resultados.reduce((a, b) => a.error < b.error ? a : b);

    $("taylorResultado").innerHTML = `
        <div class="result-card">
            <h3>Resultados de la aproximación</h3>

            <div class="result-grid">
                <div class="result-item">
                    <span>Valor exacto C(t)</span>
                    <strong>Bs ${fmt(exacto, 6)}</strong>
                </div>
                <div class="result-item">
                    <span>Capital en t₀</span>
                    <strong>Bs ${fmt(C_t0, 6)}</strong>
                </div>
                <div class="result-item">
                    <span>h = t − t₀</span>
                    <strong>${fmt(h, 6)}</strong>
                </div>
            </div>

            <div style="overflow:auto; margin-top:20px;">
                <table class="taylor-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Aproximación</th>
                            <th>Error absoluto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultados.map(r => `
                            <tr>
                                <td>Taylor ${r.orden}</td>
                                <td>Bs ${fmt(r.valor, 6)}</td>
                                <td>${fmt(r.error, 8)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <div class="note highlight">
                <strong>Mejor aproximación:</strong>
                Taylor de orden ${mejor.orden}, con error absoluto
                ${fmt(mejor.error, 8)}.
            </div>
        </div>
    `;
}

$("calcularTaylor").addEventListener("click", calcularTaylor);

// ============================================================
// MATRICES
// ============================================================

function getSystem() {
    const A = [
        [num("a11"), num("a12"), num("a13")],
        [num("a21"), num("a22"), num("a23")],
        [num("a31"), num("a32"), num("a33")]
    ];

    const b = [num("b1"), num("b2"), num("b3")];

    return { A, b };
}

function validSystem(A, b) {
    return A.every(row => row.every(Number.isFinite)) &&
           b.every(Number.isFinite);
}

function identity(n) {
    return Array.from({length: n}, (_, i) =>
        Array.from({length: n}, (_, j) => i === j ? 1 : 0)
    );
}

function copyMatrix(A) {
    return A.map(row => [...row]);
}

function maxAbs(arr) {
    return Math.max(...arr.map(Math.abs));
}

// ============================================================
// LU CON PIVOTEO PARCIAL
// PA = LU
// ============================================================

function luDecomposition(A) {
    const n = A.length;
    const U = copyMatrix(A);
    const L = identity(n);
    const P = Array.from({length:n}, (_, i) => i);

    for (let k = 0; k < n - 1; k++) {
        let pivot = k;

        for (let i = k + 1; i < n; i++) {
            if (Math.abs(U[i][k]) > Math.abs(U[pivot][k])) {
                pivot = i;
            }
        }

        if (Math.abs(U[pivot][k]) < 1e-15) {
            throw new Error("La matriz es singular o no permite una factorización LU estable.");
        }

        if (pivot !== k) {
            [U[k], U[pivot]] = [U[pivot], U[k]];
            [P[k], P[pivot]] = [P[pivot], P[k]];

            for (let j = 0; j < k; j++) {
                [L[k][j], L[pivot][j]] = [L[pivot][j], L[k][j]];
            }
        }

        for (let i = k + 1; i < n; i++) {
            const factor = U[i][k] / U[k][k];
            L[i][k] = factor;

            for (let j = k; j < n; j++) {
                U[i][j] -= factor * U[k][j];
            }
        }
    }

    return { L, U, P };
}

function permuteVector(P, b) {
    return P.map(i => b[i]);
}

function forwardSubstitution(L, b) {
    const n = b.length;
    const y = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
        y[i] = (b[i] - sum) / L[i][i];
    }

    return y;
}

function backSubstitution(U, y) {
    const n = y.length;
    const x = Array(n).fill(0);

    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += U[i][j] * x[j];

        if (Math.abs(U[i][i]) < 1e-15) {
            throw new Error("La matriz es singular.");
        }

        x[i] = (y[i] - sum) / U[i][i];
    }

    return x;
}

function solveLU(A, b) {
    const {L, U, P} = luDecomposition(A);
    const pb = permuteVector(P, b);
    const y = forwardSubstitution(L, pb);
    const x = backSubstitution(U, y);

    return {x, L, U, P, y};
}

// ============================================================
// JACOBI
// ============================================================

function jacobi(A, b, tol, maxIter) {
    const n = b.length;
    let x = Array(n).fill(0);
    const history = [];

    for (let iter = 1; iter <= maxIter; iter++) {
        const xn = Array(n).fill(0);

        for (let i = 0; i < n; i++) {
            if (Math.abs(A[i][i]) < 1e-15) {
                throw new Error("Jacobi no puede usar un cero en la diagonal.");
            }

            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) sum += A[i][j] * x[j];
            }

            xn[i] = (b[i] - sum) / A[i][i];
        }

        const error = maxAbs(xn.map((v, i) => v - x[i]));

        history.push({
            iter: iter,
            x: [...xn],
            error
        });

        x = xn;

        if (error < tol) {
            return {x, iterations: iter, converged: true, history};
        }
    }

    return {x, iterations: maxIter, converged: false, history};
}

// ============================================================
// GAUSS-SEIDEL
// ============================================================

function gaussSeidel(A, b, tol, maxIter) {
    const n = b.length;
    let x = Array(n).fill(0);
    const history = [];

    for (let iter = 1; iter <= maxIter; iter++) {
        const old = [...x];

        for (let i = 0; i < n; i++) {
            if (Math.abs(A[i][i]) < 1e-15) {
                throw new Error("Gauss-Seidel no puede usar un cero en la diagonal.");
            }

            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) sum += A[i][j] * x[j];
            }

            x[i] = (b[i] - sum) / A[i][i];
        }

        const error = maxAbs(x.map((v, i) => v - old[i]));

        history.push({
            iter: iter,
            x: [...x],
            error
        });

        if (error < tol) {
            return {x, iterations: iter, converged: true, history};
        }
    }

    return {x, iterations: maxIter, converged: false, history};
}

// ============================================================
// PRESENTACIÓN
// ============================================================

function vectorResultHTML(x) {
    return `
        <div class="result-grid">
            <div class="result-item">
                <span>x₁ · Operaciones</span>
                <strong>${fmt(x[0], 8)}</strong>
            </div>
            <div class="result-item">
                <span>x₂ · Comercialización</span>
                <strong>${fmt(x[1], 8)}</strong>
            </div>
            <div class="result-item">
                <span>x₃ · Tecnología</span>
                <strong>${fmt(x[2], 8)}</strong>
            </div>
        </div>
    `;
}

function matrixHTML(M) {
    return `
        <div class="matrix-mini">
            ${M.map(row => row.map(v => fmt(v, 6)).join(" &nbsp; ")).join("<br>")}
        </div>
    `;
}

function showMethodResult(method, x, extra = "") {
    $("sistemaResultado").innerHTML = `
        <div class="result-card">
            <h3>${escapeHTML(method)}</h3>
            ${vectorResultHTML(x)}
            ${extra}
        </div>
    `;
}

function showIterations(result, method) {
    $("iteracionesResultado").innerHTML = `
        <div class="iteration-card">
            <h3>${escapeHTML(method)} · Iteraciones</h3>

            <div class="note">
                <strong>Convergencia:</strong>
                <span class="${result.converged ? "good" : "bad"}">
                    ${result.converged ? "Sí ✓" : "No ✗"}
                </span>
                · <strong>Iteraciones:</strong> ${result.iterations}
            </div>

            <div class="iteration-scroll" style="margin-top:18px;">
                <table>
                    <thead>
                        <tr>
                            <th>Iter.</th>
                            <th>x₁</th>
                            <th>x₂</th>
                            <th>x₃</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.history.map(row => `
                            <tr>
                                <td>${row.iter}</td>
                                <td>${fmt(row.x[0], 8)}</td>
                                <td>${fmt(row.x[1], 8)}</td>
                                <td>${fmt(row.x[2], 8)}</td>
                                <td>${fmtSci(row.error)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showError(containerId, message) {
    $(containerId).innerHTML =
        `<div class="error-message">${escapeHTML(message)}</div>`;
}

// ============================================================
// BOTONES DE SISTEMAS
// ============================================================

function getSettings() {
    const tol = num("tol");
    const maxIter = Math.max(1, Math.floor(num("maxIter")));

    return {
        tol: Number.isFinite(tol) && tol > 0 ? tol : 1e-6,
        maxIter: Number.isFinite(maxIter) ? maxIter : 50
    };
}

$("btnLU").addEventListener("click", () => {
    try {
        const {A, b} = getSystem();

        if (!validSystem(A, b)) throw new Error("Completa todos los coeficientes.");

        const result = solveLU(A, b);

        showMethodResult(
            "Factorización LU",
            result.x,
            `
                <div class="note">
                    <strong>Descomposición:</strong><br>
                    L = ${matrixHTML(result.L)}
                    <br>
                    U = ${matrixHTML(result.U)}
                    <br>
                    Vector y = (${result.y.map(v => fmt(v, 8)).join(", ")})
                </div>
            `
        );

        $("iteracionesResultado").innerHTML = `
            <div class="iteration-card">
                <h3>LU · Método directo</h3>
                <div class="note">
                    LU no necesita iteraciones como Jacobi o Gauss-Seidel.
                    La solución se obtiene mediante factorización y sustituciones.
                </div>
            </div>
        `;
    } catch (error) {
        showError("sistemaResultado", error.message);
        $("iteracionesResultado").innerHTML = "";
    }
});

$("btnJacobi").addEventListener("click", () => {
    try {
        const {A, b} = getSystem();
        if (!validSystem(A, b)) throw new Error("Completa todos los coeficientes.");

        const {tol, maxIter} = getSettings();
        const result = jacobi(A, b, tol, maxIter);

        showMethodResult(
            "Método de Jacobi",
            result.x,
            `<div class="note">
                Tolerancia: ${tol} · Máximo: ${maxIter} ·
                Resultado: <strong class="${result.converged ? "good" : "bad"}">
                ${result.converged ? "Convergió ✓" : "No convergió ✗"}
                </strong>
            </div>`
        );

        showIterations(result, "Jacobi");
    } catch (error) {
        showError("sistemaResultado", error.message);
        $("iteracionesResultado").innerHTML = "";
    }
});

$("btnGS").addEventListener("click", () => {
    try {
        const {A, b} = getSystem();
        if (!validSystem(A, b)) throw new Error("Completa todos los coeficientes.");

        const {tol, maxIter} = getSettings();
        const result = gaussSeidel(A, b, tol, maxIter);

        showMethodResult(
            "Método de Gauss-Seidel",
            result.x,
            `<div class="note">
                Tolerancia: ${tol} · Máximo: ${maxIter} ·
                Resultado: <strong class="${result.converged ? "good" : "bad"}">
                ${result.converged ? "Convergió ✓" : "No convergió ✗"}
                </strong>
            </div>`
        );

        showIterations(result, "Gauss-Seidel");
    } catch (error) {
        showError("sistemaResultado", error.message);
        $("iteracionesResultado").innerHTML = "";
    }
});

$("btnTodos").addEventListener("click", () => {
    try {
        const {A, b} = getSystem();
        if (!validSystem(A, b)) throw new Error("Completa todos los coeficientes.");

        const {tol, maxIter} = getSettings();

        const lu = solveLU(A, b);
        const ja = jacobi(A, b, tol, maxIter);
        const gs = gaussSeidel(A, b, tol, maxIter);

        $("sistemaResultado").innerHTML = `
            <div class="result-card">
                <h3>Comparación de los tres métodos</h3>
                <div style="overflow:auto;">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th>Método</th>
                                <th>x₁</th>
                                <th>x₂</th>
                                <th>x₃</th>
                                <th>Iteraciones</th>
                                <th>Convergencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>LU</strong></td>
                                <td>${fmt(lu.x[0])}</td>
                                <td>${fmt(lu.x[1])}</td>
                                <td>${fmt(lu.x[2])}</td>
                                <td>Directo</td>
                                <td class="good">✓</td>
                            </tr>
                            <tr>
                                <td><strong>Jacobi</strong></td>
                                <td>${fmt(ja.x[0])}</td>
                                <td>${fmt(ja.x[1])}</td>
                                <td>${fmt(ja.x[2])}</td>
                                <td>${ja.iterations}</td>
                                <td class="${ja.converged ? "good" : "bad"}">
                                    ${ja.converged ? "✓ Sí" : "✗ No"}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Gauss-Seidel</strong></td>
                                <td>${fmt(gs.x[0])}</td>
                                <td>${fmt(gs.x[1])}</td>
                                <td>${fmt(gs.x[2])}</td>
                                <td>${gs.iterations}</td>
                                <td class="${gs.converged ? "good" : "bad"}">
                                    ${gs.converged ? "✓ Sí" : "✗ No"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="note">
                    Las soluciones deben coincidir aproximadamente cuando
                    los métodos convergen. Jacobi y Gauss-Seidel usan
                    tolerancia ${tol} y máximo ${maxIter} iteraciones.
                </div>
            </div>
        `;

        // Mostrar las iteraciones de ambos métodos en una sola zona.
        $("iteracionesResultado").innerHTML = `
            <div class="iteration-card">
                <h3>Iteraciones · Jacobi</h3>
                <div class="iteration-scroll">
                    <table>
                        <thead><tr><th>Iter.</th><th>x₁</th><th>x₂</th><th>x₃</th><th>Error</th></tr></thead>
                        <tbody>
                            ${ja.history.map(r => `
                                <tr>
                                    <td>${r.iter}</td>
                                    <td>${fmt(r.x[0])}</td>
                                    <td>${fmt(r.x[1])}</td>
                                    <td>${fmt(r.x[2])}</td>
                                    <td>${fmtSci(r.error)}</td>
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="iteration-card">
                <h3>Iteraciones · Gauss-Seidel</h3>
                <div class="iteration-scroll">
                    <table>
                        <thead><tr><th>Iter.</th><th>x₁</th><th>x₂</th><th>x₃</th><th>Error</th></tr></thead>
                        <tbody>
                            ${gs.history.map(r => `
                                <tr>
                                    <td>${r.iter}</td>
                                    <td>${fmt(r.x[0])}</td>
                                    <td>${fmt(r.x[1])}</td>
                                    <td>${fmt(r.x[2])}</td>
                                    <td>${fmtSci(r.error)}</td>
                                </tr>`).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        showError("sistemaResultado", error.message);
        $("iteracionesResultado").innerHTML = "";
    }
});

$("resetSistema").addEventListener("click", () => {
    const values = {
        a11: 10, a12: 2, a13: 1, b1: 29,
        a21: 1, a22: 9, a23: 2, b2: 25,
        a31: 2, a32: 1, a33: 8, b3: 28,
        tol: 0.000001, maxIter: 50
    };

    Object.entries(values).forEach(([id, value]) => $(id).value = value);

    $("sistemaResultado").innerHTML = "";
    $("iteracionesResultado").innerHTML = "";
});

// ============================================================
// CASO BAJO ESTRÉS
// ============================================================

$("calcularStress").addEventListener("click", () => {
    try {
        const A = [
            [10, 2, 1],
            [1, 9, 2],
            [2, 1, 8]
        ];

        const bIdeal = [29, 25, 28];
        const bStress = [
            num("stress-b1"),
            num("stress-b2"),
            num("stress-b3")
        ];

        if (!bStress.every(Number.isFinite)) {
            throw new Error("Completa los tres términos del caso bajo estrés.");
        }

        const ideal = solveLU(A, bIdeal).x;
        const stress = solveLU(A, bStress).x;
        const delta = stress.map((v, i) => Math.abs(v - ideal[i]));

        $("stressResultado").innerHTML = `
            <div class="result-card">
                <h3>Comparación ideal vs. bajo estrés</h3>

                <div style="overflow:auto;">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Caso ideal</th>
                                <th>Bajo estrés</th>
                                <th>|Cambio|</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["x₁", "x₂", "x₃"].map((name, i) => `
                                <tr>
                                    <td><strong>${name}</strong></td>
                                    <td>${fmt(ideal[i], 8)}</td>
                                    <td>${fmt(stress[i], 8)}</td>
                                    <td>${fmt(delta[i], 8)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="note highlight">
                    Los términos independientes cambiaron y, como consecuencia,
                    también cambió la distribución calculada de recursos.
                </div>
            </div>
        `;
    } catch (error) {
        showError("stressResultado", error.message);
    }
});

// ============================================================
// CASO MAL CONDICIONADO
// ============================================================

$("calcularCondicionado").addEventListener("click", () => {
    try {
        const A = [
            [1, 1, 1],
            [1.001, 1, 1],
            [1, 1.001, 1]
        ];

        const bOriginal = [6, 6.001, 6.002];
        const bPerturbado = [6, 6.001, num("cond-b3")];

        if (!Number.isFinite(bPerturbado[2])) {
            throw new Error("Ingresa el último término independiente.");
        }

        const original = solveLU(A, bOriginal).x;
        const perturbado = solveLU(A, bPerturbado).x;
        const cambio = perturbado.map((v, i) => Math.abs(v - original[i]));

        $("condicionadoResultado").innerHTML = `
            <div class="result-card">
                <h3>Sensibilidad del sistema</h3>

                <div style="overflow:auto;">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Original</th>
                                <th>Perturbado</th>
                                <th>Variación</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${["x₁", "x₂", "x₃"].map((name, i) => `
                                <tr>
                                    <td><strong>${name}</strong></td>
                                    <td>${fmt(original[i], 8)}</td>
                                    <td>${fmt(perturbado[i], 8)}</td>
                                    <td><strong>${fmt(cambio[i], 8)}</strong></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="note highlight">
                    El último dato pasó de <strong>6.002</strong> a
                    <strong>${fmt(bPerturbado[2], 3)}</strong>.
                    La variación aplicada fue de
                    <strong>${fmt(Math.abs(bPerturbado[2] - 6.002), 6)}</strong>.
                    Observa cuánto cambia cada componente de la solución.
                </div>
            </div>
        `;
    } catch (error) {
        showError("condicionadoResultado", error.message);
    }
});

// ============================================================
// CÁLCULOS INICIALES
// ============================================================

calcularErrores();
