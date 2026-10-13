import {
  Palette,
  Type,
  AlignJustify,
  Maximize,
  Check,
  Focus,
} from "lucide-react";
import { Modal } from "@/components/ui/dialog";
import { ConfigIcon } from "@/components/ui/config-content";
import { useBookPreferences } from "@/hooks/use-book-preferences";
import { config, localized } from "@/lib/book";
import { t } from "@/lib/i18n";

const colorValue = (value: string) =>
  /^#[0-9a-f]{3}$/i.test(value)
    ? "#" +
      Array.from(value.slice(1), (character) => character + character).join("")
    : value;

export function SettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { prefs, update } = useBookPreferences(),
    tr = t(prefs.locale),
    appearance = config.appearance;
  const theme = appearance.themes.find((item) => item.id === prefs.theme)!;
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={tr.appearance}>
      <div className="settings-body">
        <section className="settings-section">
          <div className="settings-label">
            <Palette size={config.appearance.iconSizes["16"]} />
            <span>{tr.theme}</span>
          </div>
          <div
            className="theme-grid"
            style={{
              gridTemplateColumns: `repeat(${appearance.themes.length},minmax(0,1fr))`,
            }}
          >
            {appearance.themes.map((item) => (
              <button
                key={item.id}
                className={`theme-choice ${prefs.theme === item.id ? "selected" : ""}`}
                onClick={() => update({ theme: item.id })}
              >
                <span
                  className="theme-swatch"
                  style={{ background: item.swatch, color: item.iconColor }}
                >
                  <ConfigIcon
                    name={item.icon}
                    size={config.appearance.iconSizes["23"]}
                  />
                </span>
                <span>{localized(item.label, prefs.locale)}</span>
                {prefs.theme === item.id && (
                  <Check size={config.appearance.iconSizes["15"]} />
                )}
              </button>
            ))}
          </div>
        </section>
        <section className="settings-section">
          <div className="settings-label">
            <Type size={config.appearance.iconSizes["16"]} />
            <span>{tr.settingsModalTypeface}</span>
          </div>
          <div className="segmented">
            {appearance.fonts.map((font) => (
              <button
                key={font.id}
                className={prefs.font === font.id ? "active" : ""}
                onClick={() => update({ font: font.id })}
              >
                {localized(font.label, prefs.locale)}
              </button>
            ))}
          </div>
        </section>
        <section className="settings-section">
          <label className="settings-label" htmlFor="fontSize">
            <Type size={config.appearance.iconSizes["16"]} />
            {tr.fontSize}
            <output>{prefs.fontSize}px</output>
          </label>
          <input
            id="fontSize"
            type="range"
            {...appearance.ranges.fontSize}
            value={prefs.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
        </section>
        <section className="settings-section">
          <label className="settings-label" htmlFor="lineHeight">
            <AlignJustify size={config.appearance.iconSizes["16"]} />
            {tr.lineHeight}
            <output>{prefs.lineHeight}</output>
          </label>
          <input
            id="lineHeight"
            type="range"
            {...appearance.ranges.lineHeight}
            value={prefs.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
          />
        </section>
        <section className="settings-section">
          <label className="settings-label" htmlFor="width">
            <Maximize size={config.appearance.iconSizes["16"]} />
            {tr.width}
            <output>{prefs.contentWidth}px</output>
          </label>
          <input
            id="width"
            type="range"
            {...appearance.ranges.contentWidth}
            value={prefs.contentWidth}
            onChange={(e) => update({ contentWidth: Number(e.target.value) })}
          />
        </section>
        <section className="settings-section">
          <div className="settings-label">
            <Palette size={config.appearance.iconSizes["16"]} />
            <span>{tr.settingsModalCustomColors}</span>
          </div>
          <div className="theme-custom-colors">
            <label>
              {tr.settingsModalAccent}
              <input
                aria-label={tr.settingsModalAccentColor}
                type="color"
                value={colorValue(prefs.accentColor || theme.tokens.accent)}
                onChange={(e) => update({ accentColor: e.target.value })}
              />
            </label>
            <label>
              {tr.settingsModalPaper}
              <input
                aria-label={tr.settingsModalPaperColor}
                type="color"
                value={colorValue(prefs.paperColor || theme.tokens.paper)}
                onChange={(e) => update({ paperColor: e.target.value })}
              />
            </label>
            <button
              onClick={() => update({ accentColor: null, paperColor: null })}
            >
              {tr.settingsModalResetColors}
            </button>
          </div>
        </section>
        <section className="settings-section toggle-setting">
          <div className="settings-label">
            <Focus size={config.appearance.iconSizes["17"]} />
            <span>{tr.focus}</span>
          </div>
          <button
            role="switch"
            aria-label={tr.focus}
            aria-checked={prefs.focus}
            className={`toggle ${prefs.focus ? "on" : ""}`}
            onClick={() => update({ focus: !prefs.focus })}
          >
            <span />
          </button>
        </section>
      </div>
    </Modal>
  );
}
