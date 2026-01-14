# Data & Configuration

This directory holds the static configuration, initial seed data, and type definitions used by the frontend application.

## Files

### `navigation.ts`
Defines the default application navigation structure.
- Exports `NAV_TREE`: A recursive array of `NavNode` objects representing the sidebar menu.
- Structure covers:
    - Product Management
    - Market & Sales
    - Delivery & Service
    - Tenant & Authorization
    - Operation Management
    - System Settings

### `agents.ts`
Configuration for the built-in AI Agents.
- Exports `INITIAL_AGENTS`: A list of pre-configured agents.
- **Roles**:
    - **M&S-A**: Market & Sales Assistant
    - **P&S-A**: Product & Service Assistant
    - **G&A-A**: General & Administrative Assistant
    - **D&A-A**: Data & Analytics Assistant
- Includes system prompts and interaction examples.

### `mocks.ts`
Contains mock data for development and testing purposes.
- **`MOCK_DATABASE`**: Simulated database content for modules (Requirements, Logic Rules).
- **`INITIAL_USERS`**: Default user accounts (Admin, PM, Expert, Dev).
- **`LLM_PROVIDERS`**: Configuration for supported AI providers (Google, OpenAI, etc.).
- **`DB_PROVIDERS`**: Supported database types for integration (MySQL, Postgres, etc.).

### `ui.ts`
UI-related constants and configuration.
- **`STATUS_COLORS`**: Color mapping for different module statuses.
- **`PRIORITY_COLORS`**: Color mapping for task/requirement priorities.

## Usage
These files are primarily used to seed the initial state of the application or provide fallback data when the backend is unreachable. In a production environment, this data is often superseded by API responses from the server.
