import rateLimit from "express-rate-limit";


export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Trop de requêtes. Veuillez réessayer plus tard.",
});



export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2,

    message: "Trop de tentatives. Réessayez dans 15 minutes.",
});

export const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,

    message: "Vous envoyez trop de requêtes. Ralentissez.",
});

