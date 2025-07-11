const Joi = require('joi');

const validateMergeRequest = (req, res, next) => {
  const schema = Joi.object({
    fileIds: Joi.array().items(Joi.string().required()).min(2).required(),
    outputName: Joi.string().optional(),
    options: Joi.object({
      includeBookmarks: Joi.boolean().default(true),
      includeMetadata: Joi.boolean().default(true)
    }).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

const validateSplitRequest = (req, res, next) => {
  const schema = Joi.object({
    fileId: Joi.string().required(),
    splitBy: Joi.string().valid('pages', 'range').required(),
    pagesPerFile: Joi.number().integer().min(1).when('splitBy', {
      is: 'pages',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    ranges: Joi.array().items(Joi.string()).when('splitBy', {
      is: 'range',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => detail.message)
    });
  }

  next();
};

module.exports = {
  validateMergeRequest,
  validateSplitRequest
};
