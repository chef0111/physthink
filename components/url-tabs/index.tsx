'use client';

import { useEffect } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabItem {
  value: string;
  label: React.ReactNode;
}

interface UrlTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  paramKey?: string;
  className?: string;
  listClassName?: string;
  children: React.ReactNode;
}

export function UrlTabs({
  tabs,
  defaultTab,
  paramKey = 'tab',
  className,
  listClassName,
  children,
}: UrlTabsProps) {
  const fallback = defaultTab ?? tabs[0]?.value ?? '';

  const [tab, setTab] = useQueryState(paramKey, parseAsString);

  useEffect(() => {
    if (!tab || !tabs.some((t) => t.value === tab)) {
      setTab(fallback);
    }
  }, [tab, tabs, fallback, setTab]);

  const activeTab = tab && tabs.some((t) => t.value === tab) ? tab : fallback;

  return (
    <Tabs value={activeTab} onValueChange={setTab} className={className}>
      <TabsList className={listClassName}>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  );
}
