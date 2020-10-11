import { openDB, deleteDB, wrap, unwrap } from 'https://unpkg.com/idb?module';

const store = "Emotiv";

async function main(upgrade) {
    upgrade && deleteDB(store);

    const db = await openDB(store, 1, {
        upgrade
    });

    return () => db.transaction(store, 'readwrite');
}

export const Reuse = () => main();

export const Fresh = () => main(db => {
    const Store = db.createObjectStore(store, {
        keyPath: "timestamp",
        autoIncrement: true,
    });

    Store.createIndex("timestamp", "timestamp");
    Store.createIndex('name', 'name');
    Store.createIndex('mot', 'mot');
    Store.createIndex("met", "met");
}, );
