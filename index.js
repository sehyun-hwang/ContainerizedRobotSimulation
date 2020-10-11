window.debug = {};
window.requirejs.config({
    // urlArgs: "bust=" + (new Date()).getTime(),
    baseUrl: document.head.querySelector('base').href + 'js',
    paths: {
        State: '../vendor/state/State',
        Kinematic: 'InverseKinematic'
    },
});

export let Socket;

new Promise(resolve => window.require(['Hmi'], Hmi => {
        new Hmi();
        resolve();
    })).then(() =>
        import('./Robot.js?' + Math.random()))
    .then(Module => {
        Socket = Module.Socket
        return import('./Docker.js?' + Math.random())
    }).then();

const Console = document.querySelector('.Console');
console.log({ Console });

export function Log(...args) {
    console.log(...args);

    const p = document.createElement("p");
    args.forEach(x => p.innerText += JSON.stringify(x) + ' ');
    const { children } = Console;
    children.length > 100 && children[1].remove();
    Console.appendChild(p);

    const Height = p.clientHeight;
    if(Math.ceil(Console.scrollHeight - Console.scrollTop) > Console.clientHeight + Height)
        Console.scrollTop += 2 * Height;
}
