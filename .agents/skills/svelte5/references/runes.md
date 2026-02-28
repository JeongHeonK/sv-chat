# Svelte 5 Runes — Gotchas & Advanced Patterns

> Only patterns that differ from pre-training knowledge. Basic $state/$derived/$effect/$props usage omitted.

---

## $state.raw — Opt-out Deep Reactivity

Use for large arrays/objects where you replace (not mutate):

```svelte
<script>
  let items = $state.raw([1, 2, 3]);

  // This WON'T trigger an update:
  items.push(4);

  // This WILL trigger an update:
  items = [...items, 4];
</script>
```

---

## $derived.by — Complex Derivations

When derivation needs more than a single expression:

```svelte
<script>
  let items = $state([]);
  let filter = $state('all');

  let filteredItems = $derived.by(() => {
    if (filter === 'all') return items;
    if (filter === 'active') return items.filter(i => !i.done);
    return items.filter(i => i.done);
  });
</script>
```

---

## $effect Cleanup

Always return cleanup for subscriptions/timers:

```svelte
<script>
  let count = $state(0);

  $effect(() => {
    const interval = setInterval(() => count++, 1000);
    return () => clearInterval(interval); // Cleanup
  });
</script>
```

### $effect.pre — Before DOM Update

```svelte
<script>
  let div;
  let messages = $state([]);

  $effect.pre(() => {
    if (div) {
      const shouldScroll = div.scrollTop + div.clientHeight >= div.scrollHeight - 20;
      if (shouldScroll) {
        tick().then(() => { div.scrollTop = div.scrollHeight; });
      }
    }
  });
</script>
```

---

## untrack — Exclude Dependencies

```svelte
<script>
  import { untrack } from 'svelte';

  let count = $state(0);
  let logCount = $state(0);

  $effect(() => {
    // Only runs when count changes, not logCount
    console.log(count, untrack(() => logCount));
  });
</script>
```

### Anti-Pattern: Missing untrack

```svelte
<script>
  // WRONG - log change triggers re-run!
  $effect(() => { log.push(`Count is ${count}`); });

  // RIGHT
  $effect(() => {
    untrack(() => { log.push(`Count is ${count}`); });
  });
</script>
```

---

## $bindable with TypeScript

Props must be explicitly marked with `$bindable()` to support `bind:`:

```svelte
<script lang="ts">
  interface Props {
    value: string;
    disabled?: boolean;
  }

  let { value = $bindable(''), disabled = false }: Props = $props();
</script>
```

### Multiple Bindable Props

```svelte
<script>
  let {
    value = $bindable(''),
    checked = $bindable(false),
    selected = $bindable(null)
  } = $props();
</script>
```

---

## $inspect.with — Custom Debug Logging

```svelte
<script>
  let user = $state({ name: 'Alice', age: 30 });

  $inspect.with((type, ...values) => {
    if (type === 'init') console.log('Initial value:', values);
    else console.log('Updated to:', values);
  }, user);
</script>
```

---

## Snippet Typing

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Item { id: number; name: string; }

  interface Props {
    header?: Snippet;
    children: Snippet<[item: Item]>;  // Snippet with typed parameter
    footer?: Snippet;
  }

  let { header, children, footer }: Props = $props();
</script>
```

### Slot Props → Snippet Parameters

```svelte
<!-- Component -->
<script>
  let { items, children } = $props();
</script>

<ul>
  {#each items as item}
    <li>{@render children?.(item)}</li>
  {/each}
</ul>

<!-- Usage -->
<List {items}>
  {#snippet children(item)}
    <span>{item.name}</span>
  {/snippet}
</List>
```

---

## Generic Components

```svelte
<script lang="ts" generics="T extends { id: string | number }">
  interface Props {
    items: T[];
    selected?: T;
    onselect?: (item: T) => void;
    children: import('svelte').Snippet<[item: T, isSelected: boolean]>;
  }

  let { items, selected, onselect, children }: Props = $props();
</script>

{#each items as item}
  <div
    class:selected={selected?.id === item.id}
    onclick={() => onselect?.(item)}
  >
    {@render children(item, selected?.id === item.id)}
  </div>
{/each}
```

### Multiple Type Parameters

```svelte
<script lang="ts" generics="K, V">
  interface Props {
    entries: [K, V][];
    renderKey: import('svelte').Snippet<[key: K]>;
    renderValue: import('svelte').Snippet<[value: V]>;
  }

  let { entries, renderKey, renderValue }: Props = $props();
</script>
```

---

## Rest Props with HTML Attributes

```svelte
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary';
    loading?: boolean;
  }

  let { variant = 'primary', loading = false, ...rest }: Props = $props();
</script>

<button class={variant} disabled={loading} {...rest}>
  {#if loading}Loading...{:else}{@render children?.()}{/if}
</button>
```

---

## Discriminated Union Props

```svelte
<script lang="ts">
  type Props =
    | { type: 'link'; href: string; children: Snippet }
    | { type: 'button'; onclick: () => void; children: Snippet };

  let props: Props = $props();
</script>

{#if props.type === 'link'}
  <a href={props.href}>{@render props.children()}</a>
{:else}
  <button onclick={props.onclick}>{@render props.children()}</button>
{/if}
```

---

## Avoiding Over-Reactivity

### Anti-Pattern: $effect to set derived values

```svelte
<!-- WRONG -->
<script>
  let doubled = $state(0);
  $effect(() => { doubled = count * 2; }); // Anti-pattern!
</script>

<!-- RIGHT -->
<script>
  let doubled = $derived(count * 2);
</script>
```

### Anti-Pattern: Heavy computations — debounce

```svelte
<script>
  let filter = $state('');
  let debouncedFilter = $state('');

  $effect(() => {
    const timeout = setTimeout(() => { debouncedFilter = filter; }, 300);
    return () => clearTimeout(timeout);
  });

  let filtered = $derived(
    items.filter(item => item.name.includes(debouncedFilter))
  );
</script>
```

---

## Universal Reactivity (.svelte.ts files)

### Reactive Class Pattern

```ts
// todo.svelte.ts
class TodoStore {
  items = $state<Todo[]>([]);
  filter = $state<'all' | 'active' | 'completed'>('all');

  get filtered() {
    switch (this.filter) {
      case 'active': return this.items.filter(t => !t.done);
      case 'completed': return this.items.filter(t => t.done);
      default: return this.items;
    }
  }

  add(text: string) {
    this.items.push({ id: Date.now(), text, done: false });
  }
}

export const todos = new TodoStore();
```

**Important Notes:**
1. File extension must be `.svelte.ts` (not `.ts`)
2. No `$derived` in module scope — use getters
3. SSR caution: avoid browser-only state at module level
