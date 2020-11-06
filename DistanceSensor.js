import { Log, Storage, RandomColor } from './utils.js';
import { THREE, scene } from './three.js';

const storage = new Storage('DistanceSensors');

let sensors;

const DistanceSensors = data => {
    Log('DistanceSensors', data);
    storage.Set(data);
    sensors = data;
};


window.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelector('#DistanceSensors');
    const Parse = () => element.value.trim().split('\n').filter(x => x)
        .map(x => x.trim().split(/[^+-.\w]/).map(Number)
            .filter(x => !isNaN(x)));

    let data = storage.Get();
    if (data)
        element.value = data.reduce((accum, cur) => {
            accum += cur.join(' ') + '\n';
            return accum;
        }, '');
    else
        data = Parse();

    element.addEventListener('change', () => DistanceSensors(Parse()));
    DistanceSensors(data);
});

let Arrows = [];
export default xy => {
    Arrows.forEach(x => {
        x.traverse(({ geometry, material }) => {
            if (!geometry) return;
            geometry.dispose();
            material.dispose();
        });
        scene.remove(x);
    });

    if (!sensors.length) return [];

    const End = new THREE.Vector3(...xy);

    const Distances = sensors.reduce((accum, cur) => {
        const Direction = new THREE.Vector3(...cur).sub(End);
        const length = Direction.length();
        accum.push(length);

        const arrow = new THREE.ArrowHelper(Direction.normalize(), End, length, RandomColor());
        Arrows.push(arrow);
        scene.add(arrow);

        return accum;
    }, []);

    Log('Distances', Distances);
    return Distances;
};
