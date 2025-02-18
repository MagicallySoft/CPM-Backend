export class AppError extends Error {
  public statusCode: number;
  public success: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;

    // Ensure the correct prototype chain is maintained
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
