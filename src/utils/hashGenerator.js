const { nanoid } = require('nanoid');

const generateCode = (length = 6) => {
  return nanoid(length);
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

module.exports = { generateCode, isValidUrl };
