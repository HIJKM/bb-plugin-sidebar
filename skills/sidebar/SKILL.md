---
name: sidebar
description: 왼쪽 사이드바와 우측 패널이 열리고 닫힐 때의 등장 모션. 스레드 목록 테마는 bb-thread-theme가 맡는다.
---

# sidebar

왼쪽 셸(`[data-sidebar="panel"]`)과 우측 패널(`[data-panel] > aside`, 좁은 화면의 secondary shelf)의 열림과 닫힘만 담당한다. 스레드 행의 색, 아이콘, 브랜치 표시는 `bb-thread-theme`다.

모션 코드는 `lib/sidebar-depth.ts`다. 콘텐츠 스크립트 `sidebar-depth`가 마운트될 때 스타일과 추적기를 붙이고, 해제될 때 둘 다 걷어 낸다.

우측 패널의 `aside`에는 `filter`, `transform`, `left`/`right`를 두지 않는다. 브라우저 탭의 네이티브 뷰와 터미널 WebGL이 그 아래에서 멈추거나 열리지 않는다. `:has([style*="220ms"])`도 쓰지 않는다. 탭 안 스타일이 바뀔 때마다 패널 전체 스타일을 다시 계산한다. 추적기는 패널 껍데기만 본다.

데스크톱(768px 이상)에서만 왼쪽 패널과 우측 패널은 떠 있는 카드다. 여백은 10px, 모서리는 20px 스쿼클, 그림자는 `0 12px 32px rgb(0 0 0 / 0.16)`이다. 모바일 드로어와 좁은 화면 shelf는 이 카드를 쓰지 않는다.

왼쪽 카드 셀렉터는 `[data-side="left"] > [data-sidebar="panel"]`이다. 이 특이도는 `body.sidebar-resizing [data-sidebar="panel"]`보다 낮아서 너비 드래그는 즉시 반응한다. 토글은 패널을 왼쪽 밖으로 밀지 않는다. `left`는 10px에 고정된다. `transform-origin`은 `left center`다. 열릴 때는 `scale(0.8)`에서 `scale(1)`로 커지고 투명도가 1이 된다. 접힘 셀렉터는 `[data-collapsible="offcanvas"][data-side="left"] > [data-sidebar="panel"]`이다. 닫힐 때는 반대로 `scale(0.8)`, `opacity: 0`이 되고, 720ms 뒤에 숨는다. 같은 `transform`과 `opacity` transition이 양쪽을 잇는다. `pointer-events`는 접히면 바로 꺼진다. gap은 0으로 줄어 채팅이 넓어진다. `left`를 고정하면 데스크톱 깊이는 1에 머문다. 숨김은 접힘 CSS가 한다.

우측 카드의 모서리와 그림자는 `aside`에 둔다. `aside`의 너비는 패널의 `calc(100% - 20px)`이다. 열리고 닫히는 `transform`은 `aside`가 아니라 `[data-panel]`에 둔다. `transform-origin`은 `right center`다. 열린 `[data-panel]`의 `transform`은 `none`이고 투명도는 1이다. 이렇게 두어야 브라우저와 터미널이 열린 상태에서 다시 로드되지 않는다. 닫힌 셀렉터는 `[data-panel]:has(> aside[aria-hidden="true"])`이다. 그때 패널은 `position: fixed`로 오른쪽에 남고, `scale(0.8)`과 `opacity: 0`으로 줄어든 뒤 720ms 뒤에 숨는다. 열릴 때는 그 반대다. 너비는 열려 있을 때 저장한 `--bb-motion-right-card-width`다. 닫힌 동안에는 그 값을 다시 쓰지 않는다. 열린 패널의 `transition`에는 `flex-grow`와 `flex-basis`를 남겨 호스트의 폭 애니메이션을 유지한다.

`prefers-reduced-motion`에서는 접힌 왼쪽 카드와 닫힌 우측 카드를 즉시 숨기고, `transform`은 `none`이다.

왼쪽 사이드바가 열릴 때 채팅을 어둡게 하지 않는다. 컴포저에 커서가 있으면 그 포커스를 빼서 키보드를 내린다. 왼쪽 사이드바를 열고 닫을 때와 우측 패널의 열림, 닫힘, 탭은 `impact-light`다.

우측 패널의 탭, 새 탭 버튼, 닫기 버튼, 좌우 버튼을 누를 때와 탭 줄을 좌우로 밀어 바꿀 때 짧은 진동을 보낸다. 패널 껍데기 스타일은 바꾸지 않는다.

좁은 화면에서만, 우측 패널은 오른쪽에서 들어오고 채팅보다 위에 쌓인다. 패널 껍데기는 열리는 동안 `translateX`로 오른쪽 밖에서 들어온다. 다 열리면 그 `transform`을 끈다. 켜 둔 채 두면 브라우저와 터미널이 다시 로드된다. 채팅 이동 시간은 앱의 220ms 그대로 둔다. 채팅은 화면의 절반만 왼쪽으로 밀리고, 그 진행에 맞춰 어두워진다. 어두움은 채팅(`inset`)에만 둔다. 패널이 채팅 위에 있으므로 채팅 오른쪽 모서리는 둥글게 하지 않는다. 패널 왼쪽 모서리는 48px 스쿼클이다. 채팅 배경을 그 왼쪽으로 넓혀 세로선이 없게 한다.
