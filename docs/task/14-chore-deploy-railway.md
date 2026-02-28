# Task: 14-chore-deploy-railway

## Issue Title
Railway 어플리케이션(Node Custom Server) 배포 검증

## Phase
Phase 6 — E2E + 배포

## Worktree
Opus 단독

## Depends On
- 08-feat-socket-server
- 11-logic-socket-receive

## Target
Railway CLI 배포 또는 GitHub 연동 환경에서의 Docker 빌드 정상화 여부 점검.

## DoD (Definition of Done)
- [ ] `@sveltejs/adapter-node` 빌드 성공
- [ ] Railway 환경변수 설정 (DATABASE_URL, ORIGIN, BETTER_AUTH_SECRET)
- [ ] Docker 빌드 또는 Nixpacks 빌드 정상 완료
- [ ] 퍼블릭 URL 접속 시 화면 진입 확인
- [ ] WSS 소켓 통신 연결 에러 없음
