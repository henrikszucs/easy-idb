/*! easy-idb v1.0.0 | GPL-2.0 license | https://github.com/henrikszucs/easy-idb */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/idb.js
var idb_exports = {};
__export(idb_exports, {
  DatabaseClear: () => DatabaseClear,
  DatabaseDel: () => DatabaseDel,
  DatabaseGet: () => DatabaseGet,
  DatabaseKeys: () => DatabaseKeys,
  DatabaseSet: () => DatabaseSet,
  RowCount: () => RowCount,
  RowDel: () => RowDel,
  RowEntries: () => RowEntries,
  RowGet: () => RowGet,
  RowKeys: () => RowKeys,
  RowSet: () => RowSet,
  RowUpdate: () => RowUpdate,
  RowValues: () => RowValues,
  StorageClear: () => StorageClear,
  TableClear: () => TableClear,
  TableDel: () => TableDel,
  TableGet: () => TableGet,
  TableKeys: () => TableKeys,
  TableSet: () => TableSet,
  default: () => idb_default
});
module.exports = __toCommonJS(idb_exports);
var promisifyRequest = function(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    request.onabort = request.onerror = function(event) {
      reject(event.target.error);
    };
  });
};
var promisifyRequestLazy = function(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = function(event) {
      resolve(event.target.result);
    };
    request.onabort = request.onerror = function(event) {
      resolve(void 0);
    };
  });
};
var DBOpenRequest = async function(dbName) {
  const DBOpenRequest2 = indexedDB.open(dbName);
  return await promisifyRequest(DBOpenRequest2);
};
var DBModifyRequest = async function(db, tableNames, isCreate = true) {
  const tableNamesModify = [];
  for (const tableName of tableNames) {
    if (isCreate && db.objectStoreNames.contains(tableName)) {
      continue;
    } else if (isCreate === false && db.objectStoreNames.contains(tableName) === false) {
      continue;
    } else {
      tableNamesModify.push(tableName);
    }
  }
  tableNames = tableNamesModify;
  if (tableNames.length === 0) {
    return db;
  }
  const version = db.version;
  const name = db.name;
  db.close();
  const DBOpenRequest2 = indexedDB.open(name, version + 1);
  DBOpenRequest2.blocked = function(event) {
    throw new Error("Something blocked IndexedDB database (" + name + ")");
  };
  DBOpenRequest2.onupgradeneeded = function(event) {
    const db2 = event.target.result;
    if (isCreate === true) {
      for (const tableName of tableNames) {
        db2.createObjectStore(tableName);
      }
    } else {
      for (const tableName of tableNames) {
        db2.deleteObjectStore(tableName);
      }
    }
  };
  return await promisifyRequest(DBOpenRequest2);
};
var DBTableRequest = function(db, tableName) {
  try {
    const table = db.transaction(tableName, "readwrite", {
      "durability": "strict"
    }).objectStore(tableName);
    return table;
  } catch (error) {
    return void 0;
  }
};
var StorageClear = async function() {
  const waits = [];
  const dbs = await indexedDB.databases();
  for (const {
    name
  } of dbs) {
    const DBDeleteRequest = indexedDB.deleteDatabase(name);
    waits.push(promisifyRequest(DBDeleteRequest));
  }
  await Promise.all(waits);
};
var DatabaseKeys = async function() {
  const dbNames = [];
  const dbs = await indexedDB.databases();
  for (const {
    name
  } of dbs) {
    dbNames.push(name);
  }
  return dbNames;
};
var DatabaseGet = async function(dbname) {
  return await DBOpenRequest(dbname);
};
var DatabaseSet = DatabaseGet;
var DatabaseDel = async function(dbName) {
  const DBDeleteRequest = indexedDB.deleteDatabase(dbName);
  await promisifyRequest(DBDeleteRequest);
};
var DatabaseClear = async function(dbName) {
  let db = await DBOpenRequest(dbName);
  const tableNames = [];
  for (const tableName of db.objectStoreNames) {
    tableNames.push(tableName);
  }
  db = await DBModifyRequest(db, tableNames, false);
  db.close();
};
var TableKeys = function(db) {
  const tableNames = [];
  for (const tableName of db.objectStoreNames) {
    tableNames.push(tableName);
  }
  return tableNames;
};
var TableGet = function(db, tableName) {
  return DBTableRequest(db, tableName);
};
var TableSet = async function(dbName, tableName) {
  let db = await DBOpenRequest(dbName);
  let tableNames = [];
  if (typeof tableName === "string") {
    tableNames.push(tableName);
  } else if (tableName instanceof Array) {
    tableNames = tableName;
  }
  db = await DBModifyRequest(db, tableNames, true);
  db.close();
};
var TableDel = async function(dbName, tableName) {
  let db = await DBOpenRequest(dbName);
  let tableNames = [];
  if (typeof tableName === "string") {
    tableNames.push(tableName);
  } else if (tableName instanceof Array) {
    tableNames = tableName;
  }
  db = await DBModifyRequest(db, tableNames, false);
  db.close();
};
var TableClear = async function(table) {
  const request = table.clear();
  await promisifyRequest(request);
};
var RowKeys = async function(table, start = 0, length = Infinity, query = void 0) {
  return await new Promise(function(resolve) {
    const result = [];
    const request = table.openKeyCursor(query);
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor === null) {
        resolve(result);
        return;
      }
      let i = 0;
      if (start === 0) {
        result.push(cursor.key);
        i++;
        cursor.continue();
      } else {
        cursor.advance(start);
      }
      request.onsuccess = function(event2) {
        const cursor2 = event2.target.result;
        if (cursor2 && i < length) {
          result.push(cursor2.key);
          i++;
          cursor2.continue();
        } else {
          resolve(result);
        }
      };
    };
  });
};
var RowValues = async function(table, start = 0, length = Infinity, query = void 0) {
  return await new Promise(function(resolve) {
    const result = [];
    const request = table.openCursor(query);
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor === null) {
        resolve(result);
        return;
      }
      let i = 0;
      if (start === 0) {
        result.push(cursor.value);
        i++;
        cursor.continue();
      } else {
        cursor.advance(start);
      }
      request.onsuccess = function(event2) {
        const cursor2 = event2.target.result;
        if (cursor2 && i < length) {
          result.push(cursor2.value);
          i++;
          cursor2.continue();
        } else {
          resolve(result);
        }
      };
    };
  });
};
var RowEntries = async function(table, start = 0, length = Infinity, query = void 0) {
  return await new Promise(function(resolve) {
    const result = [];
    const request = table.openCursor(query);
    request.onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor === null) {
        resolve(result);
        return;
      }
      let i = 0;
      if (start === 0) {
        result.push([cursor.key, cursor.value]);
        i++;
        cursor.continue();
      } else {
        cursor.advance(start);
      }
      request.onsuccess = function(event2) {
        const cursor2 = event2.target.result;
        if (cursor2 && i < length) {
          result.push([cursor2.key, cursor2.value]);
          i++;
          cursor2.continue();
        } else {
          resolve(result);
        }
      };
    };
  });
};
var RowCount = async function(table) {
  const request = table.count();
  return await promisifyRequest(request);
};
var RowGet = async function(table, entries) {
  const waits = [];
  if (entries?.[0] instanceof Array) {
    for (const [key, value] of entries) {
      const task = new Promise(async function(resolve) {
        const curValue = await promisifyRequestLazy(table.get(key));
        if (typeof curValue === "undefined") {
          await promisifyRequestLazy(table.put(value, key));
          resolve(value);
        } else {
          resolve(curValue);
        }
      });
      waits.push(task);
    }
  } else {
    for (const key of entries) {
      waits.push(promisifyRequestLazy(table.get(key)));
    }
  }
  return await Promise.all(waits);
};
var RowSet = async function(table, entries) {
  const waits = [];
  for (const [key, value] of entries) {
    waits.push(promisifyRequestLazy(table.put(value, key)));
  }
  await Promise.all(waits);
};
var RowDel = async function(table, keys) {
  const waits = [];
  for (const key of keys) {
    waits.push(promisifyRequestLazy(table.delete(key)));
  }
  await Promise.all(waits);
};
var RowUpdate = async function(table, entries) {
  const waits = [];
  for (const [key, value] of entries) {
    const task = new Promise(async function(resolve) {
      const curValue = await promisifyRequestLazy(table.get(key));
      const newValue = value(curValue);
      await promisifyRequestLazy(table.put(newValue, key));
      resolve(void 0);
    });
    waits.push(task);
  }
  await Promise.all(waits);
};
var idb_default = {
  StorageClear,
  DatabaseKeys,
  DatabaseGet,
  DatabaseSet,
  DatabaseDel,
  DatabaseClear,
  TableKeys,
  TableGet,
  TableSet,
  TableDel,
  TableClear,
  RowKeys,
  RowValues,
  RowEntries,
  RowCount,
  RowGet,
  RowSet,
  RowDel,
  RowUpdate
};
