/**
 * Обработка ошибок
 */

export class ChatError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export function handleError(error: any) {
  if (error instanceof ChatError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  console.error('Unexpected error:', error)
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }
}

