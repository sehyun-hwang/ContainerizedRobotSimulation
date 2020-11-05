import { THREE, scene } from './three.js';
import { Log } from './2d-utils.js';

let speed = 1;

export const ArmSpeed = _speed => speed = _speed;

const DEG2RAD = deg => deg / 180 * Math.PI;
const Random = () => Math.random() * 2 - 1;

export const Target = new THREE.Mesh(
    new THREE.CircleBufferGeometry(0.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(Target);

export class Arm {

    constructor(lengths) {
        this.lengths = lengths;
        this.Reset();

        const geometry = new THREE.Geometry();
        geometry.setFromPoints(this.Nodes);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: 0xffffff
        }));
        scene.add(line);

        Object.assign(this, {
            geometry,
            line,
            Emitter: document.createElement('div'),
        });
    }

    On(...args) {
        this.Emitter.addEventListener(...args);
    }
    Emit({ name }, detail) {
        this.Emitter.dispatchEvent(new CustomEvent(name, { detail }));
        return new Promise(resolve => setTimeout(resolve, 0));
    }


    X = new THREE.Vector3(1);
    Z = new THREE.Vector3(0, 0, 1);

    Render() {
        const { geometry, Nodes } = this;
        geometry.setFromPoints(Nodes);
        geometry.verticesNeedUpdate = true;

        return this.Emit(this.Render, this.Nodes);
    }

    Reset() {
        const r = Math.random(),
            theta = Math.random() * 2 * Math.PI;
        const target = [r * Math.cos(theta), r * Math.sin(theta)];
        Target.position.set(...target, 0);
        Target.verticesNeedUpdate = true;
        Object.assign(this, { target });

        const Nodes = this.lengths.reduce((accum, cur) => {
            accum.push(cur + accum[accum.length - 1]);
            return accum;
        }, [0]);
        Log('Reset', Nodes);

        this.Nodes = Nodes.map(x => new THREE.Vector3(x));
        this.geometry && this.Render();
    }

    State() {
        const prevs = this.Nodes.Between().map(([cur, next]) => next.clone().sub(cur));
        const state = [this.X, ...prevs].Between()
            .reduce((accum, [cur, next]) => {
                const angle = cur.angleTo(next);
                accum.push(angle === Math.PI ? 0 : angle);
                return accum;
            }, []);

        Object.assign(this, { prevs, state });

        return state;
    }

    Angles(angles) {
        if (angles.length < this.lengths.length)
            throw new Error(`length of angles should be >= ${this.lengths.length}. Got ${angles.length}`);
        if (!angles.every(x => typeof x === 'number'))
            throw new Error('angle is not a number: ' + angles);

        Log('state', this.State());
        const { prevs } = this;
        angles = angles.slice(0, this.lengths.length)
            .reduce((accum, cur) => {
                accum.push(cur + (accum[accum.length - 1] || 0));
                return accum;
            }, []);
        //console.log({ prevs, angles });

        this.Nodes = prevs.reduce((accum, cur, i) => {
            accum.push(accum[accum.length - 1].clone()
                .add(cur.applyAxisAngle(this.Z, speed * DEG2RAD(angles[i]))));
            return accum;
        }, [new THREE.Vector3()]);

        return this.Render();
    }

    Dispose() {
        scene.remove(this.line);
        this.Emitter.remove();
    }
}
