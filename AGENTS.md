
# Turnero Backend — Codex Instructions

## 1. Purpose

NestJS backend for a multi-tenant business management
platform supporting bookings, inventory, sales, payments,
cash management and WhatsApp integrations.

Business logic must be reusable across interfaces.
WhatsApp, REST and future integrations are transport
layers, not owners of domain logic.

## 2. Critical Rules

These rules take priority over implementation preferences.

1. Tenant isolation is mandatory. Every tenant-owned
   operation must validate business/branch ownership.
2. Never invent database tables, columns or relationships.
   Consult the documented schema.
3. Keep business logic independent from transport layers.
4. Never trust AI-generated IDs, availability or business
   decisions without backend validation.
5. Implement only the requested scope.
6. Never expose credentials or sensitive data.
7. Never introduce unnecessary architectural complexity.
8. Preserve existing behavior unless explicitly asked
   to change it.
9. Do not change database schemas without authorization.
10. Prefer readable, maintainable code over clever code.

## 3. Primary Development Philosophy

The project must remain simple, organized and understandable
by a human developer.

Follow these principles:

- KISS: Keep It Simple, Stupid.
- YAGNI: You Aren't Gonna Need It.
- DRY: Don't Repeat Yourself, without forcing abstractions.
- Separation of concerns.
- Single responsibility at the module/layer level.

IMPORTANT:

Do not confuse clean architecture with more files,
more classes, more interfaces or more abstraction.

The simplest correct implementation that respects the
existing architecture is preferred.

## 4. Mandatory Module Structure

Each domain module should follow this structure:

modules/example/
  types/
    dto/
    example.types.ts
    example.constants.ts
  testing/
    example.service.spec.ts
  example.controller.ts
  example.service.ts
  example.repository.ts
  example.module.ts

Rules:

- ONE controller per module by default.
- ONE service per module by default.
- ONE repository per module by default.
- ONE module definition per module.
- ALL module-specific tests go inside testing/.
- ALL module-specific DTOs, interfaces, types, enums and
  constants go inside types/ or its subdirectories.
- Do not create root-level helper, utility, validator
  or miscellaneous files inside domain modules.
- Do not create directories without actual content.
- Do not create placeholder files.
- Do not create unnecessary barrel/index.ts files.
- Keep naming conventions consistent.

Additional services, controllers or repositories are
EXCEPTIONS, not the default.

If an additional class/file is truly necessary because
of a distinct responsibility, explain the reason and
request approval before introducing it.

Do not split files merely because they are becoming long.
File length alone is not sufficient justification.

Existing legacy structures do not need migration unless
the user explicitly requests it.

## 5. Layer Responsibilities

Dependency flow:

Controller -> Service -> Repository -> DatabaseService

Controller:
- HTTP routes, parameters and DTO handling.
- Delegates business operations to the service.
- No SQL or domain business rules.

Service:
- Domain rules and business workflows.
- Validation and orchestration.
- Reuses repositories and other domain services.
- No raw SQL.

Repository:
- All database queries and persistence.
- SELECT, INSERT, UPDATE, DELETE and transactions.
- Uses DatabaseService.
- No HTTP-specific or transport-specific logic.

Types:
- DTOs, interfaces, type aliases, enums and constants.
- Do not create separate files for trivial one-use types
  unless reuse or clarity justifies it.
- Keep related definitions together when practical.

Module:
- NestJS dependency registration and configuration.
- No business logic.

## 6. Function Design — Avoid Overengineering

Avoid excessive helper functions and artificial
fragmentation.

Rules:

1. Do not extract a function solely to reduce line count.
2. Do not create a helper for a trivial one-time operation.
3. Keep short, straightforward logic inline when readable.
4. Extract functions when they represent a meaningful
   responsibility, enable useful reuse or substantially
   improve clarity.
5. Prefer clear control flow over chains of tiny functions.
6. Avoid wrappers that only rename another function call.
7. Avoid pass-through methods without architectural value.
8. Avoid excessive private methods that make execution
   difficult to follow.
9. Do not create generic abstractions for hypothetical
   future requirements.
10. Do not duplicate existing business logic.

A function should exist because it provides meaningful
structure, not because every code block needs a name.

Do not force everything into a single giant function.
Extract complex, repeated or independently meaningful
logic when appropriate.

## 7. File Creation Discipline

Before creating ANY new source file:

1. Check whether an existing module file can contain
   the implementation appropriately.
2. Check whether an existing abstraction can be reused.
3. Verify that the new file represents a real,
   separate responsibility.
4. Confirm its location follows the module structure.

Do not create:
- Extra services for minor responsibilities.
- Utility files containing one trivial function.
- Redundant interfaces that duplicate DTOs.
- Unnecessary adapters, factories or strategies.
- Separate validators when existing validation suffices.
- Constants files for a single local constant.
- Duplicate type definitions.

Prefer modifying an existing appropriate file over
creating a new one.

This preference never overrides security, correct
layer boundaries or meaningful separation of concerns.

## 8. Database

All persistence uses:

src/database/database.service.ts

Do not introduce another ORM, database client or
independent connection mechanism.

Schema reference:
src/docs/database-schema.sql

If the actual authoritative schema file differs,
report the discrepancy instead of guessing.

For SQL, repository, ownership and persistence tasks,
read only the relevant schema definitions.

Never assume database structures from DTO or entity names.

Schema modifications require explicit authorization.

Keep related operations transactional when necessary.
Protect consistency and concurrent operations.

## 9. Multi-Tenant Architecture

Businesses share the same backend and database.

- Validate tenant ownership in every relevant operation.
- Never trust arbitrary client-provided business IDs.
- Verify relationships between business, branch and
  tenant-owned entities.
- Prevent cross-tenant reads, updates and deletions.
- Do not bypass ownership validation for convenience.

## 10. WhatsApp Integration

WhatsApp is a communication channel, not a domain layer.

- Resolve the correct business/account before executing
  business logic.
- Support multiple business WhatsApp accounts.
- Never hardcode account IDs, phone numbers or tokens.
- Validate AI interpretations through domain services.
- Preserve valid accumulated conversation context.
- Handle webhook events safely, including duplicates and
  out-of-order events when relevant.
- Reuse domain services instead of duplicating rules
  inside WhatsApp-specific code.

## 11. Existing Code and Scope

Before implementing:

1. Inspect relevant existing files.
2. Understand the current implementation.
3. Identify reusable logic.
4. Make the smallest correct change.

Do not:
- Refactor unrelated code.
- Rename unrelated methods/files.
- Reformat entire files unnecessarily.
- Change public API contracts unintentionally.
- Add unnecessary dependencies.
- Replace working architecture without authorization.
- Reorganize legacy modules without being asked.

If existing code violates these conventions, avoid
expanding the inconsistency and report relevant debt.
Do not silently perform a large restructuring.

## 12. Resource Generator

For conventional CRUD resources, inspect:

src/common/scripts/generate-resource.js

Command:

npm run gr -- <plural> <singular>

Use it only when its output conforms to the required
module structure.

If the generator creates an incompatible structure,
do not blindly accept its output.

Do not modify the generator without authorization.

## 13. Testing

All new module-specific tests must be located in:

modules/<module>/testing/

Do not place new *.spec.ts files beside services,
controllers or repositories.

Keep tests focused on meaningful behavior.

Validation depends on risk:

Small changes:
- Targeted validation when useful.

Medium changes:
- Relevant module tests.

High-risk changes:
- Appropriate tests and build checks for tenant isolation,
  authentication, payments, transactions, booking logic,
  concurrency and external integrations.

Do not create unnecessary tests or execute unrelated test
suites merely as a ritual.

Never claim a test passed unless it was actually executed.

## 14. Command Discipline

Only run commands that provide useful information.

Avoid repetitive:
- Full repository searches.
- Builds.
- Lint commands.
- Test executions.
- Git status checks.

Prefer targeted exploration and validation.

## 15. Dependencies

Reuse existing dependencies and native platform features.

Do not add or upgrade packages without explicit approval.

Do not introduce unnecessary frameworks or libraries.

## 16. Completion Checklist

Before finishing, review the changes against:

- Correct module structure.
- No unnecessary files.
- No unnecessary helper functions.
- No duplicated business logic.
- Correct responsibility separation.
- Correct tenant isolation.
- No unauthorized schema modifications.
- No unrelated changes.
- Appropriate validation performed.

If a requirement cannot be met, explicitly report it.
Never silently disregard these instructions.

## 17. Completion Report

Provide a concise final report covering:

- What was implemented.
- Files created or modified.
- Important technical decisions.
- Tests/build actually executed.
- Relevant limitations or unresolved issues.

Do not perform extra work just to expand the report.