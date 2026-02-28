# Performance — PostgreSQL

> PostgreSQL + node-postgres patterns only. MySQL/SQLite/Edge/serverless omitted.

---

## Connection Pooling

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                       // Maximum pool size
  idleTimeoutMillis: 30000,      // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Timeout connection attempts
});

export const db = drizzle(pool);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
});
```

---

## Select Only Needed Columns

```typescript
// BAD: Fetch all columns
const users = await db.select().from(users);

// GOOD: Fetch only needed columns
const users = await db.select({
  id: users.id,
  email: users.email,
  name: users.name,
}).from(users);
```

---

## Index Definition

```typescript
import { pgTable, serial, text, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: text('name'),
  city: text('city'),
}, (table) => ({
  emailIdx: uniqueIndex('email_idx').on(table.email),
  nameIdx: index('name_idx').on(table.name),
  cityNameIdx: index('city_name_idx').on(table.city, table.name), // composite
}));
```

---

## Cursor-Based Pagination

```typescript
// BAD: OFFSET (gets slower as offset increases)
const page = await db.select()
  .from(users)
  .limit(20)
  .offset(10000); // Scans 10,020 rows!

// GOOD: Cursor-based (constant time)
const page = await db.select()
  .from(users)
  .where(gt(users.id, lastSeenId))
  .orderBy(asc(users.id))
  .limit(20);

// Timestamp-based cursor
const page = await db.select()
  .from(posts)
  .where(lt(posts.createdAt, lastSeenTimestamp))
  .orderBy(desc(posts.createdAt))
  .limit(20);
```

---

## Query Logging

```typescript
const db = drizzle(pool, {
  logger: {
    logQuery(query: string, params: unknown[]) {
      console.log('Query:', query);
      console.log('Params:', params);
    },
  },
});
```

### Slow Query Detection

```typescript
class SlowQueryLogger {
  logQuery(query: string) {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, query);
      }
    };
  }
}
```

---

## Query Plan Analysis

```typescript
import { sql } from 'drizzle-orm';

const plan = await db.execute(
  sql`EXPLAIN ANALYZE SELECT * FROM ${users} WHERE ${users.email} = 'user@example.com'`
);

// Check for:
// - "Seq Scan" (bad) vs "Index Scan" (good)
// - Actual time vs estimated time
// - Rows removed by filter
```

---

## Graceful Shutdown

```typescript
const pool = new Pool({
  max: 20,
  application_name: 'sv-chat',
  statement_timeout: 30000,
  connectionTimeoutMillis: 5000,
  idle_in_transaction_session_timeout: 10000,
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
```
