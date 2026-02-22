'use client';

import { useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon } from '@/components/icons';

interface ThemeToggleProps {
  variant?: 'outline' | 'ghost';
  size?: 'icon' | 'icon-sm' | 'icon-lg' | 'icon-xs';
  className?: string;
}

export default function ThemeToggle({
  variant = 'outline',
  size = 'icon',
  className,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const switchTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={switchTheme}
      aria-label="Toggle theme"
      className={className}
    >
      <SunIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
