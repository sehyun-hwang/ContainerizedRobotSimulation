import Emotiv from './Emotiv.js';
import { Fresh, Reuse } from './IndexedDB.js';

const element = document.querySelector('#Focused');
console.log(element);

const Range = document.querySelector('input[type="range"]');
const Task = () => setTimeout(function () {
    Range.value = 100 * Math.random();
    Task();
}, 1200 * Math.random());
Task();

let focused;

function Focused(_focused) {
    focused = _focused;
    element.textContent = String(focused);
}
Focused();

window.addEventListener("keydown", ({ key }) => {
    const focused = {
        ArrowUp: true,
        ArrowDown: false,
    }[key];

    focused === undefined || Focused(focused);
});

window.addEventListener("keyup", () => Focused());

const Name = document.querySelector('#Name');
const Emitter = document.createElement('div');

const Log = document.querySelector('#Log');
const OnOff = document.querySelector('#OnOff');

const focuses = [];

Promise.all([
        //Fresh(),
        Reuse(),
        Emotiv(Emitter)
    ])
    .then(([Transaction]) => Emitter.addEventListener('met', ({ detail }) => {
        const focus = detail[9];

        focuses.push(focus);
        const average = focuses.reduce((accum, cur) => accum + (cur || 0), 0) / focuses.length;
        OnOff.value = 100 * focus / average;
        console.log({ focuses, average, focus })
        Log.textContent += focus + ' ';

        if (Focused === undefined) {
            console.log(detail);
            return;
        }

        const obj = {
            name: Name.value,
            timestamp: Date.now(),
            met: detail,
        };

        Transaction().store.add(obj);
    }));
