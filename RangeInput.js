import 'https://www.hwangsehyun.com/utils/Accordion.js';
import { OnResize } from './three.js';

let UI;
export default new Promise(resolve => UI = resolve);

const Checkboxes = [];

window.addEventListener('DOMContentLoaded', () => UI(Array.prototype.map.call(document.querySelectorAll('accordion-shadow'), ({ shadowRoot }) => {
        const Ranges = shadowRoot.querySelectorAll('input[type="range"]');

        Ranges.forEach(x => {
            const Wrapper = document.createElement('div');
            const Output = document.createElement('output');

            x.classList.add('w-full', 'mb-5');
            Output.classList.add('float-right');

            Wrapper.appendChild(x.previousElementSibling);
            x.replaceWith(Wrapper);
            Wrapper.appendChild(Output);
            Wrapper.appendChild(x);

            const OnInput = () => Output.value = x.value;
            OnInput();
            x.oninput = OnInput;
        });

        Checkboxes.push(shadowRoot.querySelector('input[type="checkbox"]'));
        return [...Ranges, ...shadowRoot.querySelectorAll('select')];
    }).flat()
    .reduce((accum, cur) => {
        accum[cur.id] = cur;
        return accum;
    }, {})));



class AngleInput extends HTMLElement {
    constructor() {
        super();
        this.classList.add('default-input', 'block');
        window.AngleInput(this);
    }
}


customElements.define('angle-input', AngleInput);


{

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

    function UIMode(delta = 0) {
        mode += delta;
        LastButtonStyle.display = mode === 2 ? 'none' : 'unset';
        mode === 2 && Checkboxes.forEach(x => x.checked = true);

        console.log({ mode });
        Functions[mode]();
        OnResize();
    }

    UIMode();
    Object.assign(window, { UIMode });

}
