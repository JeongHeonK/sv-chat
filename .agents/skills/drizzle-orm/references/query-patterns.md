# Query Patterns — PostgreSQL

> Advanced patterns only. Basic CRUD, filtering, joins, aggregation omitted.

---

## Subqueries

### Correlated Subquery

```typescript
import { sql, eq } from 'drizzle-orm';

const authorsWithPostCount = await db
  .select({
    author: authors,
    postCount: sql<number>`(
      SELECT COUNT(*)
      FROM ${posts}
      WHERE ${posts.authorId} = ${authors.id}
    )`,
  })
  .from(authors);
```

### EXISTS / NOT EXISTS

```typescript
const authorsWithPosts = await db
  .select()
  .from(authors)
  .where(
    sql`EXISTS (
      SELECT 1 FROM ${posts}
      WHERE ${posts.authorId} = ${authors.id}
    )`
  );
```

---

## Common Table Expressions (CTEs)

```typescript
const topAuthors = db.$with('top_authors').as(
  db.select({
    id: authors.id,
    name: authors.name,
    postCount: sql<number>`COUNT(${posts.id})`.as('post_count'),
  })
    .from(authors)
    .leftJoin(posts, eq(authors.id, posts.authorId))
    .groupBy(authors.id)
    .having(sql`COUNT(${posts.id}) > 10`)
);

const result = await db
  .with(topAuthors)
  .select()
  .from(topAuthors);
```

---

## SQL Template Composition

```typescript
// Reusable SQL fragments
function whereActive() {
  return sql`${users.isActive} = true`;
}

function whereRole(role: string) {
  return sql`${users.role} = ${role}`;
}

const admins = await db
  .select()
  .from(users)
  .where(sql`${whereActive()} AND ${whereRole('admin')}`);
```

---

## Dynamic WHERE Clauses

```typescript
import { and, SQL, like, eq } from 'drizzle-orm';

interface Filters {
  name?: string;
  role?: string;
  isActive?: boolean;
}

function buildFilters(filters: Filters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.name) conditions.push(like(users.name, `%${filters.name}%`));
  if (filters.role) conditions.push(eq(users.role, filters.role));
  if (filters.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const result = await db
  .select()
  .from(users)
  .where(buildFilters({ name: 'John', isActive: true }));
```

---

## Batch Upsert

```typescript
await db.insert(users)
  .values(bulkUsers)
  .onConflictDoUpdate({
    target: users.email,
    set: { name: sql`EXCLUDED.name` },
  });

// onConflictDoNothing
await db.insert(users).values(bulkUsers).onConflictDoNothing();
```

---

## Prepared Statements

```typescript
const getUserById = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder('id')))
  .prepare('get_user_by_id');

const user1 = await getUserById.execute({ id: 1 });
const user2 = await getUserById.execute({ id: 2 });
```

---

## N+1 Prevention

```typescript
// BAD: N+1 query
const authors = await db.select().from(authors);
for (const author of authors) {
  author.posts = await db.select().from(posts).where(eq(posts.authorId, author.id));
}

// GOOD: Single query with relations API
const authorsWithPosts = await db.query.authors.findMany({
  with: { posts: true },
});

// GOOD: Dataloader pattern
import DataLoader from 'dataloader';

const postLoader = new DataLoader(async (authorIds: readonly number[]) => {
  const allPosts = await db.select().from(posts).where(inArray(posts.authorId, [...authorIds]));
  return authorIds.map(id => allPosts.filter(post => post.authorId === id));
});
```

---

## Batch Update with Transaction

```typescript
await db.transaction(async (tx) => {
  for (const update of updates) {
    await tx.update(users)
      .set({ name: update.name })
      .where(eq(users.id, update.id));
  }
});
```

---

## Distinct On (PostgreSQL)

```typescript
const latestPostPerAuthor = await db
  .selectDistinctOn([posts.authorId], { post: posts })
  .from(posts)
  .orderBy(posts.authorId, desc(posts.createdAt));
```
