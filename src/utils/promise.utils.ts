export function resolveWithin<T>(promise: Promise<T | any>, timeout: number): Promise<T | any> {
  return new Promise((resolve, reject) => {
    // set up the timeout
    const timer = setTimeout(() => {
      const error = new Error(`Promise timed out after ${timeout} ms`);
      error.name = 'PromiseExecutionTimedOut';

      reject(error);
    }, timeout);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
