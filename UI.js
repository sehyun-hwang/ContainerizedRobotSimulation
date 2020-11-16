import 'https://www.hwangsehyun.com/utils/Accordion.js';
import 'https://www.hwangsehyun.com/utils/Toggle.js';
import Mode from './UIMode.js';

let UI;
const promise = new Promise(resolve => UI = resolve);
export default promise;

export const Handlers = handlers => Promise.allSettled(handlers.map(x => Promise.resolve().then(x).catch()))

    .then(x => x.map(({ value }) => value && Object.entries(value)[0])
        .filter(x => x))
    .then(x => Object.fromEntries(x))

    .then(async obj => Object.entries(await promise).forEach(([key, element]) =>
        element.addEventListener(
            element.type === 'input' ? 'input' : 'change',
            ({ target: { value } }) => obj[key](value))
    ));

export const Checkboxes = [];

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

window.addEventListener('DOMContentLoaded', function () {
    const UIMode = Mode.bind(undefined, Checkboxes);
    UIMode();
    Object.assign(window, { UIMode });
});


customElements.define('angle-input', class extends HTMLElement {
    AngleInput = window.AngleInput

    constructor() {
        super();
        this.classList.add('default-input', 'block');
        this.AngleInput(this);
    }
});
