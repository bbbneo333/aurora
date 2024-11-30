import { useEffect, useState } from 'react';

export type DataLoadFn<T> = () => Promise<T>;

export type DataLoad<T> = {
  data?: T;
  error?: Error;
  loading: boolean;
};

export function useDataLoad<T = any>(loader: DataLoadFn<T>): DataLoad<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(false);

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
  }, []);

  return {
    data,
    error,
    loading,
  };
}
