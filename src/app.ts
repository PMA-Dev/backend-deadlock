import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

// Middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cors()); // CORS

// Routes
app.use("/api", routes);

// Export the app
export default app;
