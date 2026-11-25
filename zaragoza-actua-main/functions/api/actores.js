
export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT
                id,
                nombre,
                especialidad,
                experiencia,
                presentacion,
                portfolio,
                foto,
                fecha_publicacion
            FROM actores
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

export async function onRequestPost({ request, env }) {
    try {
        let data;

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await request.json();
        } else {
            const form = await request.formData();
            data = Object.fromEntries(form.entries());
        }

        const get = (...names) => {
            for (const name of names) {
                if (data[name] !== undefined) {
                    return String(data[name]).trim();
                }
            }
            return "";
        };

        const nombre = get("nombre", "nombre_profesional", "name");
        const email = get("email", "correo");
        const especialidad = get("especialidad", "specialty");
        const experiencia = get("experiencia", "experience");
        const presentacion = get("presentacion", "presentación", "bio");
        const portfolio = get("portfolio", "portfolio_url", "portafolio");
        const foto = get("foto", "foto_url", "imagen", "profile_url");

        const consentimiento = get(
            "consentimiento",
            "consent",
            "privacy",
            "acepto"
        );

        if (!nombre || !email || !presentacion) {
            return Response.json(
                { error: "Faltan campos obligatorios." },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json(
                { error: "El correo electrónico no es válido." },
                { status: 400 }
            );
        }

        if (consentimiento !== "si") {
            return Response.json(
                { error: "Debes aceptar la política de privacidad." },
                { status: 400 }
            );
        }

        if (
            nombre.length > 150 ||
            email.length > 254 ||
            presentacion.length > 3000
        ) {
            return Response.json(
                { error: "Alguno de los campos es demasiado largo." },
                { status: 400 }
            );
        }

        for (const link of [portfolio, foto]) {
            if (link) {
                try {
                    const url = new URL(link);
                    if (!["http:", "https:"].includes(url.protocol)) {
                        throw new Error("URL no válida");
                    }
                } catch {
                    return Response.json(
                        { error: "Uno de los enlaces no es válido." },
                        { status: 400 }
                    );
                }
            }
        }

        await env.DB.prepare(`
            INSERT INTO actores (
                nombre,
                email,
                especialidad,
                experiencia,
                presentacion,
                portfolio,
                foto
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            nombre,
            email,
            especialidad,
            experiencia,
            presentacion,
            portfolio,
            foto
        ).run();

        return Response.json(
            { success: true, message: "Perfil publicado correctamente." },
            { status: 201 }
        );

    } catch (error) {
        return Response.json(
            { error: "No se pudo publicar el perfil." },
            { status: 500 }
        );
    }
}
