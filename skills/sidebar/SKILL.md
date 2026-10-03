---
name: sidebar
description: 왼쪽 사이드바와 우측 패널이 열리고 닫힐 때의 등장 모션. 스레드 목록 테마는 bb-thread-theme가 맡는다.
---

# sidebar

왼쪽 셸(`[data-sidebar="panel"]`)과 우측 패널(`[data-panel] > aside`, 좁은 화면의 secondary shelf)의 열림과 닫힘만 담당한다. 스레드 행의 색, 아이콘, 브랜치 표시는 `bb-thread-theme`다.

모션 코드는 `lib/sidebar-depth.ts`다. 콘텐츠 스크립트 `sidebar-depth`가 마운트될 때 스타일과 추적기를 붙이고, 해제될 때 둘 다 걷어 낸다.

우측 패널(`aside`)에는 `filter`, `transform`, `left`/`right` 강제를 두지 않는다. 브라우저 탭의 네이티브 뷰와 터미널 WebGL이 그 아래에서 멈추거나 열리지 않는다. `:has([style*="220ms"])`도 쓰지 않는다. 탭 안 스타일이 바뀔 때마다 패널 전체 스타일을 다시 계산한다. 추적기는 패널 껍데기만 본다.
