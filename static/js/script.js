
// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

const URL_FORMSPREE = "https://formspree.io/f/xrpgoagr";

const PESO_MAXIMO = 5 * 1024 * 1024; // 5 MB en total

const FORMATOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf"
];


// ==========================================
// FUNCIÓN: MOSTRAR MENSAJES
// ==========================================

function mostrarMensaje(elemento, mensaje, tipo = "info") {

    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.className = `mensaje-${tipo}`;

}


// ==========================================
// FUNCIÓN: VALIDAR ARCHIVOS
// ==========================================

function validarArchivos(input) {

    if (!input || !input.files.length) {
        return {
            valido: true,
            mensaje: ""
        };
    }

    const archivos = Array.from(input.files);

    let pesoTotal = 0;

    for (const archivo of archivos) {

        if (!FORMATOS_PERMITIDOS.includes(archivo.type)) {

            return {
                valido: false,
                mensaje: `El archivo "${archivo.name}" tiene un formato no permitido.`
            };

        }

        pesoTotal += archivo.size;

    }

    if (pesoTotal > PESO_MAXIMO) {

        return {
            valido: false,
            mensaje: "El peso total de los archivos no puede superar los 5 MB."
        };

    }

    return {
        valido: true,
        mensaje: ""
    };

}


// ==========================================
// FUNCIÓN: CONFIGURAR FORMULARIOS FORMSPREE
// ==========================================

function configurarFormulario(idFormulario, idMensaje) {

    const formulario = document.getElementById(idFormulario);

    if (!formulario) return;

    const mensaje = document.getElementById(idMensaje);
    const boton = formulario.querySelector('button[type="submit"]');

    if (!boton) return;

    const textoOriginal = boton.textContent;

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        if (boton.disabled) return;

        // Validar archivos adjuntos, si existen
        const inputArchivos = formulario.querySelector('input[type="file"]');

        const validacion = validarArchivos(inputArchivos);

        if (!validacion.valido) {

            mostrarMensaje(mensaje, validacion.mensaje, "error");

            return;

        }

        boton.disabled = true;
        boton.textContent = "Enviando...";

        mostrarMensaje(
            mensaje,
            "Estamos procesando tu solicitud...",
            "info"
        );

        try {

            const datosFormulario = new FormData(formulario);

            const respuesta = await fetch(URL_FORMSPREE, {

                method: "POST",

                headers: {
                    Accept: "application/json"
                },

                body: datosFormulario

            });

            let resultado = {};

            try {

                resultado = await respuesta.json();

            } catch (error) {

                resultado = {};

            }

            if (respuesta.ok) {

                if (idFormulario === "formularioReporte") {

                    mostrarMensaje(
                        mensaje,
                        "¡Reporte enviado correctamente! Hemos recibido tu solicitud.",
                        "exito"
                    );

                } else {

                    mostrarMensaje(
                        mensaje,
                        "¡Mensaje enviado correctamente! Gracias por contactarnos.",
                        "exito"
                    );

                }

                formulario.reset();

            } else {

                const detalleError = resultado.errors
                    ?.map(error => error.message)
                    .join(", ");

                mostrarMensaje(
                    mensaje,
                    detalleError || "No se pudo enviar el formulario. Inténtalo nuevamente.",
                    "error"
                );

                console.error("Error de Formspree:", resultado);

            }

        } catch (error) {

            mostrarMensaje(
                mensaje,
                "Ocurrió un error de conexión. Comprueba tu internet e inténtalo nuevamente.",
                "error"
            );

            console.error("Error al enviar:", error);

        } finally {

            boton.disabled = false;
            boton.textContent = textoOriginal;

        }

    });

}


// ==========================================
// FUNCIÓN: FILTROS DE MIS REPORTES
// ==========================================

function configurarFiltros() {

    const filtroEstado = document.getElementById("filtroEstado");
    const filtroCategoria = document.getElementById("filtroCategoria");

    const reportes = document.querySelectorAll(".reporte-card");

    const sinResultados = document.getElementById("sinResultados");

    if (!filtroEstado || !filtroCategoria || !reportes.length) {
        return;
    }

    function aplicarFiltros() {

        let reportesVisibles = 0;

        reportes.forEach(reporte => {

            const estado = reporte.dataset.estado;
            const categoria = reporte.dataset.categoria;

            const coincideEstado =
                filtroEstado.value === "todos" ||
                filtroEstado.value === estado;

            const coincideCategoria =
                filtroCategoria.value === "todos" ||
                filtroCategoria.value === categoria;

            const mostrar = coincideEstado && coincideCategoria;

            reporte.hidden = !mostrar;

            if (mostrar) {
                reportesVisibles++;
            }

        });

        if (sinResultados) {
            sinResultados.hidden = reportesVisibles > 0;
        }

    }

    filtroEstado.addEventListener("change", aplicarFiltros);
    filtroCategoria.addEventListener("change", aplicarFiltros);

    aplicarFiltros();

}


// ==========================================
// FUNCIÓN: FILTROS DE GESTIÓN DE REPORTES
// ==========================================

function configurarGestionReportes() {

    const busqueda = document.getElementById("buscarReporte");
    const filtroEstado = document.getElementById("filtroEstadoAdmin");
    const filtroCategoria = document.getElementById("filtroCategoriaAdmin");
    const filtroPrioridad = document.getElementById("filtroPrioridad");

    const tabla = document.getElementById("tablaGestionReportes");

    const sinReportes = document.getElementById("sinReportesAdmin");
    const cantidadReportes = document.getElementById("cantidadReportes");

    if (
        !tabla ||
        !busqueda ||
        !filtroEstado ||
        !filtroCategoria ||
        !filtroPrioridad
    ) {
        return;
    }

    const reportes = Array.from(tabla.querySelectorAll("tr"));

    // Leer filtros desde la URL, si existen
    const parametros = new URLSearchParams(window.location.search);

    const estadoURL = parametros.get("estado");
    const prioridadURL = parametros.get("prioridad");

    if (estadoURL && filtroEstado.querySelector(`option[value="${estadoURL}"]`)) {
        filtroEstado.value = estadoURL;
    }

    if (
        prioridadURL &&
        filtroPrioridad.querySelector(`option[value="${prioridadURL}"]`)
    ) {
        filtroPrioridad.value = prioridadURL;
    }

    function aplicarFiltrosAdmin() {

        const texto = busqueda.value.toLowerCase().trim();

        const estadoSeleccionado = filtroEstado.value;
        const categoriaSeleccionada = filtroCategoria.value;
        const prioridadSeleccionada = filtroPrioridad.value;

        let cantidadVisible = 0;

        reportes.forEach(reporte => {

            const estado = reporte.dataset.estado;
            const categoria = reporte.dataset.categoria;
            const prioridad = reporte.dataset.prioridad;

            const contenido = reporte.textContent.toLowerCase();

            const coincideBusqueda = contenido.includes(texto);

            const coincideEstado =
                estadoSeleccionado === "todos" ||
                estado === estadoSeleccionado;

            const coincideCategoria =
                categoriaSeleccionada === "todos" ||
                categoria === categoriaSeleccionada;

            const coincidePrioridad =
                prioridadSeleccionada === "todos" ||
                prioridad === prioridadSeleccionada;

            const mostrar =
                coincideBusqueda &&
                coincideEstado &&
                coincideCategoria &&
                coincidePrioridad;

            reporte.hidden = !mostrar;

            if (mostrar) {
                cantidadVisible++;
            }

        });

        if (sinReportes) {
            sinReportes.hidden = cantidadVisible > 0;
        }

        if (cantidadReportes) {
            cantidadReportes.textContent =
                `${cantidadVisible} de ${reportes.length} reportes`;
        }

    }

    busqueda.addEventListener("input", aplicarFiltrosAdmin);
    filtroEstado.addEventListener("change", aplicarFiltrosAdmin);
    filtroCategoria.addEventListener("change", aplicarFiltrosAdmin);
    filtroPrioridad.addEventListener("change", aplicarFiltrosAdmin);

    aplicarFiltrosAdmin();

}


// ==========================================
// FUNCIÓN: PREPARAR REGISTRO
// ==========================================

function configurarRegistro() {

    const formulario = document.getElementById("formularioRegistro");

    if (!formulario) return;

    const password = document.getElementById("passwordRegistro");
    const confirmarPassword = document.getElementById("confirmarPassword");

    const mensaje = document.getElementById("mensajeRegistro");

    formulario.addEventListener("submit", evento => {

        evento.preventDefault();

        if (password.value !== confirmarPassword.value) {

            mostrarMensaje(
                mensaje,
                "Las contraseñas no coinciden.",
                "error"
            );

            confirmarPassword.focus();

            return;

        }

        mostrarMensaje(
            mensaje,
            "El formulario está preparado, pero el registro estará disponible cuando conectemos Supabase.",
            "info"
        );

    });

}


// ==========================================
// FUNCIÓN: PREPARAR INICIO DE SESIÓN
// ==========================================

function configurarLogin() {

    const formulario = document.getElementById("formularioLogin");

    if (!formulario) return;

    const mensaje = document.getElementById("mensajeLogin");

    formulario.addEventListener("submit", evento => {

        evento.preventDefault();

        mostrarMensaje(
            mensaje,
            "El inicio de sesión estará disponible cuando conectemos Supabase.",
            "info"
        );

    });

}


// ==========================================
// FUNCIÓN: RECUPERAR CONTRASEÑA
// ==========================================

function configurarRecuperacionPassword() {

    const enlace = document.getElementById("recuperarPassword");

    if (!enlace) return;

    enlace.addEventListener("click", evento => {

        evento.preventDefault();

        alert(
            "La recuperación de contraseña estará disponible cuando conectemos Supabase."
        );

    });

}


// ==========================================
// FUNCIÓN: CERRAR SESIÓN
// ==========================================

function configurarCerrarSesion() {

    const boton = document.getElementById("btnCerrarSesion");

    if (!boton) return;

    boton.addEventListener("click", () => {

        alert(
            "El cierre de sesión estará disponible cuando implementemos la autenticación con Supabase."
        );

    });

}


// ==========================================
// INICIALIZACIÓN
// ==========================================

// Formularios Formspree
configurarFormulario("formularioContacto", "mensajeFormulario");
configurarFormulario("formularioReporte", "mensajeReporte");

// Filtros
configurarFiltros();
configurarGestionReportes();

// Autenticación (pendiente de Supabase)
configurarRegistro();
configurarLogin();
configurarRecuperacionPassword();
configurarCerrarSesion();
