// utils/deepMerge.js
const isPlainObject = (value) => {
  if (!value || typeof value !== 'object' || value instanceof Date) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const deepMerge = (target, source) => {
  Object.keys(source).forEach((key) => {
    if (source[key] === undefined) return;
    if (isPlainObject(source[key])) {
      if (!isPlainObject(target[key])) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
};

module.exports = { deepMerge };
