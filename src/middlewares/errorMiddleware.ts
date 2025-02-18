// errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// Global error handler
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  
  if (!err.statusCode) {
    err.statusCode = 500;
    err.message = err.message || 'Something went wrong!';
  }

  // If it's an operational error, send a structured response
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      data: err.data || null, // Optional: Include extra data with the error, if any
    });
  } else {
    // Log unexpected errors (programming errors, unexpected errors)
    console.error('ERROR: ', err);

    // Send a generic message to the client for non-operational errors (security reasons)
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Internal Server Error',
      data: null,
    });
  }
};
