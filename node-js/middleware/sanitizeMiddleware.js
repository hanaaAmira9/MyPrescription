
function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

function sanitizeValue(value) {
    if (typeof value === "string") {
        return escapeHtml(value.trim());
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === "object") {
        return sanitizeObject(value);
    }
    return value;
}

function sanitizeObject(obj) {
    const sanitized = {};
    for (const key in obj) {
        sanitized[key] = sanitizeValue(obj[key]);
    }
    return sanitized;
}

function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body);
    }
    next();
}

function sanitizeQuery(req, res, next) {
    if (req.query && typeof req.query === "object") {
        req.query = sanitizeObject(req.query);
    }
    next();
}

function sanitizeParams(req, res, next) {
    if (req.params && typeof req.params === "object") {
        req.params = sanitizeObject(req.params);
    }
    next();
}

module.exports = { sanitizeBody, sanitizeQuery, sanitizeParams };
