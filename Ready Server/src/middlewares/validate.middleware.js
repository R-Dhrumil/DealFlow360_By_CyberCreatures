import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const errorMessages = error.errors ? error.errors.map((err) => `${err.path.join('.')}: ${err.message}`) : [error.message];
    next(new ApiError(400, 'Validation Error', errorMessages));
  }
};
