export function validateBody(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json({
          success: false,
          error: errorMessages,
          details: error.format(),
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Validation failed on input data.',
      });
    }
  };
}
