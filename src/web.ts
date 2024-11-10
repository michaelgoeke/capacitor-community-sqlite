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
    const data = [...db.export()];
    const idb = localForage.createInstance({ name: 'sqliteStore', storeName: 'databases' });
    idb.setItem(options.database!, data);
  }

  async getFromLocalDiskToStore(_options: capSQLiteLocalDiskOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async saveToLocalDisk(_options: capSQLiteOptions): Promise<void> { throw new Error('Method not implemented.'); }
  async echo(options: capEchoOptions): Promise<capEchoResult> { return options; }

  async createConnection(options: capSQLiteOptions): Promise<void> {
    const idb = localForage.createInstance({ name: 'sqliteStore', storeName: 'databases' });
    const keys = await idb.keys();
    if (!keys.includes(options.database!)) this.dbs[options.database!] = (new this.SQL.Database());
  }

  async open(_options: capSQLiteOptions): Promise<void> { return; }
  async closeConnection(options: capSQLiteOptions): Promise<void> { this.dbs[options.database!].close(); }
  async getVersion(_options: capSQLiteOptions): Promise<capVersionResult> { throw new Error('Method not implemented.'); }
  async checkConnectionsConsistency(_options: capAllConnectionsOptions): Promise<capSQLiteResult> { return { result: true }; }
  async close(options: capSQLiteOptions): Promise<void> { this.dbs[options.database!].close(); }
  async getTableList(_options: capSQLiteOptions): Promise<capSQLiteValues> { throw new Error('Method not implemented.'); }

  async execute(options: capSQLiteExecuteOptions): Promise<capSQLiteChanges> {
    const db = this.dbs[options.database!];
    const result: capSQLiteChanges = { changes: { changes: 0, lastId: 0 } };
    for (const s of options.statements!) {
      result.changes = { changes: (db.exec(s)).length, lastId: 0 };
    }
    return result;
  }

  async executeSet(options: capSQLiteSetOptions): Promise<capSQLiteChanges> {
    const db = this.dbs[options.database!]
    let currentSet = {};
    try {
      for (const s of options.set!) {
        currentSet = s;
        const stmt = db.prepare(s.statement!);
        stmt.get(...(s.values ?? [])); //this seems wrong - reassigning result.changes. But the interface returns only a single on, and the type only have a single `changes` not an array
      }
      currentSet = {};
      return { changes: { changes: 0, lastId: 0 } };
    } catch (error) {
      throw new Error((error as { message: string; }).message + ' ' + JSON.stringify(currentSet));
    }
  }

  async run(options: capSQLiteRunOptions): Promise<capSQLiteChanges> { return this.executeSet({ ...options, set: [{ statement: options.statement, values: options.values }] }); }
  async query(options: capSQLiteQueryOptions): Promise<capSQLiteValues> {
    const db = this.dbs[options.database!];
    const result: capSQLiteValues = { values: [] };
    const stmt = db.prepare(options.statement!);
    result.values!.push(stmt.get(options.values));
    return result;
  }
  async isDBExists(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isDBOpen(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isDatabase(_options: capSQLiteOptions): Promise<capSQLiteResult> { throw new Error('Method not implemented.'); }
  async isTableExists(options: capSQLiteTableOptions): Promise<capSQLiteResult> { return { result: (await this.query({ ...options, statement: "SELECT name FROM sqlite_master WHERE type='table' AND name=?;", values: [options.database!] })).values!.length > 0 }; }
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
