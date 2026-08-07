export type FetchError = {
  message: string;
  cause?: unknown;
};

export type QueryFetchResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: FetchError };

export type QueryFetchOptions<T> = {
  /** In-flight fetch to await (e.g. `queryClient.fetchQuery(queryOptions)`). */
  promise: Promise<T>;
  /**
   * User-facing message when the caught value is not an `Error`, or as the
   * fallback passed to {@link getErrorMessage}.
   */
  fallbackMessage: string;
};

/**
 * Resolves a user-facing error string from an unknown thrown value.
 *
 * @param error - Caught value; if it is an `Error`, its `.message` is used.
 * @param message - Fallback when `error` is not an `Error` instance.
 * @returns The error message or `message`.
 */
export function getErrorMessage(
  error: unknown,
  message = 'An unexpected error occurred'
): string {
  return error instanceof Error ? error.message : message;
}

/**
 * Awaits a data-fetch promise and normalizes the outcome for soft-error UI
 * (e.g. DataRenderer) instead of throwing.
 *
 * On success returns `{ success: true, data }`. On failure returns
 * `{ success: false, error }` with a user-facing message — never rethrows.
 *
 * @typeParam T - Inferred from `promise`; typically the oRPC / TanStack Query
 *   `fetchQuery` output type.
 * @param options - Named fetch inputs; see {@link QueryFetchOptions}.
 * @param options.promise - The in-flight fetch to await.
 * @param options.fallbackMessage - Fallback message for non-`Error` failures.
 * @returns A discriminated {@link QueryFetchResult} with `success`, `data`, and `error`.
 */
export async function queryFetch<T>({
  promise,
  fallbackMessage,
}: QueryFetchOptions<T>): Promise<QueryFetchResult<T>> {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: {
        message: getErrorMessage(e, fallbackMessage),
        cause: e,
      },
    };
  }
}
