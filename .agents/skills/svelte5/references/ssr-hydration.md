# SSR, Hydration & Error Boundaries

> High gotcha-density — most content retained.

---

## SSR State Isolation

Shared server state persists across requests, potentially leaking data between users.

### Dangerous: Module-Level State

```ts
// WRONG — +page.server.ts
let currentUser = null; // SHARED ACROSS ALL REQUESTS!

export const load = async ({ locals }) => {
  currentUser = locals.user; // User B overwrites User A
  return { user: currentUser };
};

// CORRECT
export const load = async ({ locals }) => {
  return { user: locals.user }; // Each request gets its own locals
};
```

### Dangerous: Global Stores

```ts
// WRONG — stores.svelte.ts
export const user = $state<User | null>(null); // Server-side singleton!

// CORRECT — Use locals and return data from load
// +layout.server.ts
export const load = async ({ locals }) => {
  return { user: locals.user };
};
```

### Safe Patterns

**Pattern 1: Use locals**

```ts
// hooks.server.ts
export const handle = async ({ event, resolve }) => {
  event.locals.user = await authenticate(event);
  event.locals.requestId = crypto.randomUUID();
  return resolve(event);
};
```

**Pattern 2: Context for Component Trees**

```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import type { LayoutProps } from './$types';

  let { data, children }: LayoutProps = $props();

  setContext('user', {
    get current() { return data.user; }
  });
</script>

{@render children()}
```

**Pattern 3: Client-Only State**

```ts
// stores.svelte.ts
import { browser } from '$app/environment';

function createClientStore() {
  if (!browser) return { value: null };
  const state = $state({ value: null });
  return state;
}

export const clientState = createClientStore();
```

### SSR Safety Checklist

- [ ] No module-level `let` variables that store user data
- [ ] No global `$state` that gets set during SSR
- [ ] No singleton service classes with mutable state
- [ ] All user-specific data flows through `locals`
- [ ] All page data comes from load function returns

---

## Browser-Only Code

```svelte
<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let data = $state(null);

  // Option 1: browser check
  if (browser) {
    data = localStorage.getItem('data');
  }

  // Option 2: onMount (only runs in browser)
  onMount(() => {
    data = localStorage.getItem('data');
  });

  // Option 3: $effect with browser check
  $effect(() => {
    if (browser) {
      data = localStorage.getItem('data');
    }
  });
</script>
```

### Common Mistake: window Without Check

```ts
// WRONG — fails on server
export const load = async () => {
  const width = window.innerWidth; // ERROR on server
};

// RIGHT
import { browser } from '$app/environment';

export const load = async () => {
  const width = browser ? window.innerWidth : 1024;
  return { width };
};
```

---

## svelte:boundary Component

> Available in Svelte 5.3+

### Two Purposes

1. **Error boundaries** — catch rendering errors
2. **Pending UI** — show loading state while `await` resolves

### Basic Error Boundary

```svelte
<svelte:boundary onerror={(e, reset) => console.error(e)}>
  <RiskyComponent />

  {#snippet failed(error, reset)}
    <p>Error: {error.message}</p>
    <button onclick={reset}>Try again</button>
  {/snippet}
</svelte:boundary>
```

### Pending UI

> **BUG:** `<svelte:boundary>` + `{@const await}` causes infinite navigation loops during client-side page transitions when pages share async queries.
> See [sveltejs/svelte#17717](https://github.com/sveltejs/svelte/issues/17717).
> **Use `{#await}` blocks until this is fixed.**

```svelte
<!-- UNSAFE — causes navigation loops -->
<svelte:boundary>
  {#snippet pending()}
    <LoadingSpinner />
  {/snippet}

  {@const data = await loadData()}
  <DataView {data} />
</svelte:boundary>

<!-- SAFE alternative -->
{#await loadData()}
  <LoadingSpinner />
{:then data}
  <DataView {data} />
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

### Combined Error + Pending (recommended pattern)

Use `svelte:boundary` for **error catching only**, with `{#await}` for async:

```svelte
<svelte:boundary onerror={logError}>
  {#snippet failed(error, reset)}
    <p>Failed to load user</p>
    <button onclick={reset}>Retry</button>
  {/snippet}

  {#await fetchUser()}
    <p>Loading user...</p>
  {:then user}
    <UserProfile {user} />
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</svelte:boundary>
```

### What Gets Caught

**Caught:** Errors during rendering, errors in `$effect`

**NOT Caught:** Event handler errors (`onclick`), errors after `setTimeout`, async errors outside boundary

### svelte:boundary vs +error.svelte

| Feature  | svelte:boundary         | +error.svelte |
|----------|-------------------------|---------------|
| Scope    | Component subtree       | Route segment |
| Reset    | Built-in reset function | Navigate away |
| Pending  | Yes (pending snippet)   | No            |
| Use case | Component-level         | Page-level    |

### Error Tracking Integration

```svelte
<svelte:boundary
  onerror={(error, reset) => {
    errorTracker.captureException(error);
  }}
>
  <App />

  {#snippet failed(error, reset)}
    <ErrorFallback {error} {reset} />
  {/snippet}
</svelte:boundary>
```

### Key Points

- `pending` snippet shows only on **initial** load (no flicker on refresh)
- `failed` snippet replaces content on error
- `reset` function lets users retry
- Requires `experimental.async: true` in svelte.config.js for `{@const await}`
- **BUG:** `{@const await}` + navigation = infinite loops ([#17717](https://github.com/sveltejs/svelte/issues/17717))
