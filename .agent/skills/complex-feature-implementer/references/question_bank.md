# Question Bank for Requirement Clarification

Use this bank to select the 5 most relevant questions for the specific feature request. Adapt the wording to be specific to the feature — never ask generic questions.

## By Feature Type

### UI / Frontend Features

| Category      | Question Template                                                                         |
| ------------- | ----------------------------------------------------------------------------------------- |
| Scope         | What screens or views should this feature appear on?                                      |
| UX            | What is the ideal user interaction flow from trigger to completion?                       |
| Visual        | Are there existing design mocks, or should the feature follow existing UI patterns?       |
| State         | Should the UI state persist across sessions (e.g., user preferences, filters)?            |
| Responsive    | Does this need to work across desktop, tablet, and mobile viewports?                      |
| Accessibility | Are there specific accessibility requirements (keyboard nav, screen reader)?              |
| Animation     | Should there be transitions or animations, and if so, what feel (snappy, smooth, subtle)? |
| Error States  | How should the UI indicate loading, errors, or empty states?                              |

### Data / Backend Features

| Category   | Question Template                                                                   |
| ---------- | ----------------------------------------------------------------------------------- |
| Source     | Where does the data come from (existing DB, new API, user input, external service)? |
| Schema     | What is the shape of the data? Are there existing models or types to extend?        |
| Volume     | What data volume should this handle (100s, 1000s, millions of records)?             |
| Sync       | Does this data need real-time sync, or is eventual consistency acceptable?          |
| Migration  | Is there existing data that needs to be migrated or transformed?                    |
| Validation | What validation rules apply to the data?                                            |
| Privacy    | Does this data have privacy or security classification?                             |

### API / Integration Features

| Category       | Question Template                                                  |
| -------------- | ------------------------------------------------------------------ |
| Contract       | What should the API interface look like (REST, GraphQL, RPC)?      |
| Auth           | What authentication/authorization is required?                     |
| Rate Limits    | Are there rate limiting or throttling requirements?                |
| Versioning     | Does this need to support API versioning?                          |
| Error Handling | What error codes and messages should be returned?                  |
| Compatibility  | Must this maintain backward compatibility with existing consumers? |

### Cross-Cutting / Infrastructure Features

| Category   | Question Template                                                                 |
| ---------- | --------------------------------------------------------------------------------- |
| Scope      | Which modules or packages does this change affect?                                |
| Migration  | Is a migration needed for existing data or configurations?                        |
| Rollback   | How should rollback work if something goes wrong?                                 |
| Monitoring | Should this include logging, metrics, or alerting?                                |
| Config     | Should this be configurable, and if so, how (env vars, config file, UI settings)? |
| Phasing    | Can this be delivered incrementally, and if so, what is the MVP?                  |

## Universal Questions (apply to any feature type)

| Category          | Question Template                                                     |
| ----------------- | --------------------------------------------------------------------- |
| Priority          | What is the priority of this feature relative to other work?          |
| Timeline          | Is there a deadline or milestone this needs to hit?                   |
| Testing           | Are there specific test scenarios that must pass?                     |
| Dependencies      | Does this depend on or block any other features?                      |
| Existing Patterns | Is there an existing feature in the codebase that this should mirror? |
