// error.js

export const createError = (status, message, details = null) => {
  const err = new Error();
  err.status = status;
  err.message = message;
  if (details) err.details = details; // Ek detaylar için alan
  return err;
};
