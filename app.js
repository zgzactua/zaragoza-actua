
// ZARAGOZA ACTÚA
// Primera versión: castings de demostración

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

// Mostrar los castings en la página
function mostrarCastings() {
    const contenedor = document.getElementById("lista-castings");

    contenedor.innerHTML = "";

    castings.forEach(casting => {
        const tarjeta = document.createElement("article");

        tarjeta.className = "casting-card";

        tarjeta.innerHTML = `
            <h3>${casting.titulo}</h3>
            <p><strong>Tipo:</strong> ${casting.tipo}</p>
            <p><strong>Ubicación:</strong> ${casting.lugar}</p>
            <p><strong>Remuneración:</strong> ${casting.remuneracion}</p>
            <p>${casting.descripcion}</p>
        `;

        contenedor.appendChild(tarjeta);
    });
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", mostrarCastings);
