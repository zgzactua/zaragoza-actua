
// ZARAGOZA ACTÚA
// Datos de demostración: todavía no son convocatorias reales.

const castings = [
    {
        titulo: "Cortometraje independiente",
        tipo: "Cine",
        lugar: "Zaragoza",
        remuneracion: "No remunerado",
        descripcion: "Se buscan intérpretes adultos para un proyecto de cortometraje."
    },
    {
        titulo: "Obra de teatro amateur",
        tipo: "Teatro",
        lugar: "Zaragoza",
        remuneracion: "No remunerado",
        descripcion: "Proyecto teatral independiente. Se buscan nuevos talentos."
    },
    {
        titulo: "Proyecto audiovisual",
        tipo: "Audiovisual",
        lugar: "Zaragoza",
        remuneracion: "Remunerado",
        descripcion: "Convocatoria de demostración para una producción audiovisual."
    }
];

// Crear y mostrar las tarjetas
function mostrarCastings() {
    const contenedor = document.getElementById("lista-castings");

    // Si esta página no tiene lista de castings, no hacemos nada.
    if (!contenedor) return;

    const buscador = document.getElementById("buscar");
    const categoria = document.getElementById("categoria");
    const remuneracion = document.getElementById("remuneracion");

    function actualizarLista() {
        const texto = buscador ? buscador.value.toLowerCase().trim() : "";
        const tipo = categoria ? categoria.value : "";
        const pago = remuneracion ? remuneracion.value : "";

        const resultados = castings.filter(casting => {
            const coincideTexto =
                casting.titulo.toLowerCase().includes(texto) ||
                casting.descripcion.toLowerCase().includes(texto);

            const coincideTipo = !tipo || casting.tipo === tipo;
            const coincidePago = !pago || casting.remuneracion === pago;

            return coincideTexto && coincideTipo && coincidePago;
        });

        contenedor.innerHTML = "";

        if (resultados.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.textContent = "No se han encontrado castings con esos filtros.";
            contenedor.appendChild(mensaje);
            return;
        }

        resultados.forEach(casting => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "casting-card";

            const titulo = document.createElement("h3");
            titulo.textContent = casting.titulo;

            const tipoTexto = document.createElement("p");
            tipoTexto.textContent = "Tipo: " + casting.tipo;

            const lugarTexto = document.createElement("p");
            lugarTexto.textContent = "Ubicación: " + casting.lugar;

            const pagoTexto = document.createElement("p");
            pagoTexto.textContent = "Remuneración: " + casting.remuneracion;

            const descripcion = document.createElement("p");
            descripcion.textContent = casting.descripcion;

            const aviso = document.createElement("small");
            aviso.textContent = "Ejemplo de demostración · No es una convocatoria real";

            tarjeta.append(
                titulo,
                tipoTexto,
                lugarTexto,
                pagoTexto,
                descripcion,
                aviso
            );

            contenedor.appendChild(tarjeta);
        });
    }

    // Actualizar los resultados al cambiar los filtros
    if (buscador) buscador.addEventListener("input", actualizarLista);
    if (categoria) categoria.addEventListener("change", actualizarLista);
    if (remuneracion) remuneracion.addEventListener("change", actualizarLista);

    actualizarLista();
}

// Ejecutar cuando se cargue la página
document.addEventListener("DOMContentLoaded", mostrarCastings);
