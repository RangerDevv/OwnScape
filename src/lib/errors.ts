export function handleError(error: unknown, context: string): string {
  const message =
    error instanceof Error ? error.message :
    typeof error === 'string' ? error :
    'An unexpected error occurred'
  console.error(`[${context}]`, error)
  return message
}
