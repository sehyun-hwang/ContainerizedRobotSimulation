import { Log, Storage, } from './utils.js';

import { Arm, Target, ArmSpeed, ToggleVisual as _ToggleVisual } from './Arm.js';
import Docker, { Handler as DockerHandler, Reset as DockerReset, Endpoint } from './Docker.js';
//import DistanceSensor from './DistanceSensor.js';
import { Meters } from './Controller.js';
import { init as Wasm_init, Random } from './wasm.js';
import UI, { Handlers as UIHandlers, EndpointsInit, StdDev } from './UI.js';
//import { OnIdChange, IDBinit, IDBDelete, IDBUpload } from './IndexedDB.js';

//import { CannonSpeed, Changed, Cannonx, CannonObject } from './cannon.js';

//import Emotiv from './Emotiv/export.js'
//Emotiv(Angles => renderer.domElement.addEventListener('Render', () => arm.Angles(Angles), { once: true }))

import OBJLoader from './OBJLoader.js';

const DEMENTION_3D = true;

const Axes = document.querySelector("#Axes");
console.log(Axes);

const storage = new Storage('Arm');

let cannon, arm, state;

function Render(lengths) {
    console.log('Render');

    const Axis = Axes.lastElementChild;
    Axes.innerHTML = '';
    Axes.appendChild(Axis);

    lengths.forEach((x, i) => {
        const Cloned = Axis.cloneNode(true);
        Cloned.querySelector('button').innerText = 'Remove Axis ' + (i + 1);
        Cloned.querySelector('input').value = x;
        Axes.insertBefore(Cloned, Axis);
    });

    Meters(Axes.querySelectorAll('meter'));
}

const State = {

    Target(Coordinates) {
        return [...arm.target, ...Coordinates];
    },

    Manipulation(Coordinates) {
        if (!cannon)
            return console.warn('cannon === undefined');

        return [
            ...cannon.CannonRotation,
            ...Coordinates
        ];
    },

    DistanceSensor(Coordinates) {
        return [
            ...DistanceSensor(Coordinates.slice(-4, -2)),
            ...arm.target
        ]
    },

};

function OnRender() {
    Log('arm OnRender');
    const Coordinates = arm.Nodes.slice(1).map(x => x.toArray().slice(0, DEMENTION_3D ? 3 : 2)).flat();

    state = State.Target(Coordinates);
    Log({ state });

    Object.assign(arm, { Coordinates });

    if (!cannon)
        return typeof Changed === 'undefined' || console.warn('cannon is', undefined);

    let promise = Changed();
    if (promise)
        promise = promise.then(() => {
            const { Nodes } = arm;
            cannon.position.copy(Nodes[Nodes.length - 1]);
        });
    else {
        promise = Promise.resolve();
        console.warn('Changed returned', undefined);
    }
    promise.finally(() => arm.Emit('Resume'));

}


function UpdateArm(element) {
    console.log("UpdateArm");

    const Add = element && element.parentNode.lastElementChild === element;
    element && !Add && element.remove();

    const lengths = Array.prototype.map.call(Axes.querySelectorAll('input[name="length"]'), ({ valueAsNumber }) => valueAsNumber);
    Add || lengths.pop();
    Log({ lengths });
    storage.Set(lengths);
    element && Render(lengths);

    const rotations = Array.prototype.map.call(Axes.querySelectorAll('angle-input input'), ({ value }) => Number(value));
    Log({ lengths, rotations });

    arm && arm.Dispose();
    arm = new Arm(lengths, rotations);

    try {
        OnRender();
    }
    catch (error) {
        console.warn(error);
    }
    arm.On('Render', OnRender);

    return typeof OnIdChange === 'undefined' ? Promise.resolve() : OnIdChange(arm, () => state);
    //.then(arm.Render.bind(arm));

}

const MathRandom = () => Math.random() * 2 - 1;
async function Test() {
    console.log('Test');
    const promise = cannon && new Promise(resolve => arm.On('Resume', resolve));
    await arm.Angles(Array(5).fill(0).map(MathRandom));
    await promise;
    Test();
}
//setTimeout(Test, 1000);

export const Angles = (...args) => arm.Angles(...args);

const Reward = () => 0.1 - Target.position.distanceTo(arm.LastNode);
let Last = 0;

function Reward2() {
    const [z] = cannon.CannonRotation;
    const reward = Last - z;
    Last = z;

    if (Math.abs(reward) < .001)
        return arm.LastNode.x / 10;

    return reward;
}

let Break, actionPerStep = 1;

function EmitFactory(socket) {
    const Emit = socket.emit.bind(socket, 'Container');
    const EmitPromise = (...args) => {
        const [event] = args;
        console.log(event, args);

        let Handler;
        const promise = new Promise((resolve, reject) => {
            Handler = data => {
                if (data.error) {
                    reject(data.error);
                    setTimeout(() => console.error(data.stack), 0);
                }
                else
                    resolve(data);
            };

            socket.once(event, Handler);
            Emit(...args);
        });

        return Promise.race([
                promise,
                new Promise((resolve, reject) => setTimeout(reject, 30000)),
            ])
            .catch(console.log)
            .finally(() => socket.off(event, Handler));
    };

    return [Emit, EmitPromise];
}

async function Ep(Emit, EmitPromise, stddev = StdDev()) {
    const last_state = state;

    let angles = await EmitPromise('model', 'choose_action', state);
    angles = Random(angles, stddev)
        .map(x => Math.Clip(x, -1, 1));

    const reward = Reward();

    if (reward > 0)
        return [undefined, reward, ];

    for (let i = 0; i < actionPerStep; i++) {
        const promise = cannon && new Promise(resolve => arm.On('Resume', resolve));
        await arm.Angles(angles);
        await promise;
    }

    const obj = {
        last_state,
        angles,
        reward,
        next_state: state,
    };
    Log('angles', angles, obj);

    Emit('model', 'store_transition', ...Object.values(obj));

    stddev = await EmitPromise('Learn', stddev);
    Log({ stddev });
    return [StdDev(stddev), reward];
}


async function main(socket) {
    if (!socket)
        return;
    Break = false;

    Log('Handler attatched to socket');
    //return;

    await new Promise(resolve => socket.once('ContainerConnect', resolve));
    Log('ContainerConnect');

    await Wasm_init(arm.lengths.length);
    const EpBinded = Ep.bind(undefined, ...EmitFactory(socket));
    const errors = [];

    let steps = 0;
    for (let ep = 0;; ep++) {
        let stddev;

        arm.Reset();

        let step;
        let rewards = 0;

        for (step = 0; step < 300; step++) {
            if (Break) {
                Break = false;
                return;
            }
            Log({ ep, step, steps });
            steps++;

            try {
                const [_stddev, reward] = await EpBinded(stddev);
                rewards += reward;
                if (!_stddev)
                    break;
                stddev = _stddev;
            }
            catch (error) {
                console.warn(error);
                if (errors.includes(error)) {
                    console.error('Terminating due to a reoccurring error');
                    return;
                }
                error && errors.push(error);

                arm.Reset();
                console.log('Retrying a new ep');
                ep--;
                break;
            }

            //await new Promise(resolve => setTimeout(resolve, 10));

        }

        Result.Steps.push(step);
        Result.Rewards.push(rewards);

    }

    socket.close();
}

function Result() {
    const { Steps, Rewards } = Result;
    Log('Steps', Steps);
    Log('Rewards', Rewards);

    const Zipped = Steps.map(function(x, i) {
        return [x, Rewards[i]];
    });

    Log(Zipped);
    localStorage.setItem('Result', JSON.stringify(Zipped));
}


UI.then(UI => ({
        UI,
        Steps: 0,

        UpdateArm,
        Reward,
        IDBUpload: typeof IDBUpload === 'undefined' || IDBUpload,

        OBJLoader: Path => OBJLoader(Path, UI.ObjFaces.value).then(object => CannonObject(object)),

        Run: () => {
            const Options = {
                Actions: arm.lengths.length,
                States: state.length
            };
            Log('Options', Options);
            Docker(Options)
                .then(main);
        },

        Resume: () => DockerHandler().then(main),

        Reset: () => {
            Break = true;
            window.Steps = 0;
            DockerReset();
            arm.Reset();
        },

        Result: Object.assign(Result, { Steps: [], Rewards: [], }),

    })).then(obj => {
        console.log(obj);
        Object.assign(window, obj);
        return EndpointsInit(obj.UI.Endpoint);
    })

    .then(Endpoint)

    .catch(console.error);

{
    const ToggleVisual = bool => {
        console.log('ToggleVisual', bool);
        arm.Dispose();
        _ToggleVisual(bool);
        UpdateArm();
    };

    const ActionPerStep = _actionPerStep => actionPerStep = _actionPerStep;

    UIHandlers([
        () => ({ Endpoint }),
        () => ({ ToggleVisual }),
        () => ({ ActionPerStep }),
        () => ({ ArmSpeed }),
        () => ({ CannonSpeed }),
        () => ({ Cannonx }),
        () => ({ CannonObject }),
    ]);
}


window.addEventListener('DOMContentLoaded', async function() {
    Render(storage.Get() || [1, 1, 1]);

    //IDBDelete();
    typeof IDBinit === 'undefined' || await IDBinit().then(() => Log('IDB Initialized'));

    (typeof CannonObject === 'undefined' ? Promise.resolve() : CannonObject().then(_cannon => cannon = _cannon))

    .then((promise = UpdateArm()) => promise.then(DockerHandler)
        .then(main)
        .catch(error => {
            console.log(error);
            return promise;
        }));
});
