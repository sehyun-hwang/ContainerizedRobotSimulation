import { Log, Storage } from './utils.js';
import { Arm, Target, ArmSpeed } from './Arm.js';
import Docker, { Handler as DockerHandler, Reset as DockerReset } from './Docker.js';
//import DistanceSensor from './DistanceSensor.js';
import { Meters } from './Controller.js';
import { init as Wasm_init, Random } from './wasm.js';
import UI, { Handlers as UIHandlers } from './UI.js';
//import { CannonSpeed, Changed, Cannonx, CannonObject } from './cannon.js';

//import Emotiv from './Emotiv/export.js'
//Emotiv(Angles => renderer.domElement.addEventListener('Render', () => arm.Angles(Angles), { once: true }))

import OBJLoader from './OBJLoader.js';

const STDDEV = 2.5;

const Axes = document.querySelector("#Axes");
console.log(Axes);

const storage = new Storage('Arm');

let cannon, arm, state;

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

const State = (class {

    Coordinates(Coordinates) {
        return Coordinates
    }

    DistanceSensor(Coordinates) {
        return [
            ...DistanceSensor(Coordinates.slice(-4, -2)),
            ...arm.target
        ]
    }

    Manipulation(Coordinates) {

    }

}).prototype;

function UpdateArm(element) {
    console.log("UpdateArm");

    const Add = element && element.parentNode.lastElementChild === element;
    element && !Add && element.remove();

    const lengths = Array.prototype.map.call(Axes.querySelectorAll('input[name="length"]'), ({ value }) => Number(value));
    Add || lengths.pop();
    Log({ lengths });
    storage.Set(lengths);
    element && Render(lengths);

    arm && arm.Dispose();
    arm = new Arm(lengths);

    arm.On('Render', function () {
        console.log('arm OnRender');
        const Coordinates = [...arm.Nodes.slice(1)
            .map(x => x.toArray().slice(0, 2)).flat(),
            ...arm.target
        ];

        state = State.Coordinates(Coordinates);
        Log({ state });

        Object.assign(arm, { Coordinates });

        if (cannon) {
            const { Nodes } = arm;
            Changed()
                .then(() => {
                    cannon.position.copy(Nodes[Nodes.length - 1])
                    console.log(cannon.position)
                });
        }
    });

    return arm.Render();
}

//setInterval(() => arm.Angles([1, 2, -1]), 1000);

export const Angles = (...args) => arm.Angles(...args);

function Reward() {
    const { Nodes } = arm;
    return 0.5 - Target.position.distanceTo(Nodes[Nodes.length - 1]);
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
                new Promise((resolve, reject) => setTimeout(reject, 10000))
            ])
            .finally(() => socket.off(event, Handler));
    };

    return [Emit, EmitPromise];
}

async function Ep(Emit, EmitPromise, stddev = STDDEV) {
    const last_state = state;
    //const state=arm.Coorinates;

    let angles = await EmitPromise('model', 'choose_action', state);
    angles = Random(angles, stddev)
        .map(x => Math.Clip(x, -1, 1));

    const reward = Reward();
    if (reward > 0.3)
        return;

    for (let i = 0; i < actionPerStep; i++)
        await arm.Angles(angles);

    const obj = {
        last_state,
        angles,
        reward,
        next_state: state //arm.Coordinates,
    };
    Log({ angles, ...obj });

    Emit('model', 'store_transition', ...Object.values(obj));

    stddev = await EmitPromise('Learn', stddev);
    Log({ stddev });
    return stddev;
}

async function main(socket) {
    if (!socket) return;
    Break = false;

    Log('Handler attatched to socket');

    console.log(state);
    socket.on('ContainerConnect', console.log);
    //return;

    await new Promise(resolve => socket.once('ContainerConnect', resolve));
    Log('ContainerConnect');

    await Wasm_init(arm.lengths.length);
    const EpBinded = Ep.bind(undefined, ...EmitFactory(socket));
    const errors = [];

    for (let ep = 0;; ep++) {
        let stddev;

        arm.Reset();

        for (let step = 0;; step++) {
            if (Break) {
                Break = false;
                return;
            }
            console.log(socket);
            Log({ ep, step });

            try {
                const _stddev = await EpBinded(stddev);
                if (!_stddev)
                    break;
                stddev = _stddev;
            }
            catch (error) {
                console.warn(new Error(error));
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
    }

    socket.close();
}



UI.then(UI => Object.assign(window, {
    UpdateArm,
    Reward,

    Reset: () => {
        Break = true;
        DockerReset();
        arm && arm.Reset();
    },
    Run: () => {
        const Options = {
            ACTIONS: arm.lengths.length,
            STATES: state.length
        };
        Log('Options', Options);
        Docker(Options, UI.Subdomain.value).then(main);
    },

    OBJLoader: Path => OBJLoader(Path, UI.ObjFaces.value).then(object => CannonObject(object)),

}));

{
    const ActionPerStep = _actionPerStep => actionPerStep = _actionPerStep;

    UIHandlers([
        () => ({ ActionPerStep }),
        () => ({ ArmSpeed }),
        () => ({ CannonSpeed }),
        () => ({ Cannonx }),
        () => ({ CannonObject }),
    ])
};

window.addEventListener('DOMContentLoaded', () => {
    Render( //storage.Get() ||
        [1, 1, 1]);

    typeof CannonObject !== 'undefined' &&
        CannonObject().then(_cannon => cannon = _cannon);

    UpdateArm()
        .then(DockerHandler)
        .then(main);
});
