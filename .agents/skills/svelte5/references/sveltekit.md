# SvelteKit Advanced Patterns

> Only non-obvious patterns. Basic routing, file naming, layout nesting omitted.

---

## Server vs Universal Load — Decision Guide

| Use +page.server.ts | Use +page.js |
|---------------------|--------------|
| Accessing secrets/credentials | Public APIs only |
| Database connections | Non-serializable data (functions, classes) |
| Server-only APIs | Client-side caching benefits |
| Sensitive business logic | |

### Security: Secrets in Server Load

```ts
// WRONG — +page.js runs in browser!
export const load = async ({ fetch }) => {
  const response = await fetch('https://api.stripe.com/charges', {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } // EXPOSED!
  });
};

// CORRECT — +page.server.ts only runs on server
import { STRIPE_SECRET_KEY } from '$env/static/private';

export const load = async ({ fetch }) => {
  const response = await fetch('https://api.stripe.com/charges', {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
  });
  return { charges: await response.json() };
};
```

### Serialization: Functions in Universal Load Only

```ts
// WRONG — server load can't serialize functions
// +page.server.ts
export const load = async () => {
  return { formatDate: (date: Date) => date.toLocaleDateString() }; // ERROR
};

// CORRECT — use +page.js for non-serializable data
export const load = async () => {
  return { formatDate: (date: Date) => date.toLocaleDateString() }; // OK
};
```

---

## PageProps/$types + $props() Typing

SvelteKit generates types in `./$types` for full type safety:

### Page

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<h1>{data.title}</h1>
```

### Page with Form Actions

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>

{#if form?.success}
  <p class="success">{form.message}</p>
{/if}
```

### Layout

```svelte
<script lang="ts">
  import type { LayoutProps } from './$types';
  let { data, children }: LayoutProps = $props();
</script>

<nav>
  {#if data.user}<span>Welcome, {data.user.name}</span>{/if}
</nav>

{@render children()}
```

### Load Function Typing

```ts
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
  return { title: 'My Page', items: await fetchItems() };
};

export const actions: Actions = {
  default: async ({ request }) => {
    return { success: true, message: 'Saved' };
  }
};
```

---

## fail() vs error() — Critical Distinction

| Situation | Function | Result |
|-----------|----------|--------|
| Missing field | `fail(400, {...})` | Form state preserved |
| Invalid format | `fail(400, {...})` | Form state preserved |
| Not found | `throw error(404, ...)` | Error page |
| Server crash | `throw error(500, ...)` | Error page |
| Auth required | `throw redirect(303, ...)` | Redirect |

### WRONG: error() for validation

```ts
import { error } from '@sveltejs/kit';

export const actions = {
  default: async ({ request }) => {
    if (!email?.toString().includes('@')) {
      throw error(400, 'Invalid email'); // Shows error page!
    }
  }
};
```

### CORRECT: fail() for validation

```ts
import { fail } from '@sveltejs/kit';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString() ?? '';

    if (!email.includes('@')) {
      return fail(400, {
        error: 'Invalid email address',
        email // Return for repopulation
      });
    }

    return { success: true };
  }
};
```

### Structured Validation

```ts
export const actions = {
  register: async ({ request }) => {
    const data = await request.formData();
    const errors: Record<string, string> = {};

    if (!email) errors.email = 'Email is required';
    if (password.length < 8) errors.password = 'Must be 8+ characters';

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors, values: { email } });
    }

    return { success: true };
  }
};
```

---

## use:enhance — Progressive Enhancement

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  import { enhance } from '$app/forms';

  let { form }: PageProps = $props();
</script>

<form method="POST" action="?/register" use:enhance>
  <label>
    Email
    <input name="email" value={form?.values?.email ?? ''} />
    {#if form?.errors?.email}
      <span class="error">{form.errors.email}</span>
    {/if}
  </label>
  <button type="submit">Register</button>
</form>
```

---

## Preventing Load Waterfalls

### Anti-Pattern: Sequential (3s)

```ts
export const load = async ({ fetch }) => {
  const user = await fetch('/api/user').then(r => r.json());     // 1s
  const posts = await fetch(`/api/users/${user.id}/posts`).then(r => r.json()); // 1s
  const comments = await fetch('/api/comments').then(r => r.json()); // 1s
  return { user, posts, comments };
};
```

### Pattern: Parallel with Promise.all (1s)

```ts
export const load = async ({ fetch }) => {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  return { user, posts, comments };
};
```

### Pattern: Streaming Non-Critical Data

```ts
export const load = async ({ fetch }) => {
  const user = await fetch('/api/user').then(r => r.json());

  return {
    user,                                                    // Available immediately
    recommendations: fetch('/api/recommendations').then(r => r.json()), // Streams
    analytics: fetch('/api/analytics').then(r => r.json())              // Streams
  };
};
```

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
</script>

<h1>Welcome, {data.user.name}</h1>

{#await data.recommendations}
  <div class="skeleton">Loading...</div>
{:then recommendations}
  <div>{recommendations.length} items</div>
{:catch}
  <div class="error">Failed to load</div>
{/await}
```

---

## Error Page

```svelte
<!-- +error.svelte -->
<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{page.status}: {page.error?.message}</h1>
```

**Key rule:** `+error.svelte` must be _above_ the failing route in the hierarchy.

---

## Protected Layout Pattern

```ts
// src/routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  return { user: locals.user };
};
```

All routes under `(app)` group now require authentication.

---

## Reactive Context (Svelte 5 way)

```svelte
<!-- Provider -->
<script>
  import { setContext } from 'svelte';

  let theme = $state('light');

  setContext('theme', {
    get current() { return theme; },
    toggle() { theme = theme === 'light' ? 'dark' : 'light'; }
  });
</script>

<!-- Consumer -->
<script>
  import { getContext } from 'svelte';
  const themeContext = getContext('theme');
</script>

<p>Theme: {themeContext.current}</p>
<button onclick={themeContext.toggle}>Toggle</button>
```

**Important:** Context functions must be called synchronously during component initialization. NOT inside `$effect` or callbacks.
