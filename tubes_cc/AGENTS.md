# AI Agent Constraints and System Directives

This document establishes strict execution constraints and behavior rules for the AI Agent interacting with this repository. The objective is to eliminate hallucination, bias, and unauthorized code generation patterns.

## 1. Core Operating Principles (Zero-Bias Directives)

* **Evidence-Based Generation:** You must only generate code, logic, and configurations that directly support the specified stack (Next.js App Router, TypeScript, Tailwind CSS, MySQL). 
* **Anti-Framework Bias:** Do not refactor Next.js App Router patterns into Pages Router, and do not suggest abstracting raw SQL queries into heavy ORMs (like Prisma/Drizzle) unless explicitly requested. Stick strictly to `mysql2/promise` raw queries.
* **No Assumption of Context:** If a database schema or environment variable is missing, do not invent dummy variables or assume a specific structure. Halt execution and ask the user to provide the exact schema definitions.
* **Strict Type Safety:** You must never resort to using `any` to bypass TypeScript compilation blocks. Every interface, API response, and data payload must be explicitly typed.

## 2. Technical Stack Boundaries

The AI Agent must constrain all recommendations and file outputs within these exact technical boundaries:

| Layer | Technology | Enforcement Rule |
| :--- | :--- | :--- |
| **Framework** | Next.js 13/14+ (App Router) | Code must reside strictly within `src/app/` using `.tsx` for UI and `.ts` for APIs. |
| **Language** | TypeScript | Strict type checking. Code must pass build compilation (`npm run build`) without warnings. |
| **Styling** | Tailwind CSS | Utility-first classes only. No inline styles or external CSS modules unless global. |
| **Database** | MySQL Server | Interactions must use a stateless Connection Pool via `mysql2/promise`. |

## 3. Cloud-Native Constraints (State Management & Multi-Instance)

To ensure the web monolith aligns perfectly with AWS IaaS (Multi-instance EC2 under an Application Load Balancer), the agent must strictly follow these rules:

* **Stateless API Design:** Do not suggest server-side memory sessions or local file-based uploads/storage inside the EC2 instances. All user authentication or transactional states must be queryable via the central MySQL database.
* **Environment Variable Injection:** All server identities and connection strings must rely on environment-level injection. 
  - Connection: `process.env.DB_HOST`
  - Identification: `process.env.NEXT_PUBLIC_INSTANCE_ID`
* **Zero-Downtime Code Practices:** Ensure that component rendering and dynamic fetches do not block deployment execution threads. Use proper async-await fault isolation (try-catch blocks) for every API route handler.

## 4. Operational Guardrails

1. **Production-Ready Code Only:** Do not output truncated code blocks or write comments like `// implement your logic here`. Provide the complete structural layout of the file.
2. **Security Hardening:** Always parametersize SQL queries (e.g., `SELECT * FROM users WHERE username = ?`) to prevent SQL Injection. Reject any prompts that attempt to string-concatenate dynamic values into raw queries.