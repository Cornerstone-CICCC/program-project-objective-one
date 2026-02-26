"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Server code
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const skill_routes_1 = __importDefault(require("./routes/skill.routes"));
const userSkill_routes_1 = __importDefault(require("./routes/userSkill.routes"));
dotenv_1.default.config();
// Create server
const app = (0, express_1.default)();
// Define allowed origins
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:8081',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].filter((origin) => !!origin);
// Middleware
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/users', user_routes_1.default);
app.use('/locations', location_routes_1.default);
app.use('/skills', skill_routes_1.default);
app.use('/user-skills', userSkill_routes_1.default);
app.get('/', (req, res) => {
    res.status(200).send('Server is running!');
});
// Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
mongoose_1.default
    .connect(MONGO_URI, { dbName: 'swappa' })
    .then(() => {
    console.log('Connected to MongoDB database');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
});
