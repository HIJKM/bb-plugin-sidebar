import type { BbPluginApi } from "@get-bb/plugin-sdk";

import { DESKTOP_LAYOUT_CHANNEL, DESKTOP_LAYOUT_SETTING } from "./lib/desktop-layout";

export default function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    [DESKTOP_LAYOUT_SETTING]: {
      type: "boolean",
      label: "데스크톱 카드 레이아웃",
      description:
        "데스크톱에서 좌우 사이드바를 떠 있는 카드로 보여 줍니다. 끄면 카드, 슬라이드, 짧은 핸들, 캔버스 색이 빠지고 호스트 사이드바로 돌아갑니다. 좁은 화면 드로어는 그대로입니다.",
      default: true,
    },
  });
  settings.onChange((next) => {
    bb.realtime.publish(DESKTOP_LAYOUT_CHANNEL, {
      enabled: next.desktopLayout === true,
    });
  });
}
