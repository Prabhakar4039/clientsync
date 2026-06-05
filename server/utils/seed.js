const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// Load env vars
dotenv.config({ path: '../.env' });
// Also try current directory .env if path above fails
dotenv.config();

const clientsData = [
  { name: 'John Doe', company: 'Acme Corp', email: 'john@acme.com', phone: '123-456-7890', industry: 'Manufacturing', status: 'Active' },
  { name: 'Alice Smith', company: 'Globex Corp', email: 'alice@globex.com', phone: '123-456-7891', industry: 'Logistics', status: 'Active' },
  { name: 'Bob Johnson', company: 'Initech', email: 'bob@initech.com', phone: '123-456-7892', industry: 'Software', status: 'Active' },
  { name: 'Sarah Connor', company: 'Cyberdyne Systems', email: 'sarah@cyberdyne.com', phone: '123-456-7893', industry: 'Robotics', status: 'Active' },
  { name: 'Bruce Wayne', company: 'Wayne Enterprises', email: 'bruce@wayne.com', phone: '123-456-7894', industry: 'Defense', status: 'Active' },
  { name: 'Tony Stark', company: 'Stark Industries', email: 'tony@stark.com', phone: '123-456-7895', industry: 'Energy', status: 'Active' },
  { name: 'Diana Prince', company: 'Themyscira Exports', email: 'diana@exports.com', phone: '123-456-7896', industry: 'Retail', status: 'Active' },
  { name: 'Clark Kent', company: 'Daily Planet', email: 'clark@planet.com', phone: '123-456-7897', industry: 'Media', status: 'Active' },
  { name: 'Peter Parker', company: 'Oscorp Security', email: 'peter@oscorp.com', phone: '123-456-7898', industry: 'Biotech', status: 'Active' },
  { name: 'Barry Allen', company: 'Central Tech', email: 'barry@central.com', phone: '123-456-7899', industry: 'Research', status: 'Inactive' },
];

const teamData = [
  // 1 Admin
  { name: 'System Admin', email: 'admin@clientsync.com', password: 'password123', role: 'Admin', department: 'Management' },
  // 3 Project Managers
  { name: 'Liam Neeson', email: 'liam@clientsync.com', password: 'password123', role: 'Project Manager', department: 'Management' },
  { name: 'Emma Watson', email: 'emma@clientsync.com', password: 'password123', role: 'Project Manager', department: 'Management' },
  { name: 'Ryan Reynolds', email: 'ryan@clientsync.com', password: 'password123', role: 'Project Manager', department: 'Management' },
  // 16 Team Members
  { name: 'James Carter', email: 'james@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Sophia Loren', email: 'sophia@clientsync.com', password: 'password123', role: 'Team Member', department: 'Design' },
  { name: 'Robert Downey', email: 'robert@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Scarlett Johansson', email: 'scarlett@clientsync.com', password: 'password123', role: 'Team Member', department: 'Marketing' },
  { name: 'Chris Evans', email: 'chris@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Mark Ruffalo', email: 'mark@clientsync.com', password: 'password123', role: 'Team Member', department: 'QA' },
  { name: 'Chris Hemsworth', email: 'hemsworth@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Tom Hiddleston', email: 'tom@clientsync.com', password: 'password123', role: 'Team Member', department: 'Design' },
  { name: 'Elizabeth Olsen', email: 'elizabeth@clientsync.com', password: 'password123', role: 'Team Member', department: 'Marketing' },
  { name: 'Jeremy Renner', email: 'jeremy@clientsync.com', password: 'password123', role: 'Team Member', department: 'QA' },
  { name: 'Chadwick Boseman', email: 'chadwick@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Brie Larson', email: 'brie@clientsync.com', password: 'password123', role: 'Team Member', department: 'Marketing' },
  { name: 'Tom Holland', email: 'holland@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Zendaya Coleman', email: 'zendaya@clientsync.com', password: 'password123', role: 'Team Member', department: 'Design' },
  { name: 'Benedict Cumberbatch', email: 'benedict@clientsync.com', password: 'password123', role: 'Team Member', department: 'Development' },
  { name: 'Paul Rudd', email: 'paul@clientsync.com', password: 'password123', role: 'Team Member', department: 'QA' },
];

const projectsData = [
  { name: 'E-Commerce Platform Rebuild', description: 'Rebuilding Acme Corp E-commerce store using React, Node, and Tailwind CSS for better web speed.', budget: 45000, priority: 'High', status: 'Active' },
  { name: 'Globex Supply Chain App', description: 'Development of an internal inventory tracking app for Globex logistics operations.', budget: 60000, priority: 'High', status: 'Active' },
  { name: 'Initech SEO Optimization', description: 'Comprehensive SEO optimization, keyword research, and blog generation plan for Initech SaaS products.', budget: 15000, priority: 'Low', status: 'Active' },
  { name: 'Cyberdyne AI Chatbot', description: 'Integrating a support chatbot leveraging AI models to automate customer tickets.', budget: 35000, priority: 'Medium', status: 'Planning' },
  { name: 'Wayne Defense Portal security', description: 'Strict security audits and portal hardening for military hardware contracts.', budget: 95000, priority: 'High', status: 'Review' },
  { name: 'Stark Grid Dashboard UI', description: 'Designing a premium real-time visualization tool for renewable energy grids.', budget: 80000, priority: 'High', status: 'Active' },
  { name: 'Themyscira Shopify Store', description: 'Setting up a brand-new Shopify storefront for Greek imports and accessories.', budget: 12000, priority: 'Medium', status: 'Completed' },
  { name: 'Daily Planet News App', description: 'Refactoring their iOS/Android mobile news aggregator app and subscriptions workflow.', budget: 40000, priority: 'Medium', status: 'Active' },
  { name: 'Oscorp Lab Data System', description: 'Building a secure internal database for genetic research logs and laboratory inventory.', budget: 75000, priority: 'High', status: 'On Hold' },
  { name: 'Central Tech Landing Page', description: 'Modern, high-converting agency marketing landing page with glassmorphic visuals.', budget: 8000, priority: 'Low', status: 'Planning' },
];

const taskTitles = [
  'Define project specifications', 'Wireframe main UI dashboard', 'Set up Git repository and CI/CD',
  'Design MongoDB Atlas database schema', 'Implement JWT Auth flow', 'Conduct team briefing meeting',
  'Code core REST API endpoints', 'Set up Socket.io server connection', 'Build Kanban Board component',
  'Integrate Chart.js analytics', 'Write unit tests for Auth service', 'Conduct security vulnerability scan',
  'Deploy backend to Render staging', 'Configure Tailwind Theme styling', 'Create landing page mockups',
  'Optimize images for web assets', 'Develop settings profile views', 'Implement forgot password workflow',
  'Write API docs with OpenAPI', 'Integrate email alert system', 'Test browser routing structures',
  'Configure dark mode CSS tokens', 'Code file upload controller', 'Set up client review system',
  'Conduct user acceptance testing', 'Audit mobile responsive layouts', 'Debug Web socket reconnections',
  'Optimize MongoDB aggregation queries', 'Build CSV export feature', 'Develop PDF analytics report',
  'Refactor state management logic', 'Run PageSpeed SEO validation', 'Integrate third-party payment gate',
  'Configure Docker deployment file', 'Audit CSS styles for accessibility', 'Set up multi-tenancy controls',
  'Write database migration scripts', 'Document deployment manual', 'Create project demo recording',
  'Resolve backlog styling glitches', 'Improve dashboard loading speeds', 'Add tasks activity audit log',
  'Configure CORS policy headers', 'Test concurrent database connections', 'Handle file upload sizes',
  'Build admin control dashboards', 'Implement search index systems', 'Write release change logs',
  'Conduct final stakeholder presentation', 'Release production v1.0.0'
];

const seedDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clientsync';
    console.log(`Seeding database using connection: ${connStr}`);
    await mongoose.connect(connStr);

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Client.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();
    await Milestone.deleteMany();
    await Deliverable.deleteMany();
    await ActivityLog.deleteMany();
    await Notification.deleteMany();

    console.log('Seeding Client collection...');
    const insertedClients = await Client.insertMany(clientsData);

    console.log('Seeding User collection (internal team members)...');
    const insertedTeam = [];
    for (const member of teamData) {
      const u = new User(member);
      await u.save(); // pre-save hook will hash passwords
      insertedTeam.push(u);
    }

    console.log('Seeding Client users so they can log in...');
    const insertedClientUsers = [];
    for (const clientRecord of insertedClients) {
      const u = new User({
        name: clientRecord.name,
        email: clientRecord.email,
        password: 'password123', // Shared password for seeding logins
        role: 'Client',
        department: 'External Client',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clientRecord.name)}`,
      });
      await u.save();
      insertedClientUsers.push(u);
    }

    console.log('Seeding Projects...');
    const insertedProjects = [];
    const pmUsers = insertedTeam.filter(u => u.role === 'Project Manager');
    const teamUsers = insertedTeam.filter(u => u.role === 'Team Member');

    for (let i = 0; i < projectsData.length; i++) {
      const projectData = projectsData[i];
      // Randomly allocate a client
      const client = insertedClients[i % insertedClients.length];
      // Randomly allocate a project manager and 3 team members
      const pm = pmUsers[i % pmUsers.length];
      const assignedTeam = [
        pm._id,
        teamUsers[(i * 2) % teamUsers.length]._id,
        teamUsers[(i * 2 + 1) % teamUsers.length]._id,
        teamUsers[(i * 3) % teamUsers.length]._id,
      ];

      // Set realistic start/end dates
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (15 + i * 5));
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (30 + i * 10));

      const p = await Project.create({
        ...projectData,
        client: client._id,
        team: assignedTeam,
        startDate,
        endDate,
      });
      insertedProjects.push(p);

      // Seed 2 Milestones per project
      await Milestone.create({
        name: 'Design & Architecture Signoff',
        dueDate: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        completionPercent: p.status === 'Completed' || p.status === 'Review' ? 100 : 70,
        project: p._id,
      });

      await Milestone.create({
        name: 'Alpha Build Release',
        dueDate: new Date(startDate.getTime() + 25 * 24 * 60 * 60 * 1000),
        completionPercent: p.status === 'Completed' ? 100 : (p.status === 'Review' ? 90 : 0),
        project: p._id,
      });
    }

    console.log('Seeding 50 Tasks...');
    const statuses = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
    const priorities = ['Low', 'Medium', 'High'];

    for (let i = 0; i < 50; i++) {
      const project = insertedProjects[i % insertedProjects.length];
      // Find team members assigned to this project
      const teamPool = project.team;
      const assignee = teamPool[i % teamPool.length];

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i % 7) - 3);

      const status = i < 20 ? 'Completed' : (i < 30 ? 'In Progress' : (i < 38 ? 'To Do' : (i < 45 ? 'Review' : 'Backlog')));
      const priority = priorities[i % priorities.length];

      // Select random tags
      const tags = [];
      if (i % 3 === 0) tags.push('Frontend');
      if (i % 3 === 1) tags.push('Backend');
      if (i % 3 === 2) tags.push('Design');
      if (i % 5 === 0) tags.push('API');
      if (i % 7 === 0) tags.push('QA');

      const task = await Task.create({
        title: taskTitles[i],
        description: `This is a seeded detailed description for task "${taskTitles[i]}" under project "${project.name}". Ensure all constraints are followed.`,
        project: project._id,
        assignee: assignee,
        priority: priority,
        dueDate: dueDate,
        status: status,
        tags: tags,
        history: [
          {
            user: project.team[0], // PM
            action: 'Task Created',
            details: 'Initial seeding creation',
            createdAt: project.startDate,
          }
        ]
      });

      // If status is completed, add transition log
      if (status === 'Completed') {
        task.history.push({
          user: assignee,
          action: 'Status Changed',
          details: 'Moved from "In Progress" to "Completed"',
          createdAt: new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        });
        await task.save();
      }

      // Add a couple of comments to tasks
      if (i % 4 === 0) {
        task.comments.push({
          user: project.team[0],
          text: 'Is this blocker resolved? We need to keep on schedule.',
          createdAt: new Date(dueDate.getTime() - 4 * 24 * 60 * 60 * 1000),
        });
        task.comments.push({
          user: assignee,
          text: 'Working on it. Will submit for review soon.',
          createdAt: new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        });
        await task.save();
      }
    }

    console.log('Seeding initial Deliverables...');
    // Seed 3 deliverables for demo
    const testDeliverable1 = await Deliverable.create({
      title: 'Figma Dashboard Layout mockup',
      description: 'Initial design directions for the Stark Grid Dashboard interface.',
      fileName: 'Figma Link - Stark Dashboard Design',
      fileUrl: 'https://figma.com/file/mock-stark-dashboard',
      fileType: 'Design',
      project: insertedProjects[5]._id, // Stark
      submittedBy: teamUsers[1]._id, // Sophia (Design)
      status: 'Pending',
    });

    const testDeliverable2 = await Deliverable.create({
      title: 'Acme API Route Specifications',
      description: 'Detailed API endpoint list and controller structure definitions in PDF format.',
      fileName: 'acme_api_specifications_v1.pdf',
      fileUrl: '/uploads/acme_api_specifications_v1.pdf',
      fileType: 'PDF',
      project: insertedProjects[0]._id, // Acme
      submittedBy: teamUsers[0]._id, // James (Dev)
      status: 'Approved',
      feedback: [{
        user: insertedClientUsers[0]._id, // Acme Client
        text: 'Looks excellent! The endpoints cover all our requirements. Approved.',
        createdAt: new Date(),
      }]
    });

    console.log('Seeding initial Activity Logs...');
    const adminUser = insertedTeam[0];
    await ActivityLog.create({
      user: adminUser._id,
      userName: adminUser.name,
      action: 'System Seeding',
      details: 'Populated demo databases with default datasets.',
      entityType: 'System',
    });

    console.log('Database successfully seeded!');
    console.log('\n--- DEMO LOGIN DETAILS ---');
    console.log(`Admin Login: admin@clientsync.com | Password: password123`);
    console.log(`PM Login: liam@clientsync.com | Password: password123`);
    console.log(`Team Member Login: james@clientsync.com | Password: password123`);
    console.log(`Client Login: john@acme.com | Password: password123`);
    console.log('---------------------------\n');

    if (require.main === module) {
      await mongoose.connection.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

// Check if run directly
if (require.main === module) {
  seedDB();
}

module.exports = seedDB;
