const store = "Robot";
const IdElement = document.querySelector('#id');

import { openDB, deleteDB, wrap, unwrap } from 'https://unpkg.com/idb/with-async-ittr.js?module';
import { Log } from './utils.js';
import ToArray from './ToArray.js';

let db, id;

const init = () => openDB(store, 1, {
    blocked: console.log,
    blocking: console.log,
    terminated: console.log,

    upgrade(db) {
        const Store = db.createObjectStore(store, {
            keyPath: "timestamp",
        });
        console.log(Store);

        Store.createIndex("timestamp", "timestamp");
        Store.createIndex('id', 'id');
        Store.createIndex('Container', 'Container');
        Store.createIndex("State", "State");
        Store.createIndex("Delta", "Delta");
    }
}).then(_db => {
    db = _db;
    console.log(db);
});


export const OnIdChange = (arm, State) => fetch('https://apigateway.hwangsehyun.com/dynamodb/counter/Robot', {
        method: 'PUT'
    })
    .then(res => res.json())

    .then(data => {
        id = Number(data.Attributes.val.N);
        IdElement.textContent = id;

        arm.On('Render', function () {
            Log('arm OnRender IndexedDB');

            const obj = {
                timestamp: Date.now(),
                id,
                Container: typeof Container === 'undefined' ? undefined : Container(),
                State: State(),
                Delta: arm.VectorToTarget()
            };

            Log('IndexedDB', obj);
            Transaction().store.add(obj);
        });

    })

    .catch(console.error);

const Upload = () => ToArray(Transaction().store.index('id').iterate(id))
    .then(data => {
        Log(data);
        return data;
    })
    .then(JSON.stringify)
    .then(body =>
        fetch(`https://hwangsehyun.s3-ap-southeast-1.amazonaws.com/robot/${id}.json`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "x-amz-acl": "public-read",
            },
            body
        }))

    .then(res => res.ok ? Log(id, 'has been uploaded') : Promise.reject('Upload failed'))
    .catch(console.error);


const Delete = () => deleteDB(store);
const Transaction = () => db.transaction(store, 'readwrite');
export { init as IDBinit, Delete as IDBDelete, Upload as IDBUpload };
