import { WebPlugin } from '@capacitor/core';
import localForage from 'localforage';
import sqlite from 'sql.js';

import type {
  CapacitorSQLitePlugin,
  capAllConnectionsOptions,
  capChangeSecretOptions,
  capEchoOptions,
  capEchoResult,
  capNCConnectionOptions,
  capNCDatabasePathOptions,
  capNCDatabasePathResult,
  capNCOptions,
  capSetSecretOptions,
  capSQLiteChanges,
  capSQLiteExecuteOptions,
  capSQLiteExportOptions,
  capSQLiteFromAssetsOptions,
  capSQLiteHTTPOptions,
  capSQLiteLocalDiskOptions,
  capSQLiteImportOptions,
  capSQLiteJson,
  capSQLiteOptions,
  capSQLitePathOptions,
  capSQLiteQueryOptions,
  capSQLiteResult,
  capSQLiteRunOptions,
  capSQLiteSetOptions,
  capSQLiteSyncDate,
  capSQLiteSyncDateOptions,
  capSQLiteTableOptions,
  capSQLiteUpgradeOptions,
  capSQLiteUrl,
  capSQLiteValues,
  capVersionResult,
} from './definitions';

export class CapacitorSQLiteWeb
  extends WebPlugin
  implements CapacitorSQLitePlugin
{
  dbs: { [key: string]: sqlite.Database } = {};
  SQL!: sqlite.SqlJsStatic;

  async initWebStore(): Promise<void> {
    this.SQL = await sqlite();
  }

  async saveToStore(options: capSQLiteOptions): Promise<void> {
    const db = this.dbs[options.database!];
    const data = db.export();
    const idb = localForage.createInstance({ name: 'sqliteStore', storeName: 'databases' });
    //await idb.removeItem(options.database!);
    await idb.setItem(options.database!, data);
  }

  async getFromLocalDiskToStore(_options: capSQLiteLocalDiskOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async saveToLocalDisk(_options: capSQLiteOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async echo(options: capEchoOptions): Promise<capEchoResult> { return options; }

  async createConnection(options: capSQLiteOptions): Promise<void> {
    const idb = localForage.createInstance({ name: 'sqliteStore', storeName: 'databases' });
    const keys = await idb.keys();
    if (!keys.includes(options.database!)){
      const newDb = new this.SQL.Database();
      await idb.setItem(options.database!, newDb.export());
      this.dbs[options.database!] = newDb;
    }
    if (!this.dbs[options.database!]) {
      const existingData = await idb.getItem<Uint8Array>(options.database!);
      const existingDb = new this.SQL.Database(existingData);
      this.dbs[options.database!] = existingDb;
    } 
  }

  async open(_options: capSQLiteOptions): Promise<void> { return; }
  async closeConnection(options: capSQLiteOptions): Promise<void> { this.dbs[options.database!].close(); }
  async getVersion(_options: capSQLiteOptions): Promise<capVersionResult> { throw new Error('Method not implemented.'); }
  async checkConnectionsConsistency(_options: capAllConnectionsOptions): Promise<capSQLiteResult> { return { result: true }; }
  async close(options: capSQLiteOptions): Promise<void> { this.dbs[options.database!].close(); }
  async getTableList(_options: capSQLiteOptions): Promise<capSQLiteValues> { throw new Error('Method not implemented.'); }

  async execute(_options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    throw new Error('Method not implemented.');
/*     const db = this.dbs[options.database!];
    const result: capSQLiteChanges = { changes: { changes: 0, lastId: 0 } };
    for (const s of options.statements!) {
      result.changes = { changes: (db.exec(s)).length, lastId: 0 };
    }
    return result; */
  }

  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    const db = this.dbs[options.database!]
    const result = { changes: { changes: 0, lastId: 0 } };
    let currentStatement = '';
    let currentSanitizedValues: any[] = [];
    try {
      for (const s of options.set!) {
        currentStatement = s.statement!;
        currentSanitizedValues = s.values?.map(v => v == undefined ? null : v == true ? 1 : v == false ? 0 : v) ?? [];
        db.exec(s.statement!, currentSanitizedValues);
        result.changes.changes += db.getRowsModified();
      }
      currentStatement = '';
      return result;
    } catch (error) {
      throw new Error((error as { message: string; }).message + ' ' + currentStatement + ' ' + JSON.stringify(currentSanitizedValues));
    }
  }

  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> { return this.executeSet({ ...options, set: [{ statement: options.statement, values: options.values }] }); }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    try{
      const db = this.dbs[options.database!];
      const result: { values: any[]} = { values: [] };
      const sanitizedValues = options.values?.map(v => v == undefined ? null : v == true ? 1 : v == false ? 0 : v) ?? [];
      
      const stmt = db.prepare(options.statement!);
      stmt.bind(sanitizedValues);
      while (stmt.step()) result.values.push(stmt.getAsObject());
      stmt.free();
      return result;
    } catch (error) {
      console.log('query error', options, error);
      throw error;
    }
  }
  async isDBExists(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isDBOpen(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isDatabase(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isTableExists(options: capSQLiteTableOptions): Promise<capSQLiteResult> {
    const rows = (await this.query({ ...options, statement: "SELECT name FROM sqlite_master WHERE type='table' AND name=?;", values: [options.table!] })).values!;
    return { result: rows.length > 0 };
  }
  async deleteDatabase(_options: capSQLiteOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async isJsonValid(_options: capSQLiteImportOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async importFromJson(_options: capSQLiteImportOptions): Promise<capSQLiteChanges> { throw new Error('Method not implemented.'); }
  async exportToJson(_options: capSQLiteExportOptions): Promise<capSQLiteJson> { throw new Error('Method not implemented.'); }
  async createSyncTable(_options: capSQLiteOptions): Promise<capSQLiteChanges> { throw new Error('Method not implemented.'); }
  async setSyncDate(_options: capSQLiteSyncDateOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async getSyncDate(_options: capSQLiteOptions): Promise<capSQLiteSyncDate> { throw new Error('Method not implemented.'); }
  async deleteExportedRows(_options: capSQLiteOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async addUpgradeStatement(_options: capSQLiteUpgradeOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async copyFromAssets(_options: capSQLiteFromAssetsOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async getFromHTTPRequest(_options: capSQLiteHTTPOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async getDatabaseList(): Promise<capSQLiteValues> { throw new Error('Method not implemented.'); }

  ////////////////////////////////////
  ////// UNIMPLEMENTED METHODS
  ////////////////////////////////////

  async getUrl(): Promise<capSQLiteUrl> {
    throw this.unimplemented('Not implemented on web.');
  }

  async getMigratableDbList(
    options: capSQLitePathOptions,
  ): Promise<capSQLiteValues> {
    console.log('getMigratableDbList', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async addSQLiteSuffix(options: capSQLitePathOptions): Promise<void> {
    console.log('addSQLiteSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async deleteOldDatabases(options: capSQLitePathOptions): Promise<void> {
    console.log('deleteOldDatabases', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async moveDatabasesAndAddSuffix(
    options: capSQLitePathOptions,
  ): Promise<void> {
    console.log('moveDatabasesAndAddSuffix', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isSecretStored(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async setEncryptionSecret(options: capSetSecretOptions): Promise<void> {
    console.log('setEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async changeEncryptionSecret(options: capChangeSecretOptions): Promise<void> {
    console.log('changeEncryptionSecret', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async clearEncryptionSecret(): Promise<void> {
    console.log('clearEncryptionSecret');
    throw this.unimplemented('Not implemented on web.');
  }

  async checkEncryptionSecret(
    options: capSetSecretOptions,
  ): Promise<capSQLiteResult> {
    console.log('checkEncryptionPassPhrase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async getNCDatabasePath(
    options: capNCDatabasePathOptions,
  ): Promise<capNCDatabasePathResult> {
    console.log('getNCDatabasePath', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async createNCConnection(options: capNCConnectionOptions): Promise<void> {
    console.log('createNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async closeNCConnection(options: capNCOptions): Promise<void> {
    console.log('closeNCConnection', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isNCDatabase(options: capNCOptions): Promise<capSQLiteResult> {
    console.log('isNCDatabase', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isDatabaseEncrypted(
    options: capSQLiteOptions,
  ): Promise<capSQLiteResult> {
    console.log('isDatabaseEncrypted', options);
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigEncryption(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  async isInConfigBiometricAuth(): Promise<capSQLiteResult> {
    throw this.unimplemented('Not implemented on web.');
  }
}
