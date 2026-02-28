---
name: drizzle-orm
description: "Drizzle ORM PostgreSQL patterns — type inference, relations, transactions, migrations, and gotchas. Use when writing schema, queries, or debugging Drizzle issues. Triggers on: pgTable, drizzle-orm imports, $inferSelect/$inferInsert, relations(), db.transaction, drizzle-kit."
progressive_disclosure:
  entry_point:
    summary: "Type-safe SQL ORM for TypeScript — PostgreSQL focused"
    when_to_use: "When working with drizzle-orm schema, queries, or migrations."
    quick_start: "1. Review core patterns below. 2. Check references for advanced needs."
  references:
    - advanced-schemas.md
    - performance.md
    - query-patterns.md
---

# Drizzle ORM — PostgreSQL

## Quick Reference

| Topic | Reference |
|-------|-----------|
| Subqueries, CTEs, dynamic WHERE, batch upsert, N+1 | [query-patterns.md](references/query-patterns.md) |
| pgEnum, JSON+Zod, array, partial index, composite key | [advanced-schemas.md](references/advanced-schemas.md) |
| Connection pooling, cursor pagination, query logging | [performance.md](references/performance.md) |

## Type Inference

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Infer TypeScript types from schema
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type UserUpdate = Partial<NewUser>;
```

## Relations

```typescript
import { relations } from 'drizzle-orm';

export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(authors, {
    fields: [posts.authorId],
    references: [authors.id],
  }),
}));

// Query with relations (avoids N+1)
const authorsWithPosts = await db.query.authors.findMany({
  with: { posts: true },
});
```

## Transactions

```typescript
await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ ... }).returning();

  if (!user) {
    tx.rollback();
    return;
  }

  await tx.insert(posts).values({ authorId: user[0].id });
});
```

## Migration Workflow

```bash
npx drizzle-kit generate   # Generate migration SQL
npx drizzle-kit migrate    # Apply migration
npx drizzle-kit studio     # Database GUI
npx drizzle-kit introspect # Reverse-engineer existing DB
```

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

## Red Flags

**Stop and reconsider if:**
- Using `any`/`unknown` for JSON columns without `$type<T>()` annotation
- Building raw SQL strings without `sql` template (SQL injection risk)
- Not using transactions for multi-step data modifications
- Fetching all rows without pagination in production queries
- Missing indexes on foreign keys or frequently queried columns
- Using `select()` without specifying columns for large tables
