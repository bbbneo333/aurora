export function isIPCErrorObj(obj: any) {
  // eslint-disable-next-line no-underscore-dangle
  return obj?.__isError === true;
}

export function serializeIPCError(err: unknown) {
  if (err instanceof Error) {
    return {
      ...err, // keep custom fields
      __isError: true,
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: (err as any).cause,
    };
  }

  return {
    __isError: true,
    name: 'UnknownError',
    message: String(err),
  };
}

export function deserializeIPCError(obj: any): Error {
  const error = new Error(obj.message);
  error.name = obj.name;

  // restore real stack from main process
  if (obj.stack) {
    error.stack = obj.stack;
  }

  // restore custom props
  Object.assign(error, obj);

  return error;
}
