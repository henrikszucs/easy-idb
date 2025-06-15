# easy-idb

JavaScript library that provide high level and easy to use async API to the IndexedDB feaure.

## Install

Copy and import the following file:

[./src/idb.js](./src/idb.js)

## Usage
### Import
```js
import idb from "/src/idb.js";
```

### Database actions
```js
TableKeys
await idb.StorageClear();   // clear all database (unstable in firefox)
await idb.DatabaseKeys();   // list exist databases in array e.g. ["my_db", "my_database"]
await idb.DatabaseDel("my_database"); //delete database (only if database not opened)

const db = await idb.DatabaseGet("my_database");   //create and get a database object
db.close(); //close database
const db2 = await idb.DatabaseSet("my_database");   //create and get a database object same as 'DatabaseGet'
db2.close(); //close database

//use opened db object as database

```


### Table actions
```js

await idb.DatabaseClear("my_database");         // clear all table and data in database (only if database not opened)
await idb.TableSet("my_database", "my_table");  // create table in database (only if database not opened)
await idb.TableDel("my_database", "my_table");  // delete table and data in database (only if database not opened)


idb.TableKeys(db);  // list exist tables in database e.g. ["my_table1", "my_table2"]
const table = idb.TableGet(db, "my_table1");   // get exist tables in database and return table object
table.transaction.abort();          // close table if need
table.transaction.db.close()        // close table and database from table
```

### Row actions
```js
await idb.TableClear(table);  //clear every row in table (table object the input param)

// for query see more: https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
const query = IDBKeyRange.bound(0, 100);

let res;
await idb.RowKeys(table, 0, Infinity, query);     //return the keys in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a list e.g. ["key1", "key2"]
await idb.RowValues(table, 0, Infinity, query);   //return the values in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a list e.g. ["value1", "value2"]
await idb.RowEntries(table, 0, Infinity, query);  //return the key and value pair in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a 2 element list in list e.g. [["key1", "value1"], ["key2", "value2"]]
await idb.RowCount(table);  //return the number of rows in table


await idb.RowGet(table, ["key1", "key2"]);    //search the value of the keys and return in list (undefined if not exist) e.g. ["value1", undefined]
await idb.RowGet(table, [["key1", "default1"], ["key2", "default2"]]);   //search the value of the keys and return in list (but return 2nd value in list if not exist) e.g. ["value1", "default2"]
await idb.RowSet(table, [["key1", "value1"], ["key2", "value2"]]);   //set the key-value pairs in table
await idb.RowDel(table, ["key1", "key2"]);   //delete rows by the key
await idb.RowUpdate(table, [["key1", function(val) { return val+1;}], ["key2", function(val) { return val+1;}]]); // update the values in key, same as 'RowSet' but in the value field you need pass a function that get the current value in parameter
//
```

### Notes
Database
    - List Databases not work in firefox,
    - Any search/get/delete on non-exist database will create a new one.
    - After get Database object use close() to finish database. (IDBDatabase.close())
Table
    - Cannot create/delete table in opened database, use run IDBObjectStore.transaction.db.close() to close
    - After get Table object use close() to finish connection IDBObjectStore.transaction.abort() for all IDBObjectStore.transaction.db.close()
    - Delete Table close parent Database
