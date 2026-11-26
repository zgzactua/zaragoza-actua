
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
        const estado = new URL(request.url)
            .searchParams.get("estado") || "pendiente";

        if (!["pendiente", "aprobado"].includes(estado)) {
            return Response.json(
                { error: "Estado no válido." },
                { status: 400 }
            );
        }

        const { results } = await env.DB.prepare(`
            SELECT *
            FROM talentos
            WHERE estado = ?
            ORDER BY id DESC
        `).bind(estado).all();

        return Response.json(results, {
            headers: { "Cache-Control": "no-store" }
        });

    } catch (error) {
        return Response.json(
            { error: "No se pudieron cargar los perfiles de talento." },
            { status: 500 }
        );
    }
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

        if (!Number.isInteger(id) || id < 1) {
            return Response.json(
                { error: "Identificador no válido." },
                { status: 400 }
            );
        }

        if (!["aprobado", "rechazado"].includes(estado)) {
            return Response.json(
                { error: "Estado no válido." },
                { status: 400 }
            );
        }

        const resultado = await env.DB.prepare(`
            UPDATE talentos
            SET estado = ?
            WHERE id = ? AND estado = 'pendiente'
        `).bind(estado, id).run();

        if (resultado.meta.changes === 0) {
            return Response.json(
                { error: "No se encontró un perfil pendiente con ese ID." },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Estado actualizado correctamente."
        });

    } catch (error) {
        return Response.json(
            { error: "No se pudo actualizar el perfil." },
            { status: 500 }
        );
    }
}
