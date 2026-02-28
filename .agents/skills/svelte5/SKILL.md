---
name: svelte5
description: "Svelte 5 runes gotchas, SvelteKit advanced patterns, and SSR pitfalls that differ from pre-training knowledge. Use when writing Svelte 5 components, SvelteKit load/form actions, or debugging SSR/hydration issues. Triggers on: $state.raw, $derived.by, $bindable, Snippet typing, PageProps/$types, fail() vs error(), svelte:boundary, SSR state isolation."
license: MIT
metadata:
  author: sv-chat
  version: '1.0.0'
---

# Svelte 5 + SvelteKit Patterns

## Quick Reference

| Topic | When to Use | Reference |
|-------|-------------|-----------|
| **Runes** | $state.raw, $derived.by, $bindable TS, untrack, $inspect.with, Snippet typing, generics | [runes.md](references/runes.md) |
| **SvelteKit** | Server vs Universal load, PageProps/$types, fail() vs error(), use:enhance | [sveltekit.md](references/sveltekit.md) |
| **SSR/Hydration** | SSR state isolation, svelte:boundary (bug #17717), vs +error.svelte | [ssr-hydration.md](references/ssr-hydration.md) |

## Essential Patterns

### Raw State (opt-out deep reactivity)

```svelte
<script>
  let items = $state.raw([1, 2, 3]);
  // items.push(4) WON'T trigger update
  items = [...items, 4]; // WILL trigger update
</script>
```

### Complex Derivations

```svelte
<script>
  let filteredItems = $derived.by(() => {
    if (filter === 'even') return items.filter(n => n % 2 === 0);
    return items.filter(n => n % 2 !== 0);
  });
</script>
```

### Snippet Typing

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    row: Snippet<[data: { id: number; name: string }]>;
  }

  let { children, row }: Props = $props();
</script>
```

### Bindable with TypeScript

```svelte
<script lang="ts">
  interface Props { value: string; disabled?: boolean; }
  let { value = $bindable(''), disabled = false }: Props = $props();
</script>
```

### Callback Props (not createEventDispatcher)

```svelte
<script>
  let { onclick } = $props();
</script>

<button onclick={() => onclick?.({ timestamp: Date.now() })}>Click</button>
```

### Generic Components

```svelte
<script lang="ts" generics="T extends { id: string | number }">
  interface Props {
    items: T[];
    children: import('svelte').Snippet<[item: T]>;
  }
  let { items, children }: Props = $props();
</script>
```

## Common Mistakes

1. **`let` without `$state`** - Variables are not reactive without `$state()`
2. **`$effect` for derived values** - Use `$derived` instead (anti-pattern!)
3. **`on:click` syntax** - Use `onclick` in Svelte 5
4. **`createEventDispatcher`** - Use callback props instead
5. **`<slot>`** - Use snippets with `{@render}`
6. **Forgetting `$bindable()`** - Required for `bind:` to work
7. **Module-level state in SSR** - Causes cross-request leaks (see ssr-hydration.md)
8. **Sequential awaits in load** - Use `Promise.all` for parallel requests
