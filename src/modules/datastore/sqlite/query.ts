import { DatastoreSchema } from '../schema';
import { serializeDatastoreValue } from './mapper';

export class UnsupportedDatastoreOperationError extends Error {
  constructor(operation: string) {
    super(`Unsupported datastore operation: ${operation}`);
    this.name = 'UnsupportedDatastoreOperationError';
  }
}

export const quoteIdentifier = (identifier: string): string => `"${identifier.replace(/"/g, '""')}"`;

export const assertDatastoreFields = (schema: DatastoreSchema, fields: string[]): void => {
  fields.forEach((field) => {
    if (field.startsWith('$') || !schema.columns[field]) {
      throw new UnsupportedDatastoreOperationError(`field ${field}`);
    }
  });
};

const COMPARISON_SQL: Record<string, string> = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $ne: '<>',
};

export const compileDatastoreFilter = (schema: DatastoreSchema, filter: Record<string, any> = {}): { sql: string; params: any[] } => {
  const fields = Object.keys(filter).filter(field => filter[field] !== undefined);
  assertDatastoreFields(schema, fields);

  const clauses: string[] = [];
  const params: any[] = [];

  fields.forEach((field) => {
    const column = schema.columns[field];
    const columnSql = quoteIdentifier(column.name);
    const value = filter[field];

    if (field.includes('.') || value instanceof RegExp || Array.isArray(value)) {
      throw new UnsupportedDatastoreOperationError(`filter ${field}`);
    }

    if (value === null) {
      clauses.push(`${columnSql} IS NULL`);
      return;
    }

    if (!value || typeof value !== 'object') {
      clauses.push(`${columnSql} = ?`);
      params.push(serializeDatastoreValue(column, value));
      return;
    }

    const operators = Object.keys(value);
    if (operators.length === 0) {
      throw new UnsupportedDatastoreOperationError(`empty filter ${field}`);
    }

    operators.forEach((operator) => {
      const operand = value[operator];
      if (operator === '$in') {
        if (!Array.isArray(operand)) throw new UnsupportedDatastoreOperationError('$in');
        if (operand.length === 0) {
          clauses.push('0');
          return;
        }
        clauses.push(`${columnSql} IN (${operand.map(() => '?').join(', ')})`);
        params.push(...operand.map(item => serializeDatastoreValue(column, item)));
        return;
      }

      const comparison = COMPARISON_SQL[operator];
      if (!comparison) throw new UnsupportedDatastoreOperationError(operator);
      if (operand === null) {
        if (operator !== '$ne') throw new UnsupportedDatastoreOperationError(`${operator} null`);
        clauses.push(`${columnSql} IS NOT NULL`);
        return;
      }
      clauses.push(`${columnSql} ${comparison} ?`);
      params.push(serializeDatastoreValue(column, operand));
    });
  });

  return {
    sql: clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

export const compileDatastoreSort = (schema: DatastoreSchema, sort: Record<string, number> | undefined): string => {
  if (!sort) return '';
  const fields = Object.keys(sort);
  assertDatastoreFields(schema, fields);
  const clauses = fields.map((field) => {
    const direction = sort[field];
    if (direction !== 1 && direction !== -1) {
      throw new UnsupportedDatastoreOperationError(`sort direction ${direction}`);
    }
    return `${quoteIdentifier(schema.columns[field].name)} ${direction === -1 ? 'DESC' : 'ASC'}`;
  });
  return clauses.length > 0 ? ` ORDER BY ${clauses.join(', ')}` : '';
};

export const compileDatastorePagination = (limit: number | undefined, skip: number | undefined): { sql: string; params: number[] } => {
  if (limit === undefined && skip === undefined) return { sql: '', params: [] };
  if ((limit !== undefined && (!Number.isInteger(limit) || limit < 0))
    || (skip !== undefined && (!Number.isInteger(skip) || skip < 0))) {
    throw new UnsupportedDatastoreOperationError('invalid pagination');
  }

  if (limit === undefined) return { sql: ' LIMIT -1 OFFSET ?', params: [skip || 0] };
  if (skip === undefined) return { sql: ' LIMIT ?', params: [limit] };
  return { sql: ' LIMIT ? OFFSET ?', params: [limit, skip] };
};
