<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { formatRelativeTime } from '$lib/utils/time-format';
	import { X, Trash2 } from '@lucide/svelte';
	import Button from './ui/button/button.svelte';
	import UnreadBadge from './unread-badge.svelte';
	import type { RoomSummary } from '$lib/types/room';

	interface Props {
		room: RoomSummary;
	}

	let { room }: Props = $props();
	let isLoading = $state(false);

	async function handleLeave(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!confirm('이 채팅방에서 나가시겠습니까?')) return;

		isLoading = true;
		try {
			const res = await fetch(`/api/rooms/${room.id}?action=leave`, {
				method: 'DELETE'
			});
			if (res.ok) {
				await invalidate('app:rooms');
			} else {
				alert('채팅방 나가기 실패');
			}
		} catch (err) {
			console.error('Error leaving room:', err);
			alert('채팅방 나가기 실패');
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!confirm('이 채팅방을 삭제하시겠습니까? 상대방도 채팅방에 접근할 수 없습니다.')) return;

		isLoading = true;
		try {
			const res = await fetch(`/api/rooms/${room.id}?action=delete`, {
				method: 'DELETE'
			});
			if (res.ok) {
				await invalidate('app:rooms');
			} else {
				alert('채팅방 삭제 실패');
			}
		} catch (err) {
			console.error('Error deleting room:', err);
			alert('채팅방 삭제 실패');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent">
	<a href={resolve(`/chat/${room.id}`)} class="flex min-w-0 flex-1 items-center gap-3">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
			aria-hidden="true"
		>
			{room.name.charAt(0)}
		</div>
		<div class="flex-1 overflow-hidden">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">{room.name}</span>
				{#if room.lastMessageAt}
					<time class="text-xs text-muted-foreground" datetime={room.lastMessageAt.toISOString()}
						>{formatRelativeTime(room.lastMessageAt)}</time
					>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				{#if room.lastMessage}
					<p class="flex-1 truncate text-xs text-muted-foreground">{room.lastMessage}</p>
				{:else}
					<p class="flex-1"></p>
				{/if}
				<UnreadBadge count={room.unreadCount} />
			</div>
		</div>
	</a>

	<div
		class="invisible flex shrink-0 items-center gap-1 group-hover:visible"
		aria-hidden={isLoading}
	>
		<Button
			variant="ghost"
			size="icon"
			class="h-6 w-6"
			onclick={handleLeave}
			disabled={isLoading}
			aria-label="채팅방 나가기"
			title="나가기"
		>
			<X class="h-4 w-4" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="h-6 w-6"
			onclick={handleDelete}
			disabled={isLoading}
			aria-label="채팅방 삭제"
			title="삭제"
		>
			<Trash2 class="h-4 w-4" />
		</Button>
	</div>
</div>
