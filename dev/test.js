"use strict";

import idb from "/src/idb.js";

//tests
(async function() {
    const compatreArrays = function(arr1, arr2) {
        return JSON.stringify(arr1) === JSON.stringify(arr2);
    };
    const createRandomString = function(length=10) {
        let result = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    };
    
    
    const dbName = "db_name";
    const tableName = "table_name";

    const rowKey = "1";
    const rowValue = "1_val";
    const rowKey2 = "2";
    const rowValue2 = "2_val";

    //test database actions
    let dbList, db, tableList, table, rowList;
    
    
    //test database creation
    db = await idb.DatabaseSet(dbName);
    db.close();
    dbList = await idb.DatabaseKeys();
    console.log(dbList)
    if (dbList.includes(dbName) === false) {
        throw new Error("Unexpected");
    }

    
    //test storage clear
    await idb.StorageClear();
    dbList = await idb.DatabaseKeys();
    if (dbList.includes(dbName) === true) {
        throw new Error("Unexpected");
    }

    
    //test database delete
    db = await idb.DatabaseSet(dbName);
    db.close();
    await idb.DatabaseDel(dbName);
    if (dbList.includes(dbName) === true) {
        throw new Error("Unexpected");
    }


    //test database get
    db = await idb.DatabaseSet(dbName);
    db.close();
    db = await idb.DatabaseGet(dbName);
    db.close();


    //table operations test

    //test table creation
    await idb.TableSet(dbName, tableName);
    db = await idb.DatabaseGet(dbName);
    tableList = idb.TableKeys(db);
    if (tableList.includes(tableName) === false) {
        throw new Error("Unexpected");
    }
    db.close();


    //test table delete
    await idb.TableDel(dbName, tableName);
    db = await idb.DatabaseGet(dbName);
    tableList = idb.TableKeys(db);
    if (tableList.includes(tableName) === true) {
        throw new Error("Unexpected");
    }
    db.close();
    


    //test table delete all table
    await idb.TableSet(dbName, tableName);
    await idb.DatabaseClear(dbName);
    db = await idb.DatabaseGet(dbName);
    tableList = idb.TableKeys(db);
    if (tableList.includes(tableName) === true) {
        throw new Error("Unexpected");
    }
    db.close();


    //test row operations
    await idb.TableSet(dbName, tableName);

    db = await idb.DatabaseGet(dbName);
    table = idb.TableGet(db, tableName);
    console.log(table)

    rowList = await idb.RowGet(table, [rowKey, rowKey2]);
    if (compatreArrays(rowList, [undefined, undefined]) === false) {
        throw new Error("Unexpected");
    }

    rowList = await idb.RowGet(table, [[rowKey, rowValue], [rowKey2, rowValue2]]);
    if (compatreArrays(rowList, [rowValue, rowValue2]) === false) {
        throw new Error("Unexpected");
    }

    await idb.RowSet(table, [[rowKey, rowValue], [rowKey2, rowValue2]]);

    rowList = await idb.RowGet(table, [rowKey, rowKey2]);
    if (compatreArrays(rowList, [rowValue, rowValue2]) === false) {
        throw new Error("Unexpected");
    }

    rowList = await idb.RowKeys(table);
    if (compatreArrays(rowList, [rowKey, rowKey2]) === false) {
        throw new Error("Unexpected");
    }

    rowList = await idb.RowValues(table);
    if (compatreArrays(rowList, [rowValue, rowValue2]) === false) {
        throw new Error("Unexpected");
    }

    rowList = await idb.RowEntries(table);
    if (compatreArrays(rowList, [[rowKey, rowValue], [rowKey2, rowValue2]]) === false) {
        throw new Error("Unexpected");
    }

    rowList = await idb.RowCount(table);
    if (rowList !== 2) {
        throw new Error("Unexpected");
    }


    await idb.RowDel(table, [rowKey2]);
    rowList = await idb.RowKeys(table);
    if (compatreArrays(rowList, [rowKey]) === false) {
        throw new Error("Unexpected");
    }


    await idb.RowUpdate(table, [[rowKey, function(str) {return str+"as"}]])
    rowList = await idb.RowGet(table, [rowKey]);
    if (compatreArrays(rowList, [rowValue+"as"]) === false) {
        throw new Error("Unexpected");
    }


    await idb.TableClear(table);
    rowList = await idb.RowCount(table);
    if (rowList !== 0) {
        throw new Error("Unexpected");
    }

    db.close();


    console.log("All tests passed!");
return;


{
    await idb.StorageClear();   // clear all database (unstable in firefox)
    await idb.DatabaseKeys();   // list exist databases in array e.g. ["my_db", "my_database"]
    await idb.DatabaseDel("my_database"); //delete database (only if database not opened)
    
    let db = await idb.DatabaseGet("my_database");   //create and get a database object
    db.close(); //close database
    const db2 = await idb.DatabaseSet("my_database");   //create and get a database object same as 'DatabaseGet'
    db2.close(); //close database

    await idb.DatabaseClear("my_database");     // clear all table and data in database (only if database not opened)
    await idb.TableDel("my_database", "my_table");  // delete table and data in database (only if database not opened)
    await idb.TableSet("my_database", "my_table");  // create table in database (only if database not opened)
   

    db = await idb.DatabaseGet("my_database");   //create and get a database object

    idb.TableKeys(db);  // list exist tables in database e.g. ["my_table1", "my_table2"]
    const table = idb.TableGet(db, "my_table");   // get exist tables in database and return table object
    console.log(table);  // table object, you can use it to do the next operations

    await idb.TableClear(table);  //clear every row in table (table object the input param)

    // for query see more: https://developer.mozilla.org/en-US/docs/Web/API/IDBKeyRange
    const query = IDBKeyRange.bound(0, 100);

    let res;
    res = await idb.RowKeys(table, 0, Infinity, query);     //return the keys in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a list e.g. ["key1", "key2"]
    res = await idb.RowValues(table, 0, Infinity, query);   //return the values in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a list e.g. ["value1", "value2"]
    res = await idb.RowEntries(table, 0, Infinity, query);  //return the key and value pair in table, optional can set <start, length, query> params, query for condition, start and length can used for smaller lists. result will be a 2 element list in list e.g. [["key1", "value1"], ["key2", "value2"]]
    res = await idb.RowCount(table);  //return the number of rows in table


    res = await idb.RowGet(table, ["key1", "key2"]);    //search the value of the keys and return in list (undefined if not exist) e.g. ["value1", undefined]
    res = await idb.RowGet(table, [["key1", "default1"], ["key2", "default2"]]);   //search the value of the keys and return in list (but return 2nd value in list if not exist) e.g. ["value1", "default2"]
    res = await idb.RowSet(table, [["key1", "value1"], ["key2", "value2"]]);   //set the key-value pairs in table
    res = await idb.RowDel(table, ["key1", "key2"]);   //delete rows by the key
    res = await idb.RowUpdate(table, [["key1", function(val) { return val+1;}], ["key2", function(val) { return val+1;}]]); // update the values in key, same as 'RowSet' but in the value field you need pass a function that get the current value in parameter
}
return;
    console.log(await idb.RowKeys(table));
    console.log(await idb.RowValues(table));
    console.log(await idb.RowEntries(table));
    console.log(await idb.RowCount(table));

    console.log();
    console.log(await idb.RowGet(table, [["aaa2", "aaa_val"], ["bbb", "bbb_val"]]));
    console.log(await idb.RowSet(table, [["aaa3", "aaa_val"], ["bbb3", "bbb_val"]]));
    console.log(await idb.RowGet(table, [["aaa2"], ["bbb"]]));
    console.log(await idb.RowDel(table, ["aaa2", "bbb_val"]));
    console.log(await idb.RowUpdate(table, [["aaa3", function(str) {return str+"as"}]]));
    console.log(await idb.RowUpdate(table, [["aaa3", function(str) {return str+"as"}]]));

})();