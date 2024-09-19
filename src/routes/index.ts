import { Router } from "express";
import userRoutes from "./userRoutes";

const router = Router();

// User routes
router.use("/users", userRoutes);

export default router;
