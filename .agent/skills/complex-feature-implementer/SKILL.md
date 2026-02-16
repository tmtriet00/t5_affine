---
name: complex-feature-implementer
description: Structured workflow for implementing complex features in an existing codebase. This skill should be used when a user requests a significant new feature that requires deep understanding of the existing architecture, careful planning, and iterative refinement before implementation begins. It guides the agent through requirement clarification, codebase analysis, plan creation with user review, and plan finalization for implementation.
---

# Complex Feature Implementer

## Overview

This skill provides a structured, multi-phase workflow for implementing complex features in existing codebases. It ensures that requirements are fully understood, the codebase is deeply analyzed for integration points and risks, a concrete implementation plan is created and reviewed by the user, and the final plan is refined to be actionable before any code is written.

## When to Use

- When a user requests a new feature that touches multiple files or modules
- When a feature requires understanding existing architecture before implementation
- When the impact of changes is non-obvious and requires analysis
- When the user wants a reviewed plan before any code changes begin
- When the feature is large enough that ad-hoc implementation would be risky

## Workflow

### Step 1: Requirement Clarification — Ask Top 5 Questions

Before any analysis or coding, clarify the user's intent by asking exactly **5 targeted questions**. Select the most impactful questions from the categories below, tailored to the specific feature request.

#### Question Selection Strategy

Evaluate the feature request and choose the 5 most important questions from these categories:

1. **Scope & Boundaries** — What is included vs. excluded? Where does this feature start and end?
2. **User Experience** — How should the end user interact with this feature? What does the ideal flow look like?
3. **Data & State** — What data does this feature need? Where does it come from? How is it persisted?
4. **Integration Points** — How should this connect with existing functionality? Are there dependencies on other features?
5. **Edge Cases & Error Handling** — What happens when things go wrong? What are the boundary conditions?
6. **Performance & Scale** — Are there performance requirements or expectations for data volume?
7. **Non-Functional Requirements** — Security, accessibility, backward compatibility, or migration concerns?
8. **Priority & Phasing** — Can this be delivered incrementally? What is the MVP vs. the full vision?

#### Guidelines

- Present all 5 questions in a single, numbered message to the user.
- Each question should be specific to the feature request, not generic.
- Include brief context for why each question matters (1 sentence max).
- Wait for the user's responses before proceeding to Step 2.
- If the user's answers are ambiguous for any question, ask a focused follow-up on that specific point only.

#### Example Format

```
To make sure I build exactly what you need, I have 5 questions:

1. **[Category]**: [Specific question]?
   _This helps me [brief reason]._

2. **[Category]**: [Specific question]?
   _This helps me [brief reason]._

...
```

---

### Step 2: Deep Codebase Analysis

After requirements are clarified, perform a deep analysis of the relevant source code to understand how to implement the feature within the existing architecture.

#### 2a. Identify the Affected Area

1. Use `find_by_name`, `grep_search`, and `list_dir` to locate files and modules related to the feature.
2. Look for existing patterns that are similar to what needs to be built (e.g., another feature of the same type).
3. Identify the entry points — where does the user interaction or data flow begin?

#### 2b. Analyze Architecture & Patterns

1. Read the files identified in 2a using `view_file_outline` first, then `view_file` or `view_code_item` for critical sections.
2. Document the following:
   - **Existing patterns**: How are similar features structured? (folder layout, naming, abstractions)
   - **Data flow**: How does data move through the system for related features?
   - **State management**: How is state handled in the relevant modules?
   - **Extension points**: Where does the architecture naturally accommodate new features?
   - **Shared utilities**: What existing helpers, base classes, or services can be reused?

#### 2c. Identify Risks & Constraints

1. Look for tightly coupled code that could be affected by changes.
2. Check for test coverage in the affected areas.
3. Note any API contracts, type definitions, or interfaces that must be respected.
4. Identify potential breaking changes or migration needs.

#### 2d. Check for Existing Documentation

1. Check if the `deep-code-analyzer` skill has already been run (look for `.agent/docs/` in the project root).
2. If architecture documentation exists, read it to accelerate understanding.
3. If no documentation exists, consider running the `deep-code-analyzer` skill first for large or unfamiliar codebases.

#### Output

Produce a structured analysis summary (keep internally, do not show to user yet) covering:

- Affected files and modules
- Patterns to follow
- Reusable code and utilities
- Risks and constraints
- Recommended approach (high-level)

---

### Step 3: Build the Implementation Plan & Present for User Review

Using the clarified requirements (Step 1) and codebase analysis (Step 2), build a concrete implementation plan and present it for user review.

#### Plan Structure

Create the plan as an `implementation_plan.md` artifact with the following sections:

```markdown
# [Feature Name] — Implementation Plan

## Summary

Brief description of the feature and what the plan covers.

## Requirements Recap

Bullet-point summary of the clarified requirements from Step 1.

## Analysis Findings

Key findings from the codebase analysis:

- Patterns to follow (with file references)
- Reusable components identified
- Risks and constraints

## Proposed Changes

### [Component/Module 1]

#### [MODIFY/NEW/DELETE] `filename`

- What changes and why
- Key implementation details

### [Component/Module 2]

...

## Implementation Order

Numbered sequence of changes with dependencies noted.

## Estimated Impact

- Files modified: N
- Files created: N
- Files deleted: N
- Risk assessment: Low/Medium/High

## Open Questions (if any)

Any remaining uncertainties that need user input.

## Verification Plan

How the changes will be tested and validated.
```

#### Presentation Guidelines

- Present the plan via `notify_user` with `BlockedOnUser: true` and `PathsToReview` pointing to the implementation plan artifact.
- Ask the user to review and provide feedback on the approach.
- Be explicit about any trade-offs or alternative approaches considered.

---

### Step 4: Enhance the Plan & Begin Implementation

After the user reviews and provides feedback on the plan:

#### 4a. Incorporate User Feedback

1. Read the user's feedback carefully.
2. Update the `implementation_plan.md` to reflect any changes, additions, or removals requested.
3. If the feedback introduces significant new scope, return to Step 1 for targeted follow-up questions.

#### 4b. Finalize the Plan for Implementation

Enhance the plan to make it a precise, actionable blueprint:

1. **Add exact code locations** — For each change, specify the exact file, function, or class and line range.
2. **Add code sketches** — For non-trivial logic, include pseudocode or code outlines showing the approach.
3. **Define the task checklist** — Break the plan into a checklist of atomic implementation tasks in `task.md`.
4. **Note reuse opportunities** — Explicitly mark patterns or utilities that other features could adopt.

#### 4c. Execute the Implementation

Follow the finalized plan and task checklist:

1. Implement changes in the order specified in the plan.
2. After each logical group of changes, verify that the build succeeds.
3. Update `task.md` as each item is completed.
4. If unexpected issues arise during implementation, update the plan and notify the user if the impact is significant.

#### 4d. Final Verification

After all changes are implemented:

1. Run the project build to confirm no compilation errors.
2. Run any applicable tests.
3. Create a `walkthrough.md` artifact summarizing what was built, what was tested, and any remaining follow-up items.
4. Present the walkthrough to the user via `notify_user`.

## References

### `references/question_bank.md`

Contains a categorized bank of clarification questions organized by feature type (UI features, data pipeline features, API features, etc.). Reference this when selecting the top 5 questions in Step 1 to ensure comprehensive coverage.

### `references/analysis_checklist.md`

Contains a detailed checklist for the codebase analysis phase (Step 2), including what patterns to look for, common risk indicators, and a template for the analysis summary.
