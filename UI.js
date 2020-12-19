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
            ({ target: { checked, value } }) => obj[key](element.type === 'checkbox' ? checked : value))
    ));

export const Checkboxes = [];

function Range(x) {
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
}


window.addEventListener('DOMContentLoaded', () => UI(Array.prototype.map.call(document.querySelectorAll('accordion-shadow'), ({ shadowRoot }) => {
        Checkboxes.push(shadowRoot.querySelector('input[type="checkbox"]'));
        const Ranges = shadowRoot.querySelectorAll('input[type="range"]');
        Ranges.forEach(Range);

        return [
            ...Ranges,
            ...shadowRoot.querySelectorAll('select'),
            ...document.querySelectorAll('toggle-')
        ];
    }).flat()
    .reduce((accum, cur) => {
        accum[cur.id] = cur;
        return accum;
    }, {})));


window.addEventListener('DOMContentLoaded', function() {
    const UIMode = Mode.bind(undefined, Checkboxes);
    UIMode();
    Object.assign(window, { UIMode });

    document.querySelectorAll('input[type="range"]').forEach(Range);

    customElements.define('angle-input', class extends HTMLElement {
        AngleInput = window.AngleInput

        constructor() {
            super();
            this.classList.add('default-input', 'block');
            this.AngleInput(this);
            const Input = this.querySelector('input');
            Input.removeAttribute('type');
            Input.disabled = true;
            Input.classList.add('w-full', 'text-center', 'mt-12');
            this.addEventListener('change', () => window.UpdateArm());
        }

    });

});

const StdDevElement = document.querySelector('#StdDev') || { valueAsNumber: 3 };
StdDevElement.addEventListener('input', () => StdDevElement.Dirty = true);

export function StdDev(x) {
    if (!x || StdDevElement.Dirty) {
        StdDevElement.Dirty = false;
        return StdDevElement.valueAsNumber;
    }

    StdDevElement.valueAsNumber = x;
    StdDevElement.dispatchEvent(new Event('input', { bubbles: true }));
    return x;
}
