require('./server.js');
const dashboardRoutes = require('./routes/dashboard.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/warehouses', warehousesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/settings', settingsRoutes);
