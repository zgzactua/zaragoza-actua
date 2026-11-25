
export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT
                id,
                titulo,
                tipo,
                ubicacion,
                remuneracion,
                descripcion,
                perfiles,
                fecha_limite,
                enlace_externo,
                fecha_publicacion
            FROM castings
            ORDER BY id DESC
        `).all();

        return Response.json(results, {
            headers: { "Cache-Control": "no-store" }
        });

    } catch (error) {
        return Response.json(
            { error: "No se pudieron cargar los castings." },
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

        const titulo = get("titulo", "title");
        const responsable = get("responsable", "productora", "producer");
        const email = get("email", "correo");
        const tipo = get("tipo", "type");
        const ubicacion = get("ubicacion", "location");
        const remuneracion = get("remuneracion", "remuneration");
        const descripcion = get("descripcion", "description");
        const perfiles = get("perfiles", "roles", "papeles");
        const fecha_limite = get("fecha_limite", "deadline");
        const enlace_externo = get("enlace_externo", "external_link");

        const consentimiento = get(
            "consentimiento",
            "consent",
            "privacy",
            "acepto"
        );

        if (!titulo || !responsable || !email || !tipo || !descripcion) {
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

        if (!consentimiento !== "si") {
            return Response.json(
                { error: "Debes aceptar la política de privacidad." },
                { status: 400 }
            );
        }

        if (
            titulo.length > 150 ||
            responsable.length > 150 ||
            email.length > 254 ||
            descripcion.length > 5000 ||
            perfiles.length > 3000
        ) {
            return Response.json(
                { error: "Alguno de los campos es demasiado largo." },
                { status: 400 }
            );
        }

        if (enlace_externo) {
            try {
                const url = new URL(enlace_externo);
                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error("URL no válida");
                }
            } catch {
                return Response.json(
                    { error: "El enlace externo no es válido." },
                    { status: 400 }
                );
            }
        }

        await env.DB.prepare(`
            INSERT INTO castings (
                titulo,
                responsable,
                email,
                tipo,
                ubicacion,
                remuneracion,
                descripcion,
                perfiles,
                fecha_limite,
                enlace_externo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            titulo,
            responsable,
            email,
            tipo,
            ubicacion,
            remuneracion,
            descripcion,
            perfiles,
            fecha_limite,
            enlace_externo
        ).run();

        return Response.json(
            { success: true, message: "Casting publicado correctamente." },
            { status: 201 }
        );

    } catch (error) {
        return Response.json(
            { error: "No se pudo publicar el casting." },
            { status: 500 }
        );
    }
}
