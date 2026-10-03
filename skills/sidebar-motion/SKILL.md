---
name: sidebar-motion
description: 사이드바 패널이 열리고 닫힐 때의 등장 모션. 스레드 목록 테마는 bb-thread-theme가 맡는다.
---

# Sidebar Motion

사이드바 셸(`[data-sidebar="panel"]`)의 열림과 닫힘만 담당한다. 스레드 행의 색, 아이콘, 브랜치 표시는 `bb-thread-theme`다.

모션 코드는 `lib/sidebar-depth.ts`다. 콘텐츠 스크립트 `sidebar-depth`가 마운트될 때 스타일과 추적기를 붙이고, 해제될 때 둘 다 걷어 낸다.
