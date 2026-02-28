<script lang="ts">
	let { form } = $props();
</script>

<form method="POST">
	<input type="email" name="email" value={form?.email ?? ''} />
	<input type="password" name="password" />
	<button type="submit">로그인</button>
</form>
