"use strict";

//
// Import dependencies
//
// internal dependencies
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import * as fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// third-party dependencies: an in-memory IndexedDB on the global object, as a
// browser has it
import "fake-indexeddb/auto";

// first-party dependencies
import idb from "../src/idb.js";

const require = createRequire(import.meta.url);
const distPath = path.join(import.meta.dirname, "..", "dist");

// The library from database down to row, the same steps dev/test.js runs in a
// browser, and that every prebuilt file in dist exports it - dist is
// committed, so a build that is stale or broken would ship.

const DB_NAME = "db_name";
const TABLE_NAME = "table_name";

// a table of a fresh database holding the given [key, value] rows; the caller
// closes the returned db
const buildTable = async function(entries = []) {
    await idb.StorageClear();
    await idb.TableSet(DB_NAME, TABLE_NAME);
    const db = await idb.DatabaseGet(DB_NAME);
    const table = idb.TableGet(db, TABLE_NAME);
    await idb.RowSet(table, entries);
    return { db, table };
};

test("a database is listed once set, and gone once deleted or the storage cleared", async function() {
    await idb.StorageClear();
    (await idb.DatabaseSet(DB_NAME)).close();
    assert.ok((await idb.DatabaseKeys()).includes(DB_NAME));

    await idb.DatabaseDel(DB_NAME);
    assert.equal((await idb.DatabaseKeys()).includes(DB_NAME), false);

    (await idb.DatabaseSet(DB_NAME)).close();
    await idb.StorageClear();
    assert.deepEqual(await idb.DatabaseKeys(), []);
});

test("tables are created, deleted and cleared from a database", async function() {
    await idb.StorageClear();
    await idb.TableSet(DB_NAME, [TABLE_NAME, "other"]);
    let db = await idb.DatabaseGet(DB_NAME);
    assert.deepEqual(idb.TableKeys(db).sort(), ["other", TABLE_NAME].sort());
    db.close();

    // setting a table that already exists leaves the database as it is
    await idb.TableSet(DB_NAME, TABLE_NAME);
    await idb.TableDel(DB_NAME, "other");
    db = await idb.DatabaseGet(DB_NAME);
    assert.deepEqual(idb.TableKeys(db), [TABLE_NAME]);
    db.close();

    await idb.DatabaseClear(DB_NAME);
    db = await idb.DatabaseGet(DB_NAME);
    assert.deepEqual(idb.TableKeys(db), []);
    assert.equal(idb.TableGet(db, TABLE_NAME), undefined);
    db.close();
});

test("rows are got, defaulted, set, listed, counted, updated and deleted", async function() {
    const { db, table } = await buildTable();

    assert.deepEqual(await idb.RowGet(table, ["1", "2"]), [undefined, undefined]);
    // a [key, default] pair stores the default when the key is missing
    assert.deepEqual(await idb.RowGet(table, [["1", "1_val"], ["2", "2_val"]]), ["1_val", "2_val"]);
    assert.deepEqual(await idb.RowGet(table, [["1", "other"]]), ["1_val"]);

    await idb.RowSet(table, [["3", "3_val"]]);
    assert.deepEqual(await idb.RowKeys(table), ["1", "2", "3"]);
    assert.deepEqual(await idb.RowValues(table), ["1_val", "2_val", "3_val"]);
    assert.deepEqual(await idb.RowEntries(table), [["1", "1_val"], ["2", "2_val"], ["3", "3_val"]]);
    assert.equal(await idb.RowCount(table), 3);

    await idb.RowUpdate(table, [["1", function(value) { return value + "as"; }]]);
    assert.deepEqual(await idb.RowGet(table, ["1"]), ["1_valas"]);

    await idb.RowDel(table, ["2"]);
    assert.deepEqual(await idb.RowKeys(table), ["1", "3"]);

    await idb.TableClear(table);
    assert.equal(await idb.RowCount(table), 0);
    db.close();
});

test("rows are listed from a start, up to a length, and within a key range", async function() {
    const { db, table } = await buildTable([[1, "a"], [2, "b"], [3, "c"], [4, "d"]]);

    assert.deepEqual(await idb.RowKeys(table, 1, 2), [2, 3]);
    assert.deepEqual(await idb.RowValues(table, 0, 2), ["a", "b"]);
    assert.deepEqual(await idb.RowEntries(table, 3), [[4, "d"]]);
    assert.deepEqual(await idb.RowKeys(table, 0, Infinity, IDBKeyRange.bound(2, 3)), [2, 3]);
    // past the end, and on an empty range, nothing is listed
    assert.deepEqual(await idb.RowKeys(table, 10), []);
    assert.deepEqual(await idb.RowValues(table, 0, Infinity, IDBKeyRange.lowerBound(5)), []);
    db.close();
});

test("every file in dist exports the library", async function() {
    const names = Object.keys(idb).sort();
    const check = function(lib, from) {
        assert.deepEqual(Object.keys(lib).filter(function(name) { return name !== "default"; }).sort(), names, from);
        for (const name of names) {
            assert.equal(typeof lib[name], "function", from + " " + name);
        }
    };
    for (const file of ["idb.js", "idb.min.js"]) {
        const lib = await import(pathToFileURL(path.join(distPath, file)));
        check(lib, file);
        check(lib.default, file + " default");
    }
    const cjs = require(path.join(distPath, "idb.cjs"));
    check(cjs, "idb.cjs");
    check(cjs.default, "idb.cjs default");

    // the classic script sets the global IDB
    const context = vm.createContext({});
    vm.runInContext(await fs.readFile(path.join(distPath, "idb.iife.min.js"), "utf8"), context);
    check(context.IDB, "idb.iife.min.js");

    // and the built library works, not only loads
    const lib = await import(pathToFileURL(path.join(distPath, "idb.min.js")));
    await lib.StorageClear();
    await lib.TableSet(DB_NAME, TABLE_NAME);
    const db = await lib.DatabaseGet(DB_NAME);
    const table = lib.TableGet(db, TABLE_NAME);
    await lib.RowSet(table, [["k", "v"]]);
    assert.deepEqual(await lib.RowEntries(table), [["k", "v"]]);
    db.close();
});
