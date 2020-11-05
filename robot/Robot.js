import { Log } from './index.js';

const Initial = [60, -30, 60, 0, 60, 0];
const Objective = [10, 10, 10, 0, 0, 0];
const DEG2RAD = Math.PI / 180;
let Upgrade = false;
//Upgrade = true;
let DocumentHandler;

export const Socket = Promise.all([
        new Promise(resolve => require(["Robot"], resolve)),
        Promise.resolve(localStorage.getItem("DBVersion") || 1)
            .then(Version => {
                Upgrade && Version++;
                console.log({ Upgrade, Version });
                localStorage.setItem("DBVersion", Version);
                return Version;
            }).then(Version => new Promise((resolve, reject) => {
                const store = "customers";
                const request = indexedDB.open("the_name", Version);
                request.onerror = reject;

                request.onupgradeneeded = event => {
                    const db = event.target.result;
                    db.objectStoreNames.contains(store) && db.deleteObjectStore(store);

                    const Store = db.createObjectStore(store, {
                        keyPath: "step",
                        autoIncrement: true,
                    });
                    Store.createIndex("ep", "ep");
                    Store.createIndex("loss", "loss");
                    console.log("Upgraded");
                };
                request.onsuccess = event => resolve(() => event.target.result.transaction(store, "readwrite").objectStore(store));
            }))
    ])

    .then(([Robot, Store]) => {
        function Query() {
            const arr = [];

            Store().index('loss').openCursor().onsuccess = event => {
                const cursor = event.target.result;

                if(cursor) {
                    arr.push(cursor.value);
                    cursor.continue();
                }
                else
                    console.log(JSON.stringify(arr));
            };
        }
        Object.assign(window, { Query });


        setTimeout(() => Robot.dispatch('ROBOT_CHANGE_ANGLES', {
            A0: 0,
            A1: 0,
            A2: 0, //
            A3: 0, //
            A4: 0,
            A5: 0 //
        }), 0);


        let ep = 2,
            angles_prev,
            loss_prev = 0;

        Robot.listen([({ angles, target: { position, rotation } }) => {
            for(let x in rotation)
                rotation[x] = rotation[x] + Math.PI;
            return [Object.values(angles), [position, rotation].map(Object.values).flat()];
        }], ([angles, target]) => {
            if(!angles_prev) {
                angles_prev = angles;
                return;
            }

            const loss = target.map((x, i) => Math.pow(x - Objective[i], 2))
                .reduce((cur, accum) => cur + accum, 0);
            const loss_delta = loss_prev - loss;

            document.dispatchEvent(new CustomEvent('Angles', { detail: angles.map(x => x / DEG2RAD) }));

            const angles_delta = angles.map((x, i) => x - angles_prev[i]);
            let action = angles_delta.reduce((accum, cur, i, arr) => cur > arr[accum] ? i : accum, 0);
            action = (Math.sign(angles_delta[action]) === 1 ? '+' : '-') + action;

            const obj = { ep, target, loss, loss_delta, angles: angles_delta, action };
            Log(obj);
            console.log(obj);

            const request = Store().add(obj);
            //request.onsuccess = event => console.log("primary key", event.target.result);

            angles_prev = angles;
            loss_prev = loss;
        });

        const Action = 3;
        return(function () {
            const Joints = 6;

            let angle;
            const Angle = new Proxy({}, {
                get: function (obj, prop) {
                    return prop === angle[1] ? Number(angle[0] + 1) * 10 : 0;
                }
            });
            const Angles = angles => {
                if(typeof angles === 'string') {
                    angle = angles;
                    angles = Angle;
                    console.log({ angle });
                }
                Robot.dispatch('ROBOT_CHANGE_ANGLES', angles_prev.reduce((accum, cur, i) => {
                    accum['A' + i] = (cur + angles[i]) * DEG2RAD;
                    return accum;
                }, {}));
            };
            Angles(Initial);


            return Upgrade ? (async function () {
                for(let i = 0; i < Math.pow(Action, 6); i++) {
                    const str = '0'.repeat(Joints) + i.toString(3);
                    const arr = Array.prototype.map.call(str.substr(str.length - Joints), x => ({ 0: -20, 1: 0, 2: 20 }[x]));
                    Angles(arr);
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                return Angles;
            })() : Promise.resolve(Angles);
        })();
    })
    .then(Angles => socket => {
        socket.on('Angles', Angles);

        document.removeEventListener('Angles', DocumentHandler);
        DocumentHandler = ({ detail: angles }) => {
            console.log(angles);
            socket.emit('Angles', angles);
        };
        document.addEventListener('Angles', DocumentHandler);

        console.log('Handler attatched to socket');
    })
    .catch(console.error);
