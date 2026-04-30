export type ErrorCode =
  | 'E001'
  | 'E002'
  | 'E003'
  | 'E004'
  | 'E005'
  | 'E006'
  | 'E007'
  | 'E008'
  | 'E009'
  | 'E010';

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message: string, status: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function toPublicErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return '일시적인 오류가 발생했습니다. 다시 시도해주세요.';
}
