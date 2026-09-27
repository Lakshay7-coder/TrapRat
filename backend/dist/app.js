"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const database_1 = require("./config/database");
// Import Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const trainees_routes_1 = __importDefault(require("./modules/trainees/trainees.routes"));
const providers_routes_1 = __importDefault(require("./modules/providers/providers.routes"));
const courses_routes_1 = __importDefault(require("./modules/courses/courses.routes"));
const batches_routes_1 = __importDefault(require("./modules/batches/batches.routes"));
const enrolments_routes_1 = __importDefault(require("./modules/enrolments/enrolments.routes"));
const outcomes_routes_1 = __importDefault(require("./modules/outcomes/outcomes.routes"));
const employers_routes_1 = __importDefault(require("./modules/employers/employers.routes"));
const followups_routes_1 = __importDefault(require("./modules/followups/followups.routes"));
const documents_routes_1 = __importDefault(require("./modules/documents/documents.routes"));
const consent_routes_1 = __importDefault(require("./modules/consent/consent.routes"));
const anomalies_routes_1 = __importDefault(require("./modules/anomalies/anomalies.routes"));
const identity_routes_1 = __importDefault(require("./modules/identity/identity.routes"));
const reasons_routes_1 = __importDefault(require("./modules/reasons/reasons.routes"));
const incentives_routes_1 = __importDefault(require("./modules/incentives/incentives.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const audit_routes_1 = __importDefault(require("./modules/audit/audit.routes"));
const dev_routes_1 = __importDefault(require("./modules/dev/dev.routes"));
const analytics_controller_1 = require("./modules/analytics/analytics.controller");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: [env_1.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Static uploads serving
app.use('/uploads', express_1.default.static(path_1.default.resolve(env_1.env.UPLOAD_DIR)));
// Health Checks
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Kaushal Sankalp Backend API',
    });
});
app.get('/ready', async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: 'ready', database: 'connected' });
    }
    catch (err) {
        res.status(503).json({ status: 'not_ready', error: err.message });
    }
});
// API Routes Mounting
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/trainees', trainees_routes_1.default);
app.use('/api/providers', providers_routes_1.default);
app.use('/api/courses', courses_routes_1.default);
app.use('/api/batches', batches_routes_1.default);
app.use('/api/enrolments', enrolments_routes_1.default);
app.use('/api/outcomes', outcomes_routes_1.default);
app.use('/api/employers', employers_routes_1.default);
app.use('/api/public', employers_routes_1.default); // For /api/public/verify/:token
app.use('/api/followups', followups_routes_1.default);
app.use('/api/documents', documents_routes_1.default);
app.use('/api/consent', consent_routes_1.default);
app.use('/api/anomalies', anomalies_routes_1.default);
app.use('/api/identity', identity_routes_1.default);
app.use('/api/reasons', reasons_routes_1.default);
app.use('/api/incentives', incentives_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/audit-logs', audit_routes_1.default);
app.use('/api/dev', dev_routes_1.default);
// Frontend Route Compatibility Aliases
app.use('/api/admin/anomalies', anomalies_routes_1.default);
app.get('/api/admin/dashboard', analytics_controller_1.AnalyticsController.getSummary);
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: { message: 'Route not found' },
    });
});
// Global Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
