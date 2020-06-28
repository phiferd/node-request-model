function getValue(req, name, sources, defaultValue) {
  let value = undefined;
  for (const source of sources) {
    value = (req[source] || {})[name];
    if (value) break;
  }

  if (typeof value !== 'undefined') {
    return value;
  }

  return defaultValue;
}

function asBool(value) {
  return ['true', true, '1', 1].includes(value);
}

function asInt(value) {
  return typeof value === 'number'
    ? value
    : parseInt(value);
}

function asFloat(value) {
  return typeof value === 'number'
    ? value
    : parseFloat(value);
}

function getParams (req, definition) {
  const output = {};
  Object.keys(definition).forEach(key => {
    const paramDef = typeof definition[key] === 'string'
      ? {type: definition[key], required: true}
      : definition[key];

    const paramName = paramDef.name || key;
    const value = getParam(req, key, paramDef);
    output[key] = value;

    if (paramDef.required && typeof value === 'undefined') {
      throw Error(`${paramName} is a required parameter`);
    }
    if (paramDef.enum && !paramDef.enum.includes(value)) {
      throw Error(`${paramName} was ${value}. Must be one of: ${paramDef.enum.join(', ')}`);
    }
    if (paramDef.validation) {
      const config = getValidationConfig(paramName, paramDef.validation);
      const ok = config.isValid(value);
      if (!ok) {
        throw Error(`${paramName} failed validation: ${config.message(value)}`);
      }
    }
  })
  return output;
}

function getValidationConfig(paramName, validation) {
  return typeof validation === 'function'
    ? {
      isValid: validation,
      message: () => `${paramName} failed validation`
    }
    : {
      isValid: validation.isValid,
      message: typeof validation.message === 'function'
        ? validation.message
        : () => validation.message
    };
}

function getParam(req, key, paramDef) {
  const type = paramDef.type || 'string';
  const name = paramDef.name || key;
  const defaultValue = typeof paramDef.default === 'function'
    ? paramDef.default()
    : paramDef.default;

  // the only place to find an object parameter is in the body
  if (type === 'object') return getValue(req, name, ['body'], defaultValue);

  const sources = paramDef.sources || ['params', 'query', 'body'];
  const value = getValue(req, name, sources, defaultValue);

  if (type === 'string') return value;
  if (['int', 'integer'].includes(type)) return asInt(value);
  if (['float', 'decimal'].includes(type)) return asFloat(value);
  if (['bool', 'boolean'].includes(type)) return asBool(value);

  throw Error(`Invalid type in node-request-model definition, ${type}`);
}

/**
 * Middleware to allow APIs to easily define their expected input parameters, set default values,
 * and throw exceptions when input is not as expected.
 * @param definition An object mapping the expected parameters to their type information.
 * @param output The property name to use to store the output. Defaults to 'model'
 * @returns {function(...[*]=)} An express middleware function that will populate the `req.model`
 * property with the same keys as defined in the definition. The values will be replaced with the extracted
 * values.  e.g. {x: {type: 'int', default: 0}} will result in req.model.x = 123 if a value of 123 is
 * found in the request body, query, or params. Otherwise, a value of 0 will be returned.
 */
function model(definition, output='model') {
  return (req, res, next) => {
    try {
      req[output] = getParams(req, definition);
      next();
    } catch (e) {
      res.status(400).send(e.message);
    }
  }
}

module.exports = model;
