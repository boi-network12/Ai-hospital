// src/utils/errors.ts

/**
 * Base custom error class for consistent error handling
 */
export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Trusted error (not a code bug)

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 403 - Forbidden
 */
export class ForbiddenError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * 400 - Bad Request (optional - commonly used)
 */
export class BadRequestError extends CustomError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 401 - Unauthorized (optional)
 */
export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * 409 - Conflict (optional - e.g., duplicate resource)
 */
export class ConflictError extends CustomError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

/**
 * 500 - Internal Server Error (for unexpected errors)
 */
export class InternalServerError extends CustomError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
    this.isOperational = false; // Unexpected error
  }
}