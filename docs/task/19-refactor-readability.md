---
title: "Task 19: 리팩토링 - 가독성 개선 (이벤트 핸들러 및 컴포넌트 분리)"
description: "인라인 이벤트 핸들러 제거 및 비대한 컴포넌트의 모듈화를 통한 코드 가독성 향상"
status: "todo"
assignee: "logic"
priority: "medium"
---

# Task 19: 리팩토링 - 가독성 개선

## 목적
코드베이스를 탐색한 결과, 템플릿 내부에 인라인으로 정의된 이벤트 핸들러와 책임이 분리되지 않은 컴포넌트들이 발견되었습니다. 이를 적절히 분리하여 템플릿의 가독성을 높이고 컴포넌트의 재사용성 및 유지보수성을 향상시킵니다.

## 세부 작업 내역

### 1. 인라인 이벤트 핸들러 추출 및 명시적 함수화
템플릿 요소(HTML/Svelte 태그) 내부에 직접 작성된 로직들을 `<script>` 블록 내의 명시적인 함수로 추출합니다.

- **대상**:
  - `src/lib/components/gnb.svelte`: 로그아웃 버튼의 `onclick` 핸들러 내부 로직(`authClient.signOut` 및 라우팅)을 `handleLogout` 등의 명시적 함수로 분리합니다.
  - `src/routes/(auth)/login/+page.svelte` 및 `src/routes/(auth)/signup/+page.svelte`: `<form>`의 `onsubmit={handleSubmit}` 과 같이 명시적으로 바인딩된 형태는 유지하되, 내부에서 익명 함수로 처리되는 부분들이 있다면 점검하고 명시적 선언으로 수정합니다.
  - `src/lib/components/message-input.svelte`: `use:enhance` 내부의 상태 변경 로직(`submitting = true`, `content = ''` 등)을 깔끔한 콜백 함수로 분리하여 템플릿의 가독성을 높입니다.

### 2. 복잡한 렌더링 로직 및 템플릿의 컴포넌트화 (Component Extraction)
하나의 파일 안에서 역할이 혼재되어 있거나 뎁스가 깊어지는 UI 조각들을 독립된 Svelte 컴포넌트로 분리합니다.

- **대상**:
  - `src/routes/(app)/chat/[roomId]/+page.svelte`: 채팅방 페이지 내부가 레이아웃 구조(헤더, 리스트, 입력창)와 상태(Socket, Store) 연결 로직으로 혼재되어 있습니다. 
    - 헤더 부분(`채팅방` 타이틀 영역)을 `ChatRoomHeader.svelte` 등으로 분리하여 페이지 컴포넌트는 오직 데이터 페칭 및 레이아웃 조정에만 집중하도록 얇게 유지합니다.
  - `src/routes/(app)/+layout.svelte`: 사이드바, GNB 등의 레이아웃 조립 과정이 명확하나, 향후 사이드바 내부에 방 목록 검색, 필터링 기능이 추가될 경우를 대비해 `Sidebar` 내부 모듈들의 책임을 명확히 격리할 준비를 합니다.

### 3. 클로저 및 파생 상태(Derived State) 로직 정리
- `$effect`나 컴포넌트 스크립트 상단에 정의된 불필요하게 긴 콜백이나 로직들을 별도의 헬퍼 함수나 컴포넌트 외부 파일로 추출하여 `<script>` 블록의 길이를 줄이고 읽기 쉽게 만듭니다.

## 기대 효과
- **가독성 (Readability)**: 템플릿 마크업이 순수하게 UI의 의도만 나타내어 읽기 편해집니다.
- **테스트 용이성 (Testability)**: 비즈니스 로직(이벤트 핸들러 콜백 등)이 순수 함수 형태로 분리되면 단위 테스트를 작성하기가 한결 수월해집니다.
- **모듈화 (Modularity)**: 헤더, 채팅 패널 등 UI의 구성 요소가 각각 책임에 맞게 나뉘어 다른 곳에서도 재활용할 수 있게 됩니다.
