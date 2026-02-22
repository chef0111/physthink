import { ReactNode } from 'react';
import { DefaultEmptyState, DefaultErrorState } from './default-states';
import { DEFAULT_EMPTY, DEFAULT_ERROR } from '@/common/constants/states';

interface StateConfig {
  title: string;
  message: string;
  button?: {
    label: string;
    href: string;
  };
}

interface DataRendererProps<T> {
  success: boolean;
  error?: {
    message?: string;
  };
  data: T[] | null | undefined;
  empty?: StateConfig;
  errorState?: StateConfig;
  renderEmpty?: () => ReactNode;
  renderError?: (message?: string) => ReactNode;
  render: (data: T[]) => ReactNode;
}

export function DataRenderer<T>({
  success,
  error,
  data,
  empty = DEFAULT_EMPTY,
  errorState = DEFAULT_ERROR,
  renderEmpty,
  renderError,
  render,
}: DataRendererProps<T>) {
  if (!success) {
    if (renderError) return <>{renderError(error?.message)}</>;
    return <DefaultErrorState config={errorState} message={error?.message} />;
  }

  if (!data || data.length === 0) {
    if (renderEmpty) return <>{renderEmpty()}</>;
    return <DefaultEmptyState config={empty} />;
  }

  return <>{render(data)}</>;
}
