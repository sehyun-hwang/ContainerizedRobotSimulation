import { renderer } from './three.js';
import { Log, Storage } from './2d-utils.js';
import { Arm, Target } from './2d-env.js';
import Docker, { Handler as DockerHandler, Reset as DockerReset } from './2d-Docker.js';
import DistanceSensor from './DistanceSensor.js';
import { Meters } from './Controller.js';
import { init as Wasm_init, Random } from './wasm.js';
import { setX } from './cannon.js';


import Emotiv from './Emotiv/Emotiv.js';
import { Fresh } from './Emotiv/IndexedDB.js';

{
    const DeadZone = .3;
    const Speed = .15;

    let Origin;
    let SetOrigin = true;
    window.EmotivOrigin = () => SetOrigin = true;

    const Emitter = document.createElement('div');

    Promise.all([Fresh(), Emotiv(Emitter)])
        .then(function ([Transaction]) {
            let Angles;

            Emitter.addEventListener('met', ({ detail }) => {
                console.warn(detail);

                /*Transaction().store.add({
                    timestamp: Date.now(),
                    pow: detail,
                });*/

            });

            Emitter.addEventListener('mot', ({ detail }) => {
                //console.warn(detail);
                if (SetOrigin) {
                    Origin = detail;
                    SetOrigin = false;
                }

                detail = detail.map((x, i) => x - Origin[i]);
                const detailAbs = detail.map(Math.abs);
                const Max = Math.max(...detailAbs);
                const Index = detailAbs.indexOf(Max);

                Angles = Array(detail.length).fill(0);
                if (Max > DeadZone) {
                    Angles[Index] = detail[Index] * Speed;
                }

                Log('Emotiv Angle', Angles);
            });

            renderer.domElement.addEventListener('Render', () => arm.Angles(Angles));
        });
}


const STDDEV = 2.5;

const Axes = document.querySelector("#Axes");
console.log(Axes);

const storage = new Storage('Arm');

let arm;

function Render(lengths) {
    console.log('Render', lengths);

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

let State;

function UpdateArm(element) {
    console.log("UpdateArm");

    const Add = element && element.parentNode.lastElementChild === element;
    element && !Add && element.remove();
    const lengths = Array.prototype.map.call(Axes.querySelectorAll('input'), ({ value }) => Number(value));
    Add || lengths.pop();
    console.log(lengths);
    storage.Set(lengths);
    element && Render(lengths);

    arm && arm.Dispose();
    arm = new Arm(lengths);

    arm.On('Render', function () {
        const Coordinates = [...arm.Nodes.slice(1)
            .map(x => x.toArray().slice(0, 2))
            .flat(),
            ...arm.target
        ];

        State = [
            ...DistanceSensor(Coordinates.slice(-4, -2)),
            ...arm.target
        ];

        Object.assign(arm, { Coordinates });
    });

    return arm.Render();
}

//setInterval(() => arm.Angles([1, 2, -1]), 1000);

export const Angles = (...args) => arm.Angles(...args);

function Reward() {
    const { Nodes } = arm;
    return 0.5 - Target.position.distanceTo(Nodes[Nodes.length - 1]);
}

let Break;

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
                new Promise((resolve, reject) => setTimeout(reject, 10000))
            ])
            .finally(() => socket.off(event, Handler));
    };

    return [Emit, EmitPromise];
}

async function Ep(Emit, EmitPromise, stddev = STDDEV) {
    const state = State;
    //const state=arm.Coorinates;

    let angles = await EmitPromise('model', 'choose_action', state);
    angles = Random(angles, stddev)
        .map(x => Math.Clip(x, -1, 1));

    const reward = Reward();
    if (reward > 0.3)
        return;

    await arm.Angles(angles);
    const obj = {
        state,
        angles,
        reward,
        next_state: State //arm.Coordinates,
    };
    Log({ angles, ...obj });

    Emit('model', 'store_transition', ...Object.values(obj));

    stddev = await EmitPromise('Learn', stddev);
    Log({ stddev });
    return stddev;
}

async function main(socket) {
    if (!socket) return;

    Log('Handler attatched to socket');

    console.log(State);
    socket.on('ContainerConnect', console.log);
    //return;

    await new Promise(resolve => socket.once('ContainerConnect', resolve));
    Log('ContainerConnect');

    await Wasm_init(arm.lengths.length);
    const EpBinded = Ep.bind(undefined, ...EmitFactory(socket));

    for (let ep = 0;; ep++) {
        let stddev;

        arm.Reset();

        for (let step = 0;; step++) {
            if (Break) {
                Break = false;
                return;
            }

            Log({ ep, step });

            try {
                const _stddev = await EpBinded(stddev);
                if (!_stddev)
                    break;
                stddev = _stddev;
            }
            catch (error) {
                console.warn(error);
                console.error(new Error(error));
                arm.Reset();
                console.log('Retrying a new ep');
                ep--;
                break;
            }

            //await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}


Object.assign(window, {
    UpdateArm,
    Reward,
    Reset: () => {
        window.Break = true;
        DockerReset();
        arm && arm.Reset();
    },
    Run: () => {
        const Options = {
            ACTIONS: arm.lengths.length,
            STATES: State.length
        };
        Log('Options', Options);
        Docker(Options).then(main);
    },
    setX: x => setX.then(setX => setX(Number(x)))
});


window.addEventListener('DOMContentLoaded', () => {
    Render(storage.Get() || [.5, .5]);

    UpdateArm()
        .then(DockerHandler)
        .then(main);
});
