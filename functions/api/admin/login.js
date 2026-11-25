
async function crearFirma(datos, secreto) {
    const clave = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secreto),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const firma = await crypto.subtle.sign(
        "HMAC",
        clave,
        new TextEncoder().encode(datos)
    );

    return btoa(String.fromCharCode(...new Uint8Array(firma)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function respuestaNoAutorizada() {
    return Response.json(
        { error: "Contraseña incorrecta." },
        { status: 401 }
    );
}

export async function onRequestPost({ request, env }) {
    try {
        const origen = request.headers.get("Origin");

        if (
            origen &&
            new URL(origen).host !== new URL(request.url).host
        ) {
            return Response.json(
                { error: "Origen no permitido." },
                { status: 403 }
            );
        }

        const { password } = await request.json();

        if (
            !env.ADMIN_PASSWORD ||
            !env.ADMIN_SESSION_SECRET ||
            typeof password !== "string" ||
            password !== env.ADMIN_PASSWORD
        ) {
            return respuestaNoAutorizada();
        }

        const expiracion = Math.floor(Date.now() / 1000) + 3600;
        const datos = JSON.stringify({ exp: expiracion });
        const contenido = btoa(datos)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        const firma = await crearFirma(
            contenido,
            env.ADMIN_SESSION_SECRET
        );

        const cookie = `__Secure-admin_session=${contenido}.${firma}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=3600`;

        return Response.json(
            { success: true, message: "Sesión iniciada." },
            {
                headers: {
                    "Set-Cookie": cookie,
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (error) {
        return Response.json(
            { error: "No se pudo iniciar sesión." },
            { status: 500 }
        );
    }
}

export async function onRequestDelete({ request }) {
    const cookie = "__Secure-admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0";

    return Response.json(
        { success: true, message: "Sesión cerrada." },
        {
            headers: {
                "Set-Cookie": cookie,
                "Cache-Control": "no-store"
            }
        }
    );
}
