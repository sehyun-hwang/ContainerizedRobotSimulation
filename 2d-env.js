import { THREE, scene } from './three.js';
import { Log } from './2d-utils.js';


const DEG2RAD = deg => deg / 180 * Math.PI;
const RAD2DEG = rad => rad * 180 / Math.PI;

let speed = DEG2RAD(1);
export const ArmSpeed = _speed => speed = DEG2RAD(_speed);

const Random = () => Math.random() * 2 - 1;

export const Target = new THREE.Mesh(
    new THREE.CircleBufferGeometry(0.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
);
scene.add(Target);

export class Arm {

    constructor(lengths, rotations) {
        const obj = { lengths, rotations };
        Log(obj);
        Object.assign(this, obj)
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
            Arrows: [],
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

        this.state = Array(this.lengths.length).fill(0);
        this.Nodes = this.lengths.reduce((accum, cur) => {
            accum.push(cur + accum[accum.length - 1]);
            return accum;
        }, [0]).map(x => new THREE.Vector3(x));
        this.geometry && this.Render();
    }

    Statde() {
        const state =
            /*const prevs = this.Nodes.Between().map(([cur, next]) => next.clone().sub(cur));


            const state = [this.X, ...prevs].Between()
                .reduce((accum, [cur, next]) => {
                    const angle = cur.angleTo(next);
                    accum.push(angle === Math.PI ? 0 : angle);
                    return accum;
                }, []);*/

            Object.assign(this, { state });

        return state;
    }

    Angles(angles) {
        if (angles.length < this.lengths.length)
            throw new Error(`length of angles should be >= ${this.lengths.length}. Got ${angles.length}`);
        if (!angles.every(x => typeof x === 'number'))
            throw new Error('angle is not a number: ' + angles);


        console.group();
        const state = angles.slice(0, this.lengths.length).map((x, i) => speed * x + this.state[i]);
        console.log(state);

        const con = //Array(10).fill(90)
            [0, 90, 90, 0]
            .map(DEG2RAD);

        const Vector = this.Z.clone();
        const Quaternion = new THREE.Quaternion().setFromAxisAngle(Vector, 0);
        const QuaternionTemp = new THREE.Quaternion();
        const QuaternionTemp2 = new THREE.Quaternion();

        let Node = this.X;

        this.Arrows.forEach(x => scene.remove(x));
        const Arrows = [];


        let Nodes = this.lengths.map((x, i) => {
            QuaternionTemp.setFromAxisAngle(Node.clone().normalize(), con[i]);
            Vector.applyQuaternion(QuaternionTemp);
            QuaternionTemp2.setFromAxisAngle(Vector, state[i]);

            const Arrow = new THREE.ArrowHelper(Vector);
            scene.add(Arrow);
            Arrows.push(Arrow);

            Node = Node.clone().setLength(x).applyQuaternion(QuaternionTemp2);
            return Node;
        });

        Nodes = Nodes.reduce((accum, cur) => {
            accum.push(accum[accum.length - 1].clone().add(cur));
            return accum;
        }, [new THREE.Vector3()]);

        Arrows.forEach(({ position }, i) => position.copy(Nodes[i]));

        Object.assign(this, { Arrows, state, Nodes });

        console.log(state);
        console.groupEnd();
        return this.Render();
    }

    Dispose() {
        scene.remove(this.line);
        this.Emitter.remove();
    }
}
