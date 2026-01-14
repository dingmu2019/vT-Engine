# Frontend Components

This directory contains the React components that build the user interface of the T-Engine application. The architecture is component-based, utilizing Tailwind CSS for styling and Lucide React for icons.

## Directory Structure

### `feature-studio/`
The core workspace for module design and architecture. It is divided into several functional tabs:

- **`RequirementsTab.tsx`**: Editor for business requirements and user stories.
- **`LogicTab.tsx`**: Interface for defining business logic rules (IF/THEN).
- **`UIBlueprintTab.tsx`**: UI design specifications and component mapping.
- **`AIAssistantTab.tsx`**: Chat interface for interacting with AI agents.
- **`ExpertReqTab.tsx`**: specialized requirements input for domain experts.
- **`KnowledgeTab.tsx`**: Management of domain knowledge linked to the module.
- **`MockupGenerator.tsx`**: Tool to generate UI mockups based on requirements.
- **`AIPromptModal.tsx`**: Modal for managing AI prompt templates.

### `sidebar/`
Manages the application's navigation structure.
- **`Sidebar.tsx`**: Main sidebar container.
- **`SidebarTree.tsx`**: Recursive tree component for rendering navigation nodes.
- **`SidebarContext.tsx`**: Context provider for sidebar state (expansion, selection).

### `ui/`
Reusable UI atoms and molecules.
- **`AutoResizeTextarea.tsx`**: A textarea that adjusts its height automatically.

## Key Components

- **`FeatureStudio.tsx`**: The main container that orchestrates the different tabs for module management.
- **`AgentManagement.tsx`**: Interface for configuring AI Agents (Role, Prompts, Scope).
- **`UserManagement.tsx`**: Admin panel for managing users and roles.
- **`IntegrationManagement.tsx`**: Settings page for connecting external services (LLM, Database, etc.).
- **`AuditLogs.tsx`**: Viewer for system audit logs.
- **`GlobalStandardsEditor.tsx`**: Editor for system-wide design and terminology standards.

## Styling
The project uses **Tailwind CSS**. Components are designed to be responsive and support Dark Mode (handled via `dark` class).
