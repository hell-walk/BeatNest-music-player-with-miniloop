import { useTheme } from '../../context/ThemeContext.jsx';
import { LeafIcon, MoonIcon, SunIcon } from '../icons.jsx';

const ICONS = { soothing: LeafIcon, light: SunIcon, dark: MoonIcon };

/**
 * Single navbar toggle that cycles Soothing → Light → Dark.
 * Shows icon + theme name on wider screens, icon only on phones (CSS).
 */
export default function ThemeSwitcher() {
  const { theme, themes, cycleTheme } = useTheme();
  const index = themes.findIndex((t) => t.id === theme);
  const current = themes[index];
  const next = themes[(index + 1) % themes.length];
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`${current.description} – click for ${next.label}`}
    >
      <Icon size={18} />
      <span className="theme-toggle__label">{current.label}</span>
    </button>
  );
}
