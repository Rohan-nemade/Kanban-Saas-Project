# Project Migration & Feature Implementation Plan

## Goal Description
The objective is to fix critical structural issues in the backend (where `project-service` code was accidentally replaced with `task-service` logic), fully transition the application's infrastructure to MySQL, implement organization-wide access controls, and introduce secure, key-protected project access. Additionally, system unused files will be deleted and Docker / npm configurations will be finalized.

## Proposed Changes

### Database Initialization
- **[NEW] `mysql_init.sql`**: I will generate a complete MySQL initialization script. This script will create the following tables using auto-increment IDs to match current queries: `users`, `organizations`, `organization_members`, `projects`, `tasks`, `task_messages` (or `comments`). The `projects` table will continue using `key` but it will act as an access password.

---

### Backend Services
- **[MODIFY] [apps/project-service/src/controllers.js](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/project-service/src/controllers.js)**:
  - The file currently contains `task-service` logic instead of project logic. I will completely rewrite it to implement `createProject`, `getProjects`, `getProjectById`, and `deleteProject`.
  - `getProjects` will fetch projects belonging to organizations that the user is a member of.
  - Add a **[NEW]** endpoint `POST /:id/verify` to verify the project's access key before granting access.
- **[MODIFY] [apps/project-service/src/routes.js](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/project-service/src/routes.js)**: Expose the `/verify` endpoint.
- **[MODIFY] [apps/task-service/src/controllers.js](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/task-service/src/controllers.js)**:
  - Ensure users can create, read, and delete tasks if they are in the same organization as the project. 
- **[MODIFY] [apps/org-service/src/controllers.js](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/org-service/src/controllers.js)**:
  - Ensure cascading deletes (deleting an organzation removes projects and tasks).

---

### Frontend Features
- **[MODIFY] [apps/frontend/src/pages/Dashboard.jsx](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/frontend/src/pages/Dashboard.jsx)**:
  - Remove the display of `Project Key` to ensure it remains a secret password.
  - Implement a modal that prompts the user for the "Project Key" when they attempt to open an existing project. If successful, navigate to the [ProjectBoard](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/frontend/src/pages/ProjectBoard.jsx#11-267).
  - Add a delete confirmation popup when deleting an organization or project.
- **[MODIFY] [apps/frontend/src/pages/ProjectBoard.jsx](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/frontend/src/pages/ProjectBoard.jsx)**:
  - Add delete confirmation popups when deleting tasks or the project.
- **[MODIFY] [apps/frontend/src/api.js](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/apps/frontend/src/api.js)**:
  - Add API configurations for verifying keys and deleting entities.

---

### Code Cleanup & Configuration
- **[DELETE] [packages/database/schema.sql](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/packages/database/schema.sql)** (Old Postgres schema)
- **[DELETE] [convert.mjs](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/convert.mjs)**, **[cleanup.mjs](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/cleanup.mjs)**, and **[tmp-fix-esm.mjs](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/tmp-fix-esm.mjs)** (Unusable migration files)
- **[MODIFY] [docker-compose.yml](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/docker-compose.yml)**: Switch the database from `postgres:15-alpine` to `mysql:8`. Change environment variables to `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, etc., and map the init script to `/docker-entrypoint-initdb.d`.
- **[MODIFY] [package.json](file:///c:/Users/HP/OneDrive/Documents/Projects/SaaS%20Project%20Management/package.json)**: Make sure root scripts accurately reference the correct workspaces and concurrently start the necessary services.

## Verification Plan

### Automated Tests
- Since there are no existing test suites, I will focus on the initialization script and manual verification.

### Manual Verification
- **Run MySQL script**: Give the `mysql_init.sql` script to the user so they can run it in their MySQL instance.
- **Service Bootup**: Start the project with `npm run dev` and ensure frontend, project, task, auth, and org services are running without crash loops.
- **Feature Tests**: 
  - Log in, create an Org.
  - Add a sub-user to the Org. Validate that both see the same projects and tasks.
  - Create a project with a key. Attempt to open it; verify the key prompt appears.
  - Delete a task/project/org and verify the native Javascript `window.confirm` or custom modal works.
