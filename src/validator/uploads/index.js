const InvariantError = require('../../exceptions/InvariantError');
const { ImageCoversSchema } = require('./schema');

const UploadsValidator = {
  validateImageCoversSchema: (headers) => {
    const validationResult = ImageCoversSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;
