#!/usr/bin/env node
// SessionStart Hook: 세션 시작 시 이전 컨텍스트를 stdout으로 출력 → Claude에 주입
const path = require('path');
const {
  parseStdin, getGitState, getRecentFile,
} = require('./lib/utils.cjs');

const CONTEXT_DIR = path.join(process.cwd(), '.claude', 'context');
const LEARNING_DIR = path.join(process.cwd(), '.claude', 'learnings');

async function main() {
  process.stderr.write('[hook:session-start] running...\n');

  const input = await parseStdin();
  const source = input.source || 'startup';
  const git = getGitState();

  const out = [];
  out.push('=== Session Context ===');
  out.push('');

  // Git 상태 요약
  const statusLabel = git.status ? 'uncommitted changes' : 'clean';
  out.push(`Branch: ${git.branch || 'unknown'} (${statusLabel})`);

  if (git.status) {
    out.push('');
    out.push('Uncommitted:');
    for (const line of git.status.split('\n')) {
      if (line.trim()) out.push(`  ${line.trim()}`);
    }
  }
  out.push('');

  // compact 이후 재시작: 직전 스냅샷만 출력
  if (source === 'compact') {
    const snapshot = getRecentFile(CONTEXT_DIR, /^state_\d{8}_\d{6}\.md$/);
    if (snapshot) {
      out.push(`Latest snapshot: ${path.relative(process.cwd(), snapshot.path)}`);
      out.push('---');
      out.push(snapshot.content.trim());
      out.push('---');
    }
  } else {
    // startup 또는 resume: 컨텍스트 + 학습 내용
    const snapshot = getRecentFile(CONTEXT_DIR, /^state_\d{8}_\d{6}\.md$/);
    if (snapshot) {
      out.push(`Latest snapshot: ${path.relative(process.cwd(), snapshot.path)}`);
      out.push('---');
      out.push(snapshot.content.trim());
      out.push('---');
      out.push('');
    }

    const learning = getRecentFile(LEARNING_DIR, /^session_\d{8}_\d{6}\.md$/);
    if (learning) {
      out.push(`Latest learning: ${path.relative(process.cwd(), learning.path)}`);
      out.push('---');
      out.push(learning.content.trim());
      out.push('---');
    }
  }

  out.push('');
  out.push('=== End Context ===');

  // stdout 출력 → Claude 컨텍스트에 자동 주입
  process.stdout.write(out.join('\n') + '\n');
}

main().catch((err) => {
  process.stderr.write(`session-start error: ${err.message}\n`);
  // 에러 시에도 최소 출력
  process.stdout.write('=== Session Context ===\n(context load failed)\n=== End Context ===\n');
});
