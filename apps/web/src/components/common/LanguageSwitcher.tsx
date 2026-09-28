// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Accessible Language Switcher Component
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@bis/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelect = (langCode: SupportedLanguage) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.changeLanguage')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors ${
          compact ? 'px-2 py-1' : ''
        }`}
      >
        <Globe className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
        <span className="font-medium">{currentLangInfo.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 z-50 mt-1 w-44 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none border border-slate-100 divide-y divide-slate-50"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="flex flex-col">
                  <span>{lang.nativeName}</span>
                  <span className="text-[10px] text-slate-600 font-normal">{lang.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
