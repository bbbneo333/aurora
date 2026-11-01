type SQLiteRunResult = {
  changes: number;
  lastInsertRowid: number | bigint;
};

export type SQLiteStatement = {
  all: (...params: any[]) => Record<string, any>[];
  get: (...params: any[]) => Record<string, any> | undefined;
  run: (...params: any[]) => SQLiteRunResult;
};

type SQLiteDatabaseSync = {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => SQLiteStatement;
};

const { DatabaseSync } = require('node:sqlite');

export class SQLiteConnection {
  private readonly database: SQLiteDatabaseSync;

  constructor(filename: string) {
    this.database = new DatabaseSync(filename);
  }

  close(): void {
    this.database.close();
  }

  exec(sql: string): void {
    this.database.exec(sql);
  }

  prepare(sql: string): SQLiteStatement {
    return this.database.prepare(sql);
  }

  transaction<T>(operation: () => T): T {
    this.exec('BEGIN IMMEDIATE;');
    try {
      const result = operation();
      this.exec('COMMIT;');
      return result;
    } catch (error) {
      this.exec('ROLLBACK;');
      throw error;
    }
  }
}
