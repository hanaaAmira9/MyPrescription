const { ZodError } = require("zod");



function validateBody(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        } catch (error) {
            console.error("Erreur dans validateBody:", error);

            if (error instanceof ZodError) {

                const errors = error.issues.map((err) => ({
                    champ: err.path.join("."),
                    message: err.message,
                }));

                return res.status(400).json({
                    error: "Erreur de validation",
                    details: errors,
                });
            }

            next(error);
        }
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.query);
            req.query = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((err) => ({
                    champ: err.path.join("."),
                    message: err.message,
                }));

                return res.status(400).json({
                    error: "Erreur de validation des paramètres",
                    details: errors,
                });
            }
            next(error);
        }
    };
}




module.exports = { validateBody, validateQuery };
