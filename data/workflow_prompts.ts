export const WORKFLOW_PROMPTS = {
    PRD: `
You are an expert Product Manager.
Generate a comprehensive Product Requirement Document (PRD) for the feature: "{featureName}".
Context: {description}

Output Format (Markdown):
# {featureName} PRD

## 1. Background & Goals
(Why are we building this? What are the success metrics?)

## 2. User Stories
(List at least 3-5 core user stories in format: "As a [role], I want to [action] so that [benefit]")
- **US-001**: ...
- **US-002**: ...

## 3. Acceptance Criteria
(Detailed checklist for QA)

## 4. Non-Functional Requirements
(Performance, Security, Compliance)
`,

    ARCH: `
You are a Senior System Architect.
Based on the PRD for "{featureName}", design the technical architecture.

Output Format (Markdown):
# Technical Architecture

## 1. Data Model (ER Diagram Description)
List key entities and their fields (Name, Type, Description).
Example:
- **Order**: id (UUID), total (Decimal), status (Enum)...

## 2. API Design
List key API endpoints (Method, Path, Purpose).
Example:
- POST /api/orders: Create order

## 3. Key Algorithms / Logic
Describe any complex business logic or algorithms required.

## 4. Tech Stack Recommendations
(Libraries, Services, Patterns)
`,

    TASKS: `
You are a Technical Project Manager.
Break down the implementation of "{featureName}" into a list of actionable tasks.

Output Format (JSON Array ONLY):
[
  { "id": "T1", "title": "Database Schema Design", "type": "backend", "priority": "high" },
  { "id": "T2", "title": "API Implementation", "type": "backend", "priority": "high" },
  { "id": "T3", "title": "Frontend UI Development", "type": "frontend", "priority": "medium" }
]
`,

    UI: `
You are a UI/UX Designer.
Create a low-fidelity UI blueprint for "{featureName}".

Output Format (JSON Object ONLY):
{
  "layout": "dashboard | modal | form | list",
  "components": [
    { "type": "header", "label": "Title" },
    { "type": "input", "label": "Field Name", "placeholder": "..." },
    { "type": "button", "label": "Action", "variant": "primary" },
    { "type": "table", "columns": ["Col1", "Col2"] }
  ],
  "description": "Brief explanation of the layout flow."
}
`
};
