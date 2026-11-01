import {
  CREATE_SCHEMA_SQL,
  DATASTORE_SCHEMAS,
  DatastoreSchema,
} from '../schema';
import { SQLiteConnection } from './connection';
import { hydrateDatastoreRow, serializeDatastoreValue } from './mapper';
import { SQLiteDatastoreOperations } from './operations';
import {
  assertDatastoreFields,
  compileDatastoreFilter,
  compileDatastorePagination,
  compileDatastoreSort,
  quoteIdentifier,
  UnsupportedDatastoreOperationError,
} from './query';

export { UnsupportedDatastoreOperationError } from './query';

export class SQLiteDatastore {
  private readonly database: SQLiteConnection;
  private readonly operations: SQLiteDatastoreOperations;

  constructor(filename: string) {
    this.database = new SQLiteConnection(filename);
    this.operations = new SQLiteDatastoreOperations(this.database);
    this.database.exec('PRAGMA foreign_keys = ON;');
    this.database.exec('PRAGMA journal_mode = WAL;');
    this.database.exec(CREATE_SCHEMA_SQL);
  }

  close(): void {
    this.database.close();
  }

  compact(): void {
    this.database.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    this.database.exec('PRAGMA optimize;');
  }

  getSchema(datastoreName: string): DatastoreSchema {
    const schema = DATASTORE_SCHEMAS[datastoreName];
    if (!schema) {
      throw new Error(`Unknown datastore: ${datastoreName}`);
    }

    return schema;
  }

  executeOperation(datastoreName: string, operation: string, args: unknown): any {
    this.getSchema(datastoreName);
    return this.operations.execute(datastoreName, operation, args);
  }

  find(datastoreName: string, query: any = {}): any[] {
    const schema = this.getSchema(datastoreName);
    const filter = query?.filter || {};
    const { sql: whereSql, params } = compileDatastoreFilter(schema, filter);
    const sortSql = compileDatastoreSort(schema, query?.sort);
    const pagination = compileDatastorePagination(query?.limit, query?.skip);
    const sql = `SELECT * FROM ${quoteIdentifier(schema.table)}${whereSql}${sortSql}${pagination.sql}`;
    const rows = this.database.prepare(sql).all(...params, ...pagination.params);

    return rows.map(row => hydrateDatastoreRow(schema, row));
  }

  findOne(datastoreName: string, filter: any = {}): any | undefined {
    const schema = this.getSchema(datastoreName);
    const { sql: whereSql, params } = compileDatastoreFilter(schema, filter || {});
    const sql = `SELECT * FROM ${quoteIdentifier(schema.table)}${whereSql} LIMIT 1`;
    const row = this.database.prepare(sql).get(...params);

    return row ? hydrateDatastoreRow(schema, row) : undefined;
  }

  insert(datastoreName: string, data: Record<string, any>): any {
    const schema = this.getSchema(datastoreName);
    const fields = Object.keys(data).filter(field => data[field] !== undefined);
    assertDatastoreFields(schema, fields);

    const columns = fields.map(field => quoteIdentifier(schema.columns[field].name));
    const placeholders = fields.map(() => '?');
    const params = fields.map(field => serializeDatastoreValue(schema.columns[field], data[field]));
    const sql = `INSERT INTO ${quoteIdentifier(schema.table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const row = this.database.prepare(sql).get(...params);

    return hydrateDatastoreRow(schema, row || {});
  }

  update(datastoreName: string, filter: any, updateDoc: any, multi: boolean): any {
    const schema = this.getSchema(datastoreName);
    const updates = this.extractSetUpdate(schema, updateDoc);
    const fields = Object.keys(updates);
    if (fields.length === 0) {
      return multi ? [] : this.findOne(datastoreName, filter);
    }

    const assignments = fields.map(field => `${quoteIdentifier(schema.columns[field].name)} = ?`);
    const updateParams = fields.map(field => serializeDatastoreValue(schema.columns[field], updates[field]));
    const { sql: whereSql, params: filterParams } = compileDatastoreFilter(schema, filter || {});

    if (multi) {
      const sql = `UPDATE ${quoteIdentifier(schema.table)} SET ${assignments.join(', ')}${whereSql} RETURNING *`;
      return this.database.prepare(sql).all(...updateParams, ...filterParams).map(row => hydrateDatastoreRow(schema, row));
    }

    const targetSql = `SELECT id FROM ${quoteIdentifier(schema.table)}${whereSql} LIMIT 1`;
    const sql = `UPDATE ${quoteIdentifier(schema.table)} SET ${assignments.join(', ')} WHERE id = (${targetSql}) RETURNING *`;
    const row = this.database.prepare(sql).get(...updateParams, ...filterParams);
    return row ? hydrateDatastoreRow(schema, row) : undefined;
  }

  remove(datastoreName: string, filter: any, multi: boolean): void {
    const schema = this.getSchema(datastoreName);
    const { sql: whereSql, params } = compileDatastoreFilter(schema, filter || {});

    if (multi) {
      this.database.prepare(`DELETE FROM ${quoteIdentifier(schema.table)}${whereSql}`).run(...params);
      return;
    }

    const targetSql = `SELECT id FROM ${quoteIdentifier(schema.table)}${whereSql} LIMIT 1`;
    this.database.prepare(`DELETE FROM ${quoteIdentifier(schema.table)} WHERE id = (${targetSql})`).run(...params);
  }

  count(datastoreName: string, filter: any = {}): number {
    const schema = this.getSchema(datastoreName);
    const { sql: whereSql, params } = compileDatastoreFilter(schema, filter || {});
    const row = this.database.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(schema.table)}${whereSql}`).get(...params);
    return Number(row?.count || 0);
  }

  upsert(datastoreName: string, filter: any, data: Record<string, any>): any {
    return this.database.transaction(() => {
      const existing = this.findOne(datastoreName, filter);
      return existing
        ? this.update(datastoreName, { id: existing.id }, { $set: data }, false)
        : this.insert(datastoreName, data);
    });
  }

  private extractSetUpdate(schema: DatastoreSchema, updateDoc: any): Record<string, any> {
    const operators = Object.keys(updateDoc || {});
    const unsupported = operators.find(operator => operator !== '$set');
    if (unsupported) {
      throw new UnsupportedDatastoreOperationError(unsupported);
    }

    const updates = { ...(updateDoc?.$set || {}) };
    delete updates.id;
    assertDatastoreFields(schema, Object.keys(updates));
    return updates;
  }
}
