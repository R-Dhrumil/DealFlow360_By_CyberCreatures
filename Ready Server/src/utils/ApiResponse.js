export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  static send(res, statusCode, data, message = 'Success') {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }
}
