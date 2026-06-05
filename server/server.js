const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const socketConfig = require('./config/socket');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

// Enable CORS
app.use(cors());

// Body Parser
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes mapping
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/deliverables', require('./routes/deliverables'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/team', require('./routes/team'));
app.use('/api/reports', require('./routes/reports'));

// Direct file path serve check (for local development testing)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Fallback index.html mapping for client router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// Auto-seed database check
const autoSeed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No user accounts detected in MongoDB. Seeding database automatically...');
      const seedDB = require('./utils/seed');
      // Run seed function (will populate all collections)
      await seedDB();
      console.log('Database auto-seeded successfully!');
    }
  } catch (error) {
    console.error('Failed to run database auto-seeding:', error.message);
  }
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Run auto-seeding
  await autoSeed();
});
