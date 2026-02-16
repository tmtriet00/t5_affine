# Codebase Analysis Checklist

Use this checklist during Step 2 (Deep Codebase Analysis) to ensure thorough coverage.

## Phase 1: Discovery

- [ ] Identify the primary module/package where the feature lives
- [ ] List all files that will likely be modified
- [ ] Find similar features in the codebase to use as reference patterns
- [ ] Check for existing documentation (`.agent/docs/`, README files, inline docs)
- [ ] Identify the tech stack and frameworks used in the affected area

## Phase 2: Architecture Analysis

### File & Module Structure

- [ ] Map the folder structure of the affected area
- [ ] Identify the module's entry point(s)
- [ ] Understand the export/import graph for the affected files
- [ ] Check for circular dependencies

### Patterns & Conventions

- [ ] How are components/modules structured? (class-based, functional, hooks, etc.)
- [ ] What naming conventions are used? (files, functions, types, CSS classes)
- [ ] How is configuration managed? (env vars, config files, constants)
- [ ] What abstraction layers exist? (services, repositories, controllers, etc.)

### Data Flow

- [ ] How does data enter the system? (user input, API calls, events)
- [ ] How is state managed? (global store, local state, context, signals)
- [ ] How does data flow between components/modules?
- [ ] What serialization/deserialization happens?

### Type System

- [ ] What types/interfaces are relevant?
- [ ] Are there shared type definitions that need extension?
- [ ] Are there generic types or utility types in use?

## Phase 3: Risk Assessment

### Coupling & Impact

- [ ] Which other modules import from the affected files?
- [ ] Are there event systems or pub/sub patterns that could be affected?
- [ ] Could changes break existing API contracts?
- [ ] Are there generated files (types, schemas) that need regeneration?

### Test Coverage

- [ ] Do tests exist for the affected modules?
- [ ] What testing framework is used?
- [ ] Are there integration or e2e tests that cover the affected flows?
- [ ] What is the testing pattern? (unit, snapshot, component, integration)

### Build & Deploy

- [ ] Could changes affect the build pipeline?
- [ ] Are there env-specific configurations to consider?
- [ ] Could changes affect bundle size significantly?

## Analysis Summary Template

Use this template to document findings:

```markdown
## Analysis Summary: [Feature Name]

### Affected Area

- **Primary module**: [path]
- **Related modules**: [list of paths]
- **Similar feature reference**: [path to similar feature]

### Patterns to Follow

- **Component structure**: [description + file reference]
- **State management**: [description + file reference]
- **Data flow**: [description]

### Reusable Code

| Item   | Location | Purpose        |
| ------ | -------- | -------------- |
| [name] | [path]   | [what it does] |

### Risks & Constraints

| Risk          | Severity     | Mitigation      |
| ------------- | ------------ | --------------- |
| [description] | Low/Med/High | [how to handle] |

### Recommended Approach

[High-level description of the implementation strategy]
```
