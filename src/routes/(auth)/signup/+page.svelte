<script lang="ts">
	import type { PageProps } from './$types';
	let { form }: PageProps = $props();
</script>

<form method="POST">
	<input type="text" name="name" value={form?.name ?? ''} />
	<input type="email" name="email" value={form?.email ?? ''} />
	<input type="password" name="password" />
	<button type="submit">회원가입</button>
</form>
