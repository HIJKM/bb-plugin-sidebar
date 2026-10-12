import type { BbPluginApi } from "@get-bb/plugin-sdk";

import { DESKTOP_LAYOUT_CHANNEL, DESKTOP_LAYOUT_SETTING } from "./lib/desktop-layout";
import { RIBBON_PIN_CHANNEL, RIBBON_PIN_SETTING } from "./lib/ribbon-pin";

export default function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    [DESKTOP_LAYOUT_SETTING]: {
      type: "boolean",
      label: "데스크톱 카드 레이아웃",
      description:
        "데스크톱에서 좌우 사이드바를 떠 있는 카드로 보여 줍니다. 끄면 카드, 슬라이드, 짧은 핸들, 캔버스 색이 빠지고 호스트 사이드바로 돌아갑니다. 좁은 화면 드로어는 그대로입니다.",
      default: true,
    },
    [RIBBON_PIN_SETTING]: {
      type: "boolean",
      label: "리본 고정",
      description:
        "데스크톱에서 사이드바를 접으면 리본 너비와 좌우 여백만 남기고 본문이 그 옆을 채웁니다. 끄면 리본도 사이드바와 함께 왼쪽으로 사라집니다. 폰에는 적용하지 않습니다.",
      default: false,
    },
  });
  settings.onChange((next) => {
    bb.realtime.publish(DESKTOP_LAYOUT_CHANNEL, {
      enabled: next.desktopLayout === true,
    });
    bb.realtime.publish(RIBBON_PIN_CHANNEL, {
      enabled: next.pinRibbon === true,
    });
  });
}
