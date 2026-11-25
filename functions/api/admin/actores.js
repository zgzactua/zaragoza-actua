
function comprobarAdmin(request, env) {
    const password = request.headers.get("X-Admin-Password");

    return Boolean(
        env.ADMIN_PASSWORD &&
        password &&
        password === env.ADMIN_PASSWORD
    );
}

export async function onRequestGet({ request, env }) {
    if (!comprobarAdmin(request, env)) {
        return Response.json(
            { error: "No autorizado." },
            { status: 401 }
        );
    }

    try {
        const { results } = await env.DB.prepare(`
            SELECT *
            FROM actores
            WHERE estado = 'pendiente'
            ORDER BY id DESC
        `).all();

        return Response.json(results, {
            headers: { "Cache-Control": "no-store" }
        });

    } catch (error) {
        return Response.json(
            { error: "No se pudieron cargar los perfiles." },
            { status: 500 }
        );
    }
}

export async function onRequestPatch({ request, env }) {
    if (!comprobarAdmin(request, env)) {
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
            UPDATE actores
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
