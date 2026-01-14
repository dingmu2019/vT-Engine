# Server Backend

This directory contains the Node.js/Express backend for the T-Engine application. It handles data persistence, user authentication, and API services for the frontend.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase Client)
- **Authentication**: JWT (Mocked/Planned), BCrypt
- **Logging**: Custom Audit Logging

## Setup & Installation

1.  Navigate to the server directory:
    ```bash
    cd server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Copy `.env.example` to `.env` and fill in your Supabase credentials:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    PORT=3000
    ```

4.  Database Migration:
    Run the SQL scripts in `db/` using your Supabase dashboard or SQL client to set up the schema.
    - `schema.sql`: Core tables (users, modules, agents, logs)
    - `migration_*.sql`: Additional features and data seeding

5.  Run the Server:
    - Development: `npm run dev`
    - Production: `npm run start`

## API Endpoints

### Authentication
- `POST /auth/login`: User login
- `POST /auth/change-password`: Change user password
- `POST /auth/update-profile`: Update user profile

### Users
- `GET /users`: List all users
- `POST /users`: Create new user
- `POST /users/:id`: Update user
- `POST /users/:id/toggle-status`: Enable/Disable user
- `POST /users/:id/reset-password`: Reset user password

### Navigation
- `GET /navigation`: Get navigation tree
- `POST /navigation`: Update navigation tree
- `GET /navigation/standards`: Get global standards
- `POST /navigation/standards`: Update global standards

### Modules
- `GET /modules/:id`: Get module details
- `POST /modules/:id`: Update module details

### Agents
- `GET /agents`: List all AI agents
- `POST /agents`: Create new agent
- `POST /agents/:id`: Update agent
- `DELETE /agents/:id`: Delete agent
- `GET/POST/DELETE /agents/:id/prompts`: Manage agent prompts

### Integrations
- `GET /integrations`: List integrations
- `PUT /integrations/:key`: Update integration config
- `POST /integrations/:key/toggle`: Enable/Disable integration

### Logs
- `GET /logs/audit`: Get audit logs
- `GET /logs/system`: Get system error logs

## Database Schema

Key tables include:
- `users`: User accounts and roles (Admin, PM, Expert, Dev)
- `modules`: Business module definitions (requirements, logic, UI)
- `agents`: AI Agent configurations
- `audit_logs`: System audit trail
- `integrations`: External service configurations (LLM, DB, Email)
