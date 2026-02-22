import Link from 'next/link';
import { Route } from 'next';
import { Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../ui/empty';

interface StateConfig {
  title: string;
  message: string;
  button?: {
    label: string;
    href: string;
  };
}

export function DefaultEmptyState({ config }: { config: StateConfig }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-16 rounded-xl">
          <Inbox className="size-8" />
        </EmptyMedia>
        <EmptyTitle>{config.title}</EmptyTitle>
        <EmptyDescription>{config.message}</EmptyDescription>
      </EmptyHeader>
      {config.button && (
        <EmptyContent>
          <Button asChild>
            <Link href={config.button.href as Route}>
              {config.button.label}
            </Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function DefaultErrorState({
  config,
  message,
}: {
  config: StateConfig;
  message?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive/10 size-16 rounded-xl"
        >
          <AlertTriangle className="text-destructive size-8" />
        </EmptyMedia>
        <EmptyTitle className="text-destructive">{config.title}</EmptyTitle>
        <EmptyDescription>{message || config.message}</EmptyDescription>
      </EmptyHeader>
      {config.button && (
        <EmptyContent>
          <Button variant="secondary" className="border-border border" asChild>
            <Link href={config.button.href as Route}>
              {config.button.label}
            </Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
