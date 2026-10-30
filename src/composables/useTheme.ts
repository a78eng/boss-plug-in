/**
 * 配色主题
 *
 * 取自 https://zeeklog.com/ui-color-aesthetics 的配色库,
 * 每套都遵循「一个强调色 + 中性表面 + 高对比文字」的规则,
 * 通过 CSS 变量下发, 因此不用重新构建就能换色。
 */
export interface ThemeColors {
  /** 页面底色 */
  bg: string
  /** 卡片表面 */
  surface: string
  /** 分割线 */
  line: string
  /** 主文字 */
  ink: string
  /** 次要文字 */
  muted: string
  /** 强调色 */
  accent: string
  /** 强调色浅底 */
  accentSoft: string
}

export interface ThemePreset {
  id: string
  name: string
  colors: ThemeColors
}

export const themePresets: ThemePreset[] = [
  {
    id: 'techBlue',
    name: '科技蓝灰',
    colors: {
      bg: '#f1f5f9',
      surface: '#ffffff',
      line: '#e2e8f0',
      ink: '#0f172a',
      muted: '#64748b',
      accent: '#0ea5e9',
      accentSoft: '#e0f2fe',
    },
  },
  {
    id: 'mujiBone',
    name: '极简米白',
    colors: {
      bg: '#f6f3ee',
      surface: '#fffdfa',
      line: '#e6e1d4',
      ink: '#1a1a1a',
      muted: '#9b9285',
      accent: '#7b8b5e',
      accentSoft: '#eef1e4',
    },
  },
  {
    id: 'arcticFrost',
    name: '冰蓝霜白',
    colors: {
      bg: '#eef4f9',
      surface: '#ffffff',
      line: '#dbe7f2',
      ink: '#12314a',
      muted: '#5c7d97',
      accent: '#2e6b8a',
      accentSoft: '#e2eef7',
    },
  },
  {
    id: 'auroraMint',
    name: '极光薄荷',
    colors: {
      bg: '#eef7f4',
      surface: '#ffffff',
      line: '#d5e9e2',
      ink: '#0d1b2a',
      muted: '#4b6b61',
      accent: '#0f9d7a',
      accentSoft: '#dcf5ec',
    },
  },
  {
    id: 'akaSumi',
    name: '朱墨',
    colors: {
      bg: '#f4f2ee',
      surface: '#fffdfb',
      line: '#e3ded6',
      ink: '#1a1a1a',
      muted: '#7a7a7a',
      accent: '#bc002d',
      accentSoft: '#fbe6ea',
    },
  },
  {
    id: 'bankerNavy',
    name: '商务藏青',
    colors: {
      bg: '#eef1f6',
      surface: '#ffffff',
      line: '#dde3ee',
      ink: '#0a1733',
      muted: '#5b6b86',
      accent: '#15294d',
      accentSoft: '#e6ebf5',
    },
  },
]

export const defaultThemeId = themePresets[0]!.id

function normalizeHex(color: string): string | null {
  const value = color.trim()
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return (
      '#' +
      value
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')
    )
  }
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value
  }
  return null
}

/** 把颜色往白色方向混, 用于生成强调色的浅底 */
export function mixWhite(color: string, ratio = 0.88): string {
  const hex = normalizeHex(color)
  if (!hex) {
    return color
  }
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const blend = (v: number) => Math.round(v + (255 - v) * ratio)
  return (
    '#' +
    [blend(r), blend(g), blend(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

export function resolveTheme(themeId?: string, customAccent?: string): ThemeColors {
  const preset = themePresets.find((item) => item.id === themeId) ?? themePresets[0]!
  const colors: ThemeColors = { ...preset.colors }
  const custom = customAccent ? normalizeHex(customAccent) : null
  if (custom) {
    colors.accent = custom
    colors.accentSoft = mixWhite(custom)
  }
  return colors
}

/** 把配色写入 CSS 变量(挂在 shadow 内部的根节点上, 子元素全部继承) */
export function applyThemeVars(el: HTMLElement, colors: ThemeColors) {
  const style = el.style
  style.setProperty('--color-bh-bg', colors.bg)
  style.setProperty('--color-bh-surface', colors.surface)
  style.setProperty('--color-bh-line', colors.line)
  style.setProperty('--color-bh-ink', colors.ink)
  style.setProperty('--color-bh-muted', colors.muted)
  style.setProperty('--color-bh-accent', colors.accent)
  style.setProperty('--color-bh-accent-soft', colors.accentSoft)

  // Nuxt UI 内置变量, 让按钮/复选框/进度条等一起跟随主题
  style.setProperty('--ui-primary', colors.accent)
  style.setProperty('--ui-bg', colors.surface)
  style.setProperty('--ui-bg-muted', colors.bg)
  style.setProperty('--ui-bg-elevated', colors.surface)
  style.setProperty('--ui-border', colors.line)
  style.setProperty('--ui-text', colors.ink)
  style.setProperty('--ui-text-muted', colors.muted)
  style.setProperty('--ui-text-dimmed', colors.muted)
}
