"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db/db"));
const userRoutes_1 = __importDefault(require("./routes/auth/userRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customer/customerRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/admin/adminRoutes"));
const auth_tokenController_1 = __importDefault(require("./controller/auth/auth.tokenController"));
const taskRoutes_1 = __importDefault(require("./routes/task/taskRoutes"));
const responseHandler_1 = require("./utils/responseHandler");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
db_1.default;
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    // origin: "*", // Allow requests only from this origin
    origin: ["https://cpm-frontend.vercel.app", "http://localhost:5173"], // Allow requests only from this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"] // Allow specific headers
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/auth", userRoutes_1.default);
app.use("/api/customer", customerRoutes_1.default);
app.use("/api/users", auth_tokenController_1.default);
app.use("/api", adminRoutes_1.default);
app.use("/api", taskRoutes_1.default);
// Global Error Handling Middleware
app.use((err, req, res, next) => {
    (0, responseHandler_1.sendErrorResponse)(res, err.statusCode || 500, err.message || "Internal Server Error");
});
require("./jobs/subscriptionScheduler");
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
