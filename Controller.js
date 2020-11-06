import { Log } from './utils.js';
import { Angles } from './index.js';

const element = document.querySelector('#Controls');
const Title = element.querySelector('h1');
const Buttons = element.querySelector('#Buttons');

let Meters;
const _Meters = _Meters => Meters = _Meters;
export { _Meters as Meters };

const axes = '0 1 5 6'.split(' ');


let Last = [];
let Disconnected;

function Gamepad() {
    Disconnected || requestAnimationFrame(Gamepad);

    const [gamepad] = navigator.getGamepads();
    gamepad.buttons.forEach(({ pressed }, i) =>
        Buttons.childNodes[i].classList[pressed ? 'add' : 'remove']('bg-yellow-500'));

    //console.log(gamepad.axes);
    const Angles = axes.reduce((accum, cur, i) => {
        let Axis = gamepad.axes[cur];
        if (i === 3)
            Axis = (1 - Axis) / 2;
        const element = Meters[i];

        element.value = Axis.toFixed(4);
        accum.push(Axis);
        return accum;
    }, []);

    if (!Angles().every((x, i) => Last[i] === x)) {
        Last = Angles;
    }
}


window.addEventListener("gamepadconnected", ({ gamepad }) => {
    console.log(gamepad);
    Title.innerText = gamepad.id;

    gamepad.buttons.forEach((x, i) => {
        const span = document.createElement("span");
        span.innerText = i + ' ';
        Buttons.appendChild(span);
    });

    Gamepad();
    window.addEventListener("gamepadconnected", Gamepad);
}, { once: true });

window.addEventListener("gamepaddisconnected", () => Disconnected = true);

const Pressed = new Map();

//'keydown keyup'.split(' ').forEach(x => window[x] = event =>
//'INPUT TEXTAREA'.split(' ').includes(event.target.nodeName) && event.stopPropagation());

window.addEventListener("keydown", ({ key }) => {
    const Up = 'qwertyuiop['.indexOf(key);
    const Down = 'asdfghjkl;'.indexOf(key);
    const Index = [Up, Down].find(x => x >= 0);
    if (Index === undefined) return;

    if (!Pressed.has(key)) {
        const Axis = Meters[Index];
        Axis.value = Axis[Up < 0 ? 'min' : 'max'];
        Pressed.set(key, Axis);
    }

    console.log(key);
    Angles(Array.prototype.map.call(Meters, x => x.value));
});

window.addEventListener("keyup", ({ key }) => {
    if (!Pressed.has(key)) return;
    const Axis = Pressed.get(key);
    Axis.value = (Axis.min + Axis.max) / 2;
    Pressed.delete(key);
});
