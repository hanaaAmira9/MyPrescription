
const { ZodError } = require("zod");

function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}] Erreur:`, err);

    if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
            champ: e.path.join("."),
            message: e.message,
        }));

        return res.status(400).json({
            error: "Erreur de validation",
            details: errors,
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            error: "JSON invalide",
            message: "Le corps de la requête n'est pas un JSON valide",
        });
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: statusCode === 500 ? "Erreur serveur" : "Erreur",
        message:
            statusCode === 500
                ? "Une erreur interne est survenue"
                : err.message,
    });
}


function notFoundHandler(req, res) {
    res.status(404).json({
        error: "Route non trouvée",
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    });
}

module.exports = { errorHandler, notFoundHandler };
