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

- **left sidebar** — on desktop, a floating card. It slides in from the left and fades in. Closing slides it back left and fades it out. While it is open its transform is `none`, and the resize handle sits on the layout column's right edge. The full-height seam stays hidden. Hovering that edge shows a short 4×32px grip. The card and the space behind it use the ChatUI canvas (`oklch(0.97 0 0)`, dark `oklch(0.17 0 0)`). The card's `z-index` is 21, above the thread footer. The mobile drawer still eases in from halfway.
- **right panel** — on desktop, the same horizontal slide and fade toward the right, including while it closes. Its card and the space behind it use that same ChatUI canvas. The panel's overflow stays visible so the card shadow is not clipped, and the card's `z-index` is 21 so that shadow paints over the thread footer. The resize handle stays at 22. Its full-height seam stays hidden, and hovering it shows the same short grip. An open panel does not keep a transform, so browser and terminal views keep working. Narrow screens keep the shelf slide.
- **chat canvas theme** — `plugin:sidebar:chat-canvas` sets `--canvas` to the ChatUI face (`oklch(0.97 0 0)`, dark `oklch(0.17 0 0)`). Surfaces that use `--background`, `--card`, or `--popover` follow it. Activate with `bb theme set plugin:sidebar:chat-canvas`.
- **haptics** — short `impact-light` feedback on open/close and panel tab actions when the host supports it
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
