# ClientSync – Agency Project Delivery Platform

ClientSync is a production-ready, full-stack SaaS project management and client collaboration platform designed for digital marketing agencies and software development teams. The platform helps agencies manage projects, clients, tasks, milestones, deliverables, team members, approvals, reports, and communication from a single unified dashboard.

---

## 🚀 Tech Stack

### Frontend
- **React.js & Vite** – Fast, module-based single-page application setup.
- **Tailwind CSS** – Premium, modern dark-mode-first aesthetic (slate base, indigo accents) similar to Linear and ClickUp.
- **React Router** – Secured role-based routing controls.
- **Axios** – HTTP request client with global header integration.
- **Chart.js & React-Chartjs-2** – Sleek analytics rendering (Monthly progress area charts, status doughnuts, department capacity bars, and team productivity radar).
- **Lucide Icons** – High-fidelity modern icon pack.

### Backend
- **Node.js & Express.js** – MVC architecture containing clean CRUD operations and strict JWT role validation middlewares.
- **Socket.io** – Real-time event communication (collaboration chat channels, direct notifications, and Kanban board task movements).
- **Multer** – Handling local file uploads for agency deliverables.

### Database
- **MongoDB Atlas / Mongoose** – Relational schema configurations tracking Users, Clients, Projects, Tasks, Deliverables, Milestones, Notifications, and Activity logs.

---

## 👥 User Roles & Permissions

1. **Admin**
   - Manage client profiles (CRUD).
   - Create and delete projects.
   - Add/manage team members (create logins, change roles/departments).
   - Full CRUD on tasks, milestones, and deliverables.
   - View reports and audit activity logs.

2. **Project Manager**
   - Create and update tasks.
   - Track team capacities.
   - Upload deliverables.
   - Update project status.
   - View reports.

3. **Team Member**
   - View assigned tasks.
   - Move tasks across Kanban board status columns.
   - Comment on tasks.
   - Upload deliverables for client reviews.

4. **Client**
   - View project completion progress.
   - Access project milestones.
   - Review submitted deliverables (Approve/Reject actions).
   - Post comments/feedbacks directly on deliverables.

---

## 📁 Folder Structure

```
clientSync/
├── package.json               # Root script runner for concurrent dev servers
├── README.md                  # Deployment and execution instructions
├── .gitignore
├── client/                    # React Vite Frontend SPA
│   ├── index.html             # Google fonts & styling anchors
│   ├── package.json
│   ├── vite.config.js         # API & Websocket proxies pointing to backend
│   ├── tailwind.config.js     # Glassmorphic shadow assets & dark theme configs
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── index.css          # Global scrollbars, layer directives, and neon shadows
│       ├── App.jsx            # Routing matrix mapping protected screens
│       ├── context/           # Session management & Socket events connections
│       ├── components/        # Sidebar navigation, TopNavbars, and ChatDrawers
│       └── pages/             # Dashboard, Projects, Kanban, Deliverables, Reports, Team, Notifications, Settings
└── server/                    # Node Express Backend
    ├── package.json
    ├── server.js              # Server entry point, express middlewares, and Socket rooms
    ├── .env                   # Environment configurations (Port, MongoDB, JWT)
    ├── config/                # Database connection & socket handler modules
    ├── controllers/           # Controllers containing all CRUD and analytical metrics logic
    ├── models/                # 8 Mongoose Schema models
    ├── middlewares/           # JWT security filters & Multer storage configurations
    ├── routes/                # Express API router maps
    └── utils/                 # Data seeder containing sample datasets
```

---

## ⚙️ Initial Startup & Local Run

Follow these quick commands to spin up the application on your local machine:

### 1. Prerequisite Database Check
Make sure you have **MongoDB** running locally (`mongodb://127.0.0.1:27017/clientsync`) OR configure a remote **MongoDB Atlas** URL inside `server/.env`.
*(The server will automatically seed the database on first run if it detects no accounts).*

### 2. Dependency Installation
Open your terminal in the root `clientSync` directory and install all node packages (root, server, and client) by running:
```bash
# This installs concurrent scripts, backend dependencies, and frontend packages
npm run install-all
```

### 3. Running the Dev Environment
Start both the Express backend server and the Vite dev server concurrently with one command:
```bash
npm run dev
```
- **Frontend App** will load at: [http://localhost:3000](http://localhost:3000)
- **Backend API** will listen at: [http://localhost:5000](http://localhost:5000)

### 4. Database Seeding (Optional Manual Trigger)
If you want to manually clear and re-seed the database with 10 clients, 20 team members, 10 projects, and 50 tasks, run:
```bash
npm run seed
```

---

## 🔑 Demo login Credentials

All seeded accounts share the password: **`password123`**

- **Admin Login:** `admin@clientsync.com`
- **Project Manager Login:** `liam@clientsync.com`
- **Team Member Login:** `james@clientsync.com`
- **Client Login:** `john@acme.com`
