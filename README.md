# sidebar

<p align="center">
  <strong>depth motion when the left sidebar and right panel open and close.</strong>
</p>

<p align="center">
  <a href="#install">install</a> · <a href="#what-it-does">what it does</a> · <a href="#related">related</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-666666?labelColor=333333" alt="MIT license" /></a>
</p>

---

A BB plugin that animates only the shell chrome: the left sidebar and the right panel.
Thread row colors, icons, and branch labels are not this plugin — use `bb-thread-theme` for that.
Ribbon / navigation chrome is separate (`bb-ribbon`).

다른 플러그인의 색 변수나 설정에 의존하지 않는다. `chat-canvas`는 사용자가 직접 선택하는 별도 테마이며, 다른 BB 테마의 팔레트를 덮어쓰지 않는다.

기기 판정은 `bb-device-chrome`에서 그대로 복사한 `lib/device.ts`, `lib/use-device.ts`의 `useDeviceChrome()`을 쓴다. 별도 플러그인 설치는 필요 없다. 같은 좁은 viewport여도 desktop은 폰의 shelf 효과나 손가락 해제 햅틱을 쓰지 않는다. desktop은 medium·wide에서 기존 카드, narrow에서 기존 기본 레이아웃을 쓰며 폰트·버튼 크기를 바꾸지 않는다. phone은 기존 narrow shelf와 넓은 landscape의 효과 범위를 유지한다. tablet 전용 크롬은 추가하지 않는다.

- **left sidebar** — on desktop, a floating card. It slides in from the left and fades in. Closing slides it back left and fades it out. While it is open its transform is `none`, and the resize handle sits on the layout column's right edge. The full-height seam stays hidden. Hovering that edge shows a short 4×32px grip. 카드와 뒤 여백은 현재 BB 테마의 `--sidebar`를 따른다. 카드의 62% 프로스트와 24px blur는 유지한다. 내부 제목이나 활성 탭의 배경은 덮어쓰지 않는다. 다크 그림자는 `0 12px 32px rgb(0 0 0 / 0.55)`다. The card's `z-index` is 21, above the thread footer. The mobile drawer still eases in from halfway.
- **right panel** — on desktop, the same horizontal slide and fade toward the right, including while it closes. 뒤 여백과 프로스트는 왼쪽 카드와 같은 호스트 `--sidebar`를 쓴다. The panel's overflow stays visible so the card shadow is not clipped, and the card's `z-index` is 21 so that shadow paints over the thread footer. The resize handle stays at 22. Its full-height seam stays hidden, and hovering it shows the same short grip. An open panel does not keep a transform, so browser and terminal views keep working. Narrow screens keep the shelf slide.
- **desktop layout setting** — Settings → Sidebar → "데스크톱 카드 레이아웃" (`desktopLayout`, default on). Off removes the desktop card, slide, grip, and gutter paint and returns the host desktop sidebar. The narrow-screen drawer stays. The ChatUI canvas theme is a separate switch. CLI: `bb plugin config sidebar set desktopLayout false`.
- **chat canvas theme** — `plugin:sidebar:chat-canvas`는 채팅과 사이드바를 조금 더 어둡게 맞춘 선택 테마다. 라이트는 `--canvas: oklch(0.95 0 0)`, `--sidebar: oklch(0.93 0 0)`, 다크는 각각 `oklch(0.15 0 0)`, `oklch(0.18 0 0)`다. `--background`, `--card`, `--popover`는 canvas를 따른다. 강조색과 UI 효과는 그대로 둔다. Activate with `bb theme set plugin:sidebar:chat-canvas`.
- **haptics** — 호스트가 지원하면 열림·닫힘, 패널 탭 동작, 새 탭 목록의 모든 실행 행(기본 액션, 플러그인 액션, 최근 파일, 검색 결과)에 짧은 `impact-light`를 보낸다. 정렬 핸들과 비활성 행은 제외한다.
- **composer focus** — opening the left sidebar blurs the composer so the keyboard can dismiss on mobile

## install

Requires [bb](https://getbb.app) with a compatible Plugin SDK (`engines` in `package.json`).

From a clone:

```bash
git clone https://github.com/HIJKM/bb-plugin-sidebar.git
cd bb-plugin-sidebar
bb plugin install . --yes
```

Or from GitHub:

```bash
bb plugin install 'git:https://github.com/HIJKM/bb-plugin-sidebar.git@main' --yes
```

Plugin id: `sidebar`.

## what it does

Content script `sidebar-depth` mounts styles and observers for:

- left shell `[data-sidebar="panel"]`
- right panel (`[data-panel] > aside`, and the compact secondary shelf)

It does not theme thread rows or replace the sidebar navigation list.

## related

| plugin | role |
| --- | --- |
| `bb-ribbon` | icon ribbon navigation |
| `bb-thread-theme` | thread list look and row chrome |

## license

MIT. See [LICENSE](LICENSE).
