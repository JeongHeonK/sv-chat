const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * stdin에서 JSON 파싱. hook 이벤트 데이터 수신용.
 * @returns {Promise<Object>}
 */
function parseStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    // stdin이 없는 경우 타임아웃
    setTimeout(() => resolve({}), 100);
  });
}

/**
 * 현재 git 상태 조회
 */
function getGitState() {
  const run = (cmd) => {
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      return '';
    }
  };

  return {
    branch: run('git rev-parse --abbrev-ref HEAD'),
    status: run('git status --short'),
    diffStat: run('git diff --stat'),
    stagedDiffStat: run('git diff --cached --stat'),
    recentCommits: run('git log --oneline -10'),
  };
}

/**
 * transcript JSONL에서 Read/Edit/Write 된 파일 목록 추출
 * @param {string} transcriptPath
 * @returns {{ edited: string[], written: string[], read: string[] }}
 */
function extractToolFiles(transcriptPath) {
  const result = { edited: new Set(), written: new Set(), read: new Set() };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return mapSets(result);
  }

  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }

      // tool_use 블록에서 파일 경로 추출
      const blocks = extractContentBlocks(entry);
      for (const block of blocks) {
        if (block.type !== 'tool_use') continue;
        const input = block.input || {};
        const name = block.name || '';

        if (name === 'Edit' && input.file_path && isProjectFile(input.file_path)) {
          result.edited.add(relativePath(input.file_path));
        } else if (name === 'Write' && input.file_path && isProjectFile(input.file_path)) {
          result.written.add(relativePath(input.file_path));
        } else if (name === 'Read' && input.file_path && isProjectFile(input.file_path)) {
          result.read.add(relativePath(input.file_path));
        }
      }
    }
  } catch {
    // transcript 파싱 실패 시 빈 결과 반환
  }

  return mapSets(result);
}

/**
 * JSONL entry에서 content 블록 추출 (중첩 구조 처리)
 */
function extractContentBlocks(entry) {
  const blocks = [];
  const content = entry.message?.content || entry.content;
  if (Array.isArray(content)) {
    blocks.push(...content);
  }
  return blocks;
}

/**
 * 프로젝트 루트 내부 파일인지 확인
 */
function isProjectFile(filePath) {
  const cwd = process.cwd();
  return filePath.startsWith(cwd + '/') || !path.isAbsolute(filePath);
}

/**
 * 절대 경로를 프로젝트 루트 상대 경로로 변환
 */
function relativePath(absPath) {
  const cwd = process.cwd();
  if (absPath.startsWith(cwd)) {
    return absPath.slice(cwd.length + 1);
  }
  return absPath;
}

function mapSets(obj) {
  return {
    edited: [...obj.edited],
    written: [...obj.written],
    read: [...obj.read],
  };
}

/**
 * 디렉토리가 없으면 생성
 */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 파일 쓰기
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 파일 읽기 (없으면 null)
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * 디렉토리에서 패턴에 맞는 최신 파일 찾기
 * @param {string} dir
 * @param {RegExp} pattern
 * @returns {{ path: string, content: string } | null}
 */
function getRecentFile(dir, pattern) {
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir)
    .filter((f) => pattern.test(f))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) return null;

  return {
    path: files[0].path,
    content: fs.readFileSync(files[0].path, 'utf8'),
  };
}

/**
 * 디렉토리에서 패턴에 맞는 파일을 최신순 정렬, keepCount개만 유지하고 나머지 삭제
 */
function pruneFiles(dir, pattern, keepCount) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir)
    .filter((f) => pattern.test(f))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  for (let i = keepCount; i < files.length; i++) {
    try { fs.unlinkSync(files[i].path); } catch { /* ignore */ }
  }
}

/**
 * 현재 타임스탬프 문자열 (YYYYMMDD_HHMMSS)
 */
function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * 포맷된 날짜 문자열
 */
function formatDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Hook 동작 환경 자가 진단
 * @returns {{ check: string, ok: boolean, reason?: string }[]}
 */
function selfTest() {
  const results = [];
  // 1. git 사용 가능
  try {
    execSync('git rev-parse --git-dir', { encoding: 'utf8', timeout: 3000, stdio: 'pipe' });
    results.push({ check: 'git', ok: true });
  } catch {
    results.push({ check: 'git', ok: false, reason: 'git 저장소가 아님' });
  }
  // 2. .claude/context/ 존재
  const contextDir = path.join(process.cwd(), '.claude', 'context');
  results.push({ check: 'context-dir', ok: fs.existsSync(contextDir), reason: !fs.existsSync(contextDir) ? '.claude/context/ 없음' : undefined });
  // 3. .claude/learnings/ 존재
  const learningDir = path.join(process.cwd(), '.claude', 'learnings');
  results.push({ check: 'learnings-dir', ok: fs.existsSync(learningDir), reason: !fs.existsSync(learningDir) ? '.claude/learnings/ 없음' : undefined });
  return results;
}

module.exports = {
  parseStdin,
  getGitState,
  extractToolFiles,
  ensureDir,
  writeFile,
  readFile,
  getRecentFile,
  pruneFiles,
  timestamp,
  formatDate,
  relativePath,
  selfTest,
};
