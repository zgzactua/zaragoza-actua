
async function comprobarAdmin(request, env) {
    if (!env.ADMIN_SESSION_SECRET) return false;

    const cookies = request.headers.get("Cookie") || "";
    const coincidencia = cookies.match(
        /(?:^|;\s*)__Secure-admin_session=([^;]+)/
    );

    if (!coincidencia) return false;

    const partes = coincidencia[1].split(".");
    if (partes.length !== 2) return false;

    const [contenido, firma] = partes;

    try {
        const clave = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(env.ADMIN_SESSION_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const firmaBytes = Uint8Array.from(
            atob(firma.replace(/-/g, "+").replace(/_/g, "/")
                .padEnd(Math.ceil(firma.length / 4) * 4, "=")),
            caracter => caracter.charCodeAt(0)
        );

        const firmaValida = await crypto.subtle.verify(
            "HMAC",
            clave,
            firmaBytes,
            new TextEncoder().encode(contenido)
        );

        if (!firmaValida) return false;

        const datos = JSON.parse(
            atob(contenido.replace(/-/g, "+").replace(/_/g, "/")
                .padEnd(Math.ceil(contenido.length / 4) * 4, "="))
        );

        return Number.isInteger(datos.exp) &&
            datos.exp > Math.floor(Date.now() / 1000);

    } catch (error) {
        return false;
    }
}

function comprobarOrigen(request) {
    const origen = request.headers.get("Origin");

    return Boolean(
        origen &&
        new URL(origen).origin === new URL(request.url).origin
    );
}

export async function onRequestGet({ request, env }) {
    if (!(await comprobarAdmin(request, env))) {
        return Response.json(
            { error: "No autorizado." },
            { status: 401 }
        );
    }

    try {
    try {
    const estado = new URL(request.url).searchParams.get("estado") || "pendiente";

    if (!["pendiente", "aprobado"].includes(estado)) {
        return Response.json(
            { error: "Estado no válido." },
            { status: 400 }
        );
    }

    const { results } = await env.DB.prepare(`
        SELECT *
        FROM castings
        WHERE estado = ?
        ORDER BY id DESC
    `).bind(estado).all();

    return Response.json(results, {
        headers: { "Cache-Control": "no-store" }
    });

} catch (error) {
    return Response.json(
        { error: "No se pudieron cargar los castings." },
        { status: 500 }
    );
    }

export async function onRequestPatch({ request, env }) {
    if (!comprobarOrigen(request)) {
        return Response.json(
            { error: "Origen no permitido." },
            { status: 403 }
        );
    }

    if (!(await comprobarAdmin(request, env))) {
        return Response.json(
            { error: "No autorizado." },
            { status: 401 }
        );
    }

    try {
        const data = await request.json();
        const id = Number(data.id);
        const estado = data.estado;
        const accion = data.accion;

        if (!Number.isInteger(id) || id < 1) {
            return Response.json(
                { error: "Identificador no válido." },
                { status: 400 }
            );
        }

        let resultado;

        if (accion === "retirar") {
            if (estado !== "rechazado") {
                return Response.json(
                    { error: "Estado no válido para retirar." },
                    { status: 400 }
                );
            }

            resultado = await env.DB.prepare(`
                UPDATE castings
                SET estado = 'rechazado'
                WHERE id = ? AND estado = 'aprobado'
            `).bind(id).run();

        } else if (
            accion === "revisar" &&
            ["aprobado", "rechazado"].includes(estado)
        ) {
            resultado = await env.DB.prepare(`
                UPDATE castings
                SET estado = ?
                WHERE id = ? AND estado = 'pendiente'
            `).bind(estado, id).run();

        } else {
            return Response.json(
                { error: "Operación no válida." },
                { status: 400 }
            );
        }

        if (resultado.meta.changes === 0) {
            return Response.json(
                { error: "No se encontró una publicación con ese estado." },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Estado actualizado correctamente."
        });

    } catch (error) {
        return Response.json(
            { error: "No se pudo actualizar el casting." },
            { status: 500 }
        );
    }
}
