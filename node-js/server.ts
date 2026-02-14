import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { requestContext } from "./middleware/requestContext";
import patientRoutes from "./routes/patientRoute";
import userRoutes from "./routes/userRoute";
import authRoutes from "./routes/authRoute";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware";
import { sanitizeBody } from "./middleware/sanitizeMiddleware";
import appointmentRoutes from "./routes/appointmentRoute";
import { apiLimiter } from "./middleware/rateLimit";
import auditRoutes from "./routes/auditlogsRoute";
const app = express();
const port = 4000;


app.use(
    cors({
        origin: "http://localhost:4000",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(sanitizeBody);
app.use(requestContext);
app.use(express.static(path.join(__dirname, "public")));

function requireAuthPage(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.redirect("/index.html");
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET as string);
        next();
    } catch {
        return res.redirect("/index.html");
    }
}
app.use(apiLimiter);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashbord", requireAuthPage, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashbord.html"));
});

app.use("/audit", auditRoutes);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments", appointmentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
});
