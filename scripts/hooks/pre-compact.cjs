#!/usr/bin/env node
// PreCompact Hook: 컨텍스트 압축 전 실제 상태 캡처
const path = require('path');
const {
  parseStdin, getGitState, extractToolFiles,
  writeFile, pruneFiles, timestamp, formatDate,
} = require('./lib/utils.cjs');

const CONTEXT_DIR = path.join(process.cwd(), '.claude', 'context');
const KEEP_COUNT = 3;

async function main() {
  process.stderr.write('[hook:pre-compact] running...\n');
  const input = await parseStdin();
  const ts = timestamp();
  const git = getGitState();
  const toolFiles = extractToolFiles(input.transcript_path);

  const lines = [];
  lines.push(`# Context Snapshot (${formatDate()})`);
  lines.push('');
  lines.push(`## Branch: ${git.branch || 'unknown'}`);
  lines.push('');

  // Modified Files (unstaged)
  if (git.diffStat) {
    lines.push('## Modified Files (unstaged)');
    for (const line of git.diffStat.split('\n')) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
    lines.push('');
  }

  // Staged changes
  if (git.stagedDiffStat) {
    lines.push('## Staged Changes');
    for (const line of git.stagedDiffStat.split('\n')) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
    lines.push('');
  }

  // Uncommitted status
  if (git.status) {
    lines.push('## Uncommitted Files');
    for (const line of git.status.split('\n')) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
    lines.push('');
  }

  // Recent Commits
  if (git.recentCommits) {
    lines.push('## Recent Commits');
    for (const line of git.recentCommits.split('\n')) {
      if (line.trim()) lines.push(`- ${line.trim()}`);
    }
    lines.push('');
  }

  // Tool Activity
  const hasToolActivity = toolFiles.edited.length || toolFiles.written.length || toolFiles.read.length;
  if (hasToolActivity) {
    lines.push('## Tool Activity (this session)');
    if (toolFiles.edited.length) {
      lines.push(`- Edit: ${toolFiles.edited.join(', ')}`);
    }
    if (toolFiles.written.length) {
      lines.push(`- Write: ${toolFiles.written.join(', ')}`);
    }
    if (toolFiles.read.length > 10) {
      lines.push(`- Read: ${toolFiles.read.length} files`);
    } else if (toolFiles.read.length) {
      lines.push(`- Read: ${toolFiles.read.join(', ')}`);
    }
    lines.push('');
  }

  const filePath = path.join(CONTEXT_DIR, `state_${ts}.md`);
  writeFile(filePath, lines.join('\n'));
  pruneFiles(CONTEXT_DIR, /^state_\d{8}_\d{6}\.md$/, KEEP_COUNT);

  // stderr로 상태 메시지 (stdout은 Claude 컨텍스트에 주입되므로)
  process.stderr.write(`Context saved to ${filePath}\n`);
}

main().catch((err) => {
  process.stderr.write(`pre-compact error: ${err.message}\n`);
  process.exit(0); // hook 실패로 메인 프로세스 방해하지 않음
});
