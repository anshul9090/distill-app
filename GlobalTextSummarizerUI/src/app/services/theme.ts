import { Injectable } from '@angular/core';

export interface Theme {
  name: string;
  label: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themes: Theme[] = [
    { name: 'dark-purple', label: 'Neon Purple', icon: '💜' },
    { name: 'cyberpunk',   label: 'Cyberpunk',   icon: '💚' },
    { name: 'ocean',       label: 'Ocean',        icon: '💙' },
    { name: 'sunset',      label: 'Sunset',       icon: '🧡' },
    { name: 'light',       label: 'Light Mode',   icon: '☀️' }
  ];

  currentThemeName = 'dark-purple';

  constructor() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved) {
      this.applyTheme(saved);
    }
  }

  applyTheme(themeName: string) {
    // Remove all theme classes
    document.body.classList.remove(
      'theme-cyberpunk',
      'theme-ocean', 
      'theme-sunset',
      'theme-light'
    );

    // Apply new theme class
    if (themeName !== 'dark-purple') {
      document.body.classList.add(`theme-${themeName}`);
    }

    this.currentThemeName = themeName;
    localStorage.setItem('selectedTheme', themeName);
  }
}