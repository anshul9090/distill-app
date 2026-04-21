import { Injectable } from '@angular/core';

export interface Theme {
  name:  string;
  label: string;
  icon:  string;
  isDark: boolean;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {

  themes: Theme[] = [
    // ── DARK THEMES ──────────────────────────────────────
    { name: 'dark-purple', label: 'Midnight',  icon: '🌙', isDark: true  },
    { name: 'cyberpunk',   label: 'Cyberpunk', icon: '⚡', isDark: true  },
    { name: 'ocean',       label: 'Deep Sea',  icon: '🌊', isDark: true  },
    { name: 'sunset',      label: 'Sunset',    icon: '🌅', isDark: true  },
    { name: 'carbon',      label: 'Carbon',    icon: '🖤', isDark: true  },
    { name: 'aurora',      label: 'Aurora',    icon: '🌌', isDark: true  },
    // ── LIGHT THEMES ─────────────────────────────────────
    { name: 'light',       label: 'Ivory',     icon: '🤍', isDark: false },
    { name: 'light-rose',  label: 'Blossom',   icon: '🌸', isDark: false },
    { name: 'light-ocean', label: 'Arctic',    icon: '❄️', isDark: false },
  ];

  get darkThemes()  { return this.themes.filter(t =>  t.isDark); }
  get lightThemes() { return this.themes.filter(t => !t.isDark); }

  currentThemeName = 'dark-purple';

  constructor() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved) this.applyTheme(saved);
  }

  applyTheme(themeName: string) {
    const all = [
      'theme-cyberpunk', 'theme-ocean', 'theme-sunset', 'theme-light',
      'theme-carbon',    'theme-aurora', 'theme-light-rose', 'theme-light-ocean'
    ];
    document.body.classList.remove(...all);

    if (themeName !== 'dark-purple') {
      document.body.classList.add(`theme-${themeName}`);
    }

    this.currentThemeName = themeName;
    localStorage.setItem('selectedTheme', themeName);
  }
}