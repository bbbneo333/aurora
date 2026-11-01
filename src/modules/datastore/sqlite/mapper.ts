import { DatastoreColumn, DatastoreSchema } from '../schema';

export const serializeDatastoreValue = (column: DatastoreColumn, value: any): any => {
  if (value === null || value === undefined) return null;
  if (column.type === 'boolean') return value ? 1 : 0;
  if (column.type === 'json') return JSON.stringify(value);
  return value;
};

export const hydrateDatastoreRow = (schema: DatastoreSchema, row: Record<string, any>): any => {
  const result: Record<string, any> = {};
  Object.keys(schema.columns).forEach((field) => {
    const column = schema.columns[field];
    const value = row[column.name];
    if (value === null && column.omitIfNull) return;
    if (column.type === 'boolean') {
      result[field] = Boolean(value);
    } else if (column.type === 'json') {
      result[field] = value === null ? null : JSON.parse(value);
    } else {
      result[field] = value;
    }
  });
  return result;
};
