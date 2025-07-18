import { useCallback, useState } from 'react';

export type DataActionFn<T> = (...args: any[]) => Promise<T>;

export type DataAction<T> = {
  data?: T;
  error?: Error;
  loading: boolean;
  perform: (...args: any[]) => void;
};

export function useDataAction<T = any>(action: DataActionFn<T>): DataAction<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);

  const perform = useCallback((...args: any[]) => {
    setLoading(true);
    setData(undefined);
    setError(undefined);

    Promise.resolve(action(...args))
      .then((actionData) => {
        setData(actionData);
      })
      .catch((actionError) => {
        setError(actionError);
      })
      .finally(() => setLoading(false));
  }, [
    action,
  ]);

  return {
    data,
    error,
    loading,
    perform,
  };
}
