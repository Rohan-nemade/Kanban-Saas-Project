# SaaS Project Management System (JiraClone)

A comprehensive, full-stack microservices-based project management tool designed for organizations to streamline task tracking, enhance collaboration, and manage workflows in real-time. Built with a robust backend architecture, this application functions as a highly scalable alternative to Jira.

## 🚀 Key Features

### 🏢 Organization & Multi-Tenancy
- **Isolated Workspaces:** Users can create distinct Organizations, keeping distinct teams or companies separate.
- **Role-Based Access Control:** Invite members to your organization and assign roles (`ADMIN`, `MANAGER`, or `MEMBER`).
- **Shared Access:** Once a user joins an organization, they instantly gain access to all projects within that workspace.

### 🔐 Secure Project Management
- **Password-Protected Projects:** Each project is created with a unique "Project Key". This key functions as a password—users must enter it to unlock the project board, ensuring sensitive operations remain secure.
- **Real-Time Kanban Boards:** Fully functional Kanban boards featuring interactive drag-and-drop task management across customizable columns (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`).

### ✅ Advanced Task Tracking
- **Interactive Task Modals:** Click on any task to view exhaustive details, change priorities, update descriptions, and check statuses.
- **Live Commenting:** Real-time discussion threads attached directly to individual tasks to facilitate team communication.
- **Auto-Sync:** Leveraging WebSockets ensures that dragging a task to a new column on your screen instantly reflects on your coworkers' screens.

## 🏗️ Technical Architecture

This application is built using a modern **Microservices Architecture**.

### Backend Services (Node.js & Express)
The backend is aggressively decoupled to ensure scalability and fault tolerance:
1. **Auth Service (`:4001`):** Handles secure user registration, password hashing (bcrypt), and JWT-based authentication.
2. **Org Service (`:4002`):** Manages organizations, membership invitations, and access roles. 
3. **Project Service (`:4003`):** Handles project creation, password-key verification, and organization-scoped project retrieval.
4. **Task Service (`:4004`):** The core engine for the Kanban board. It processes task creation, status updates, drag-and-drop ordering, and real-time task comments.
5. **Notification Service (`:4005`):** Utilizes `Socket.io` to broadcast live WebSocket events to all connected clients when a task is moved or created.

### Frontend 
- **React & Vite (`:5173 / :5174`):** A blazing-fast, responsive UI leveraging React Router for navigation and TailwindCSS for clean, modern styling.
- **Zustand:** Lightweight global state management for caching user sessions and organization data.
- **Hello Pangea DND:** Used to power the buttery-smooth, interactive drag-and-drop Kanban interface.

### Database Operations (MySQL)
- Transitioned entirely to **MySQL 8.0**. 
- Strict Relational Integrity: `AUTO_INCREMENT` primary keys, fully-cascading foreign keys (deleting an organization properly wipes out its projects, tasks, and comments).

## 🛠️ Running the Application Locally

1. **Database Setup:** Run the provided `packages/database/mysql_init.sql` script in your local MySQL instance to create the schema.
2. **Environment Variables:** Ensure your `.env` files are configured for database credentials across your microservices.
3. **Start the Stack:**
   From the root of the project, run:
   ```bash
   npm run dev
   ```
   *This command utilizes `concurrently` to spin up the React frontend alongside all 5 backend microservices instantaneously.*
