import { useCallback, useEffect, useState } from 'react';

export type DataLoadFn<T> = () => Promise<T>;

export type DataLoad<T> = {
  data?: T;
  error?: Error;
  loading: boolean;
  refresh: () => void;
};

export function useDataLoad<T = any>(loader: DataLoadFn<T>): DataLoad<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(0);

  const refresh = useCallback(() => {
    setCounter(ctr => ctr + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setData(undefined);
    setError(undefined);

    Promise.resolve(loader())
      .then((loadData) => {
        setData(loadData);
      })
      .catch((loadError) => {
        setError(loadError);
      })
      .finally(() => setLoading(false));
  }, [
    counter,
  ]);

  return {
    data,
    error,
    loading,
    refresh,
  };
}
