import Storage from 'https://www.hwangsehyun.com/utils/Storage.js';
export { Storage };

const Console = document.querySelector('.Console');
console.log({ Console });

Array.prototype.Between = function () {
    const arr = [];
    for (let i = 0; i < this.length - 1; i++)
        arr.push([this[i], this[i + 1]]);
    return arr;
};

Math.Clip = (num, min, max) => {
    if (min > max)
        throw new RangeError(`min(${min}) is bigger than max(${max})`);
    return num <= min ? min : num >= max ? max : num;
};

export function Log(...args) {
    console.log(...args);

    const p = document.createElement("p");

    args.forEach(x => p.innerText += (typeof x === 'string' ? x : JSON.stringify(x, (key, value) => {
        try {
            switch (typeof value) {
            case 'number':
                return Number(value.toPrecision(4));
            }
        }
        catch (error) {
            console.warn(error);
        }
        return value;
    })) + ' ');

    const { children } = Console;
    children.length > 100 && children[1].remove();
    Console.appendChild(p);

    const Height = p.clientHeight;
    if (Math.ceil(Console.scrollHeight - Console.scrollTop) > Console.clientHeight + Height)
        Console.scrollTop += 2 * Height;
}

export const RandomColor = () => '#' + Array(3).fill().map(() => Math.floor(Math.random() * 0x80 + 0x80).toString(16)).join('').toUpperCase();
