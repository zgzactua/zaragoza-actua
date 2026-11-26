
// ZARAGOZA ACTÚA
// Cargar convocatorias reales desde la API.

document.addEventListener("DOMContentLoaded", async () => {

    const contenedor = document.getElementById("lista-castings");

    if (!contenedor) return;

    const buscador = document.getElementById("buscar");
    const categoria = document.getElementById("categoria");
    const remuneracion = document.getElementById("remuneracion");

    let castings = [];

    try {
        const respuesta = await fetch("/api/castings");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los castings.");
        }

        castings = await respuesta.json();

    } catch (error) {
        contenedor.textContent = "No se han podido cargar las convocatorias. Inténtalo más tarde.";
        console.error(error);
        return;
    }

    function actualizarLista() {

        const texto = buscador ? buscador.value.toLowerCase().trim() : "";
        const tipo = categoria ? categoria.value : "";
        const pago = remuneracion ? remuneracion.value : "";

        const resultados = castings.filter(casting => {

            const coincideTexto =
                (casting.titulo || "").toLowerCase().includes(texto) ||
                (casting.descripcion || "").toLowerCase().includes(texto);

            const coincideTipo = !tipo || casting.tipo === tipo;
            const coincidePago = !pago || casting.remuneracion === pago;

            return coincideTexto && coincideTipo && coincidePago;
        });

        contenedor.innerHTML = "";

        if (resultados.length === 0) {
            contenedor.textContent = "No se han encontrado castings con esos filtros.";
            return;
        }

        resultados.forEach(casting => {

            const tarjeta = document.createElement("article");
            tarjeta.className = "casting-card";

            const titulo = document.createElement("h3");
            titulo.textContent = casting.titulo;

            const tipoTexto = document.createElement("p");
            tipoTexto.textContent = "Tipo: " + (casting.tipo || "No especificado");

            const lugarTexto = document.createElement("p");
            lugarTexto.textContent = "Ubicación: " + (casting.ubicacion || "Zaragoza");

            const pagoTexto = document.createElement("p");
            pagoTexto.textContent = "Remuneración: " + (casting.remuneracion || "No especificada");

            const descripcion = document.createElement("p");
            descripcion.textContent = casting.descripcion || "";

            tarjeta.append(
                titulo,
                tipoTexto,
                lugarTexto,
                pagoTexto,
                descripcion
            );

            if (casting.perfiles) {
                const perfiles = document.createElement("p");
                perfiles.textContent = "Perfiles buscados: " + casting.perfiles;
                tarjeta.appendChild(perfiles);
            }

            if (casting.fecha_limite) {
                const fecha = document.createElement("p");
                fecha.textContent = "Fecha límite: " + casting.fecha_limite;
                tarjeta.appendChild(fecha);
            }

            if (casting.enlace_externo) {
                const enlace = document.createElement("a");
                enlace.href = casting.enlace_externo;
                enlace.textContent = "Más información";
                enlace.target = "_blank";
                enlace.rel = "noopener noreferrer";
                tarjeta.appendChild(enlace);
            }

            contenedor.appendChild(tarjeta);
        });
    }

    if (buscador) buscador.addEventListener("input", actualizarLista);
    if (categoria) categoria.addEventListener("change", actualizarLista);
    if (remuneracion) remuneracion.addEventListener("change", actualizarLista);

    actualizarLista();

});
