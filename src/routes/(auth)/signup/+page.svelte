<script lang="ts">
	let { form } = $props();
</script>

<form method="POST">
	<input type="text" name="name" value={form?.name ?? ''} />
	<input type="email" name="email" value={form?.email ?? ''} />
	<input type="password" name="password" />
	<button type="submit">회원가입</button>
</form>
