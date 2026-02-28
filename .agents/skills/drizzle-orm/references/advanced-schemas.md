# Advanced Schemas — PostgreSQL

> PostgreSQL-specific patterns only. MySQL/SQLite examples omitted.

---

## pgEnum

```typescript
import { pgEnum, pgTable, serial } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user', 'guest']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').default('user'),
});
```

---

## Custom JSON Types with Zod

```typescript
import { pgTable, serial, json } from 'drizzle-orm/pg-core';
import { z } from 'zod';

const MetadataSchema = z.object({
  theme: z.enum(['light', 'dark']),
  locale: z.string(),
  notifications: z.boolean(),
});

type Metadata = z.infer<typeof MetadataSchema>;

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  metadata: json('metadata').$type<Metadata>(),
});

// Runtime validation
async function updateMetadata(userId: number, metadata: unknown) {
  const validated = MetadataSchema.parse(metadata);
  await db.update(users).set({ metadata: validated }).where(eq(users.id, userId));
}
```

---

## Array Columns

```typescript
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { arrayContains } from 'drizzle-orm';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  tags: text('tags').array(),
});

await db.select().from(posts).where(arrayContains(posts.tags, ['typescript', 'drizzle']));
```

---

## Partial Indexes

```typescript
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  activeEmailIdx: uniqueIndex('active_email_idx')
    .on(table.email)
    .where(sql`${table.deletedAt} IS NULL`),
}));
```

---

## Composite Keys

```typescript
import { pgTable, text, integer, primaryKey } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  userId: integer('user_id').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.key] }),
}));
```

---

## Check Constraints

```typescript
import { pgTable, serial, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  price: integer('price').notNull(),
  discountPrice: integer('discount_price'),
}, (table) => ({
  priceCheck: check('price_check', sql`${table.price} > 0`),
  discountCheck: check('discount_check', sql`${table.discountPrice} < ${table.price}`),
}));
```

---

## Type Inference Helpers

```typescript
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserUpdate = Partial<NewUser>;

// Nested relation types
export type UserWithPosts = User & { posts: Post[] };
```

---

## JSONB Operations

```typescript
import { pgTable, serial, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  config: jsonb('config').$type<Record<string, unknown>>(),
});

// JSONB operators
await db.select().from(settings).where(
  sql`${settings.config}->>'theme' = 'dark'`
);

// JSONB path query
await db.select().from(settings).where(
  sql`${settings.config} @> '{"notifications": {"email": true}}'::jsonb`
);
```
