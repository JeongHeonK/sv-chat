#!/usr/bin/env node
// Stop Hook: 세션 종료 시 실제 작업 내용 기록
const path = require('path');
const {
  parseStdin, getGitState, extractToolFiles,
  writeFile, pruneFiles, timestamp, formatDate,
} = require('./lib/utils.cjs');

const LEARNING_DIR = path.join(process.cwd(), '.claude', 'learnings');
const KEEP_COUNT = 5;

async function main() {
  process.stderr.write('[hook:session-complete] running...\n');
  const input = await parseStdin();
  const ts = timestamp();
  const git = getGitState();
  const toolFiles = extractToolFiles(input.transcript_path);

  const lines = [];
  lines.push(`# Session Summary (${formatDate()})`);
  lines.push('');

  lines.push(`## Branch: ${git.branch || 'unknown'}`);
  lines.push('');

  // Recent Commits (세션 중 만들어진 커밋 포함)
  if (git.recentCommits) {
    lines.push('## Recent Commits');
    for (const line of git.recentCommits.split('\n').slice(0, 10)) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
    lines.push('');
  }

  // Tool로 수정/생성된 파일
  const touchedFiles = new Set([...toolFiles.edited, ...toolFiles.written]);
  if (touchedFiles.size) {
    lines.push('## Files Touched');
    for (const f of touchedFiles) {
      lines.push(`- ${f}`);
    }
    lines.push('');
  }

  // Uncommitted Changes
  lines.push('## Uncommitted Changes');
  if (git.status) {
    for (const line of git.status.split('\n')) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
  } else {
    lines.push('(none)');
  }
  lines.push('');

  const filePath = path.join(LEARNING_DIR, `session_${ts}.md`);
  writeFile(filePath, lines.join('\n'));
  pruneFiles(LEARNING_DIR, /^session_\d{8}_\d{6}\.md$/, KEEP_COUNT);

  process.stderr.write(`Session summary saved to ${filePath}\n`);
}

main().catch((err) => {
  process.stderr.write(`session-complete error: ${err.message}\n`);
  process.exit(0);
});
