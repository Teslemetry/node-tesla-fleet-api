---
"tesla-fleet-api": minor
---

Compile with TypeScript `strict` mode targeting ES2022, and require Node.js 22 or newer (`engines.node: ">=22"`). An omitted `accessToken` is now stored as `null` rather than `undefined`, matching its declared type.
