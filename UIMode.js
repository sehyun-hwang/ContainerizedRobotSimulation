import { OnResize } from './three.js';

const element = document.querySelector('#UIMode');
const LastButtonStyle = document.querySelector('#UIModeButtons button:last-child').style;
const Classes = 'absolute w-full h-full'.split(' ');

const Functions = [
    () => document.body.firstElementChild.style.maxHeight = 0,
    () => {
        document.body.firstElementChild.style.maxHeight = 'unset';
        element.classList.add(...Classes);
    },
    () => {
        element.classList.remove(...Classes);
    }
];


let mode = 1;

export default function (Checkboxes, delta = 0) {
    mode += delta;
    LastButtonStyle.display = mode === 2 ? 'none' : 'unset';
    mode === 2 && Checkboxes.forEach(x => x.checked = true);

    console.log({ mode });
    Functions[mode]();
    OnResize();
}
