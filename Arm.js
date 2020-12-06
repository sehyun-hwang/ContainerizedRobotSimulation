import { THREE, Vector3, scene, Load } from './three.js';
import { Log } from './utils.js';
import { constructor, Render } from './ArmBones.js';

let ArmBones;

export const ImproveVisual = bool => {
    if (bool)
        Load('ArmBones').then(module => ArmBones = module);
    else
        ArmBones = false;
}

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

    Map(fn, j = 0) {
        const arr = [];
        for (let i = 0; i < this.lengths.length + j; i++)
            arr.push(fn(i));
        return arr;
    }

    constructor(lengths, rotations) {
        const obj = { lengths, rotations };
        Log(obj);
        Object.assign(this, obj);
        this.Reset();

        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(this.Nodes);

        const colors = this.Map(i => {
            const color = Array(3).fill(.5);
            color[i % 3] = 1.;
            return color;
        });
        colors.push([1, 1, 1]);

        geometry.setAttribute('color', new THREE.BufferAttribute(
            new Float32Array(colors.flat()),
            3));

        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
            vertexColors: true,
        }));
        scene.add(line);

        Object.assign(this, {
            geometry,
            line,
            Emitter: document.createElement('div'),
            Arrows: [],
        });

        try {
            this.Angles();
            constructor(this);
        }
        catch (error) {
            console.warn(error);
        }

    }

    On(...args) {
        this.Emitter.addEventListener(...args);
    }
    Emit({ name }, detail) {
        this.Emitter.dispatchEvent(new CustomEvent(name, { detail }));
        return new Promise(resolve => setTimeout(resolve, 0));
    }


    X = new Vector3(1);
    Z = new Vector3(0, 0, 1);

    Render() {
        const { geometry, Nodes } = this;
        geometry.setFromPoints(Nodes);
        geometry.verticesNeedUpdate = true;

        try {
            Render(this);
        }
        catch (error) {
            console.warn(error);
        }
        return this.Emit(this.Render, this.Nodes);
    }

    Reset() {
        const r = Math.random(),
            theta = Math.random() * 2 * Math.PI;
        const target = [r * Math.cos(theta), r * Math.sin(theta)];
        Target.position.fromArray(target);
        Target.verticesNeedUpdate = true;

        const state = Array(this.lengths.length).fill(0);
        const Nodes = this.lengths.reduce((accum, cur) => {
            accum.push(cur + accum[accum.length - 1]);
            return accum;
        }, [0]).map(x => new Vector3(x));

        Object.assign(this, { target, state, Nodes });

        this.geometry && this.Render();
    }

    Angles(angles = Array(this.lengths.length).fill(0)) {
        const { lengths, Nodes, X, Z } = this;

        if (angles.length < lengths.length)
            throw new Error(`length of angles should be >= ${this.lengths.length}. Got ${angles.length}`);
        if (!angles.every(x => typeof x === 'number'))
            throw new Error('angle is not a number: ' + angles);

        const PI2 = 2 * Math.PI;
        const state = angles.slice(0, lengths.length).map((x, i) => {
            const angle = speed * x + this.state[i];
            return angle > PI2 ? angle - PI2 : angle;
        });

        const con = //Array(10).fill(90)
            [0, 90, 0, 0]
            .map(DEG2RAD);

        const Vector = Z.clone();
        const Quaternion = new THREE.Quaternion();
        const Quaternion2 = new THREE.Quaternion();
        const Arrows = [];
        let Node = X;

        const BeforeTranslation = lengths.map((x, i) => {
            Quaternion.setFromAxisAngle(Node.clone().normalize(), con[i]);
            Vector.applyQuaternion(Quaternion);
            Quaternion2.setFromAxisAngle(Vector, state[i]);

            const Arrow = new THREE.ArrowHelper(Vector);
            scene.add(Arrow);
            Arrows.push(Arrow);

            Node = Node.clone().setLength(x).applyQuaternion(Quaternion2);
            return Node;
        });

        Nodes[0].multiplyScalar(0);
        Nodes.Between().forEach(([x, y], i) => y.copy(BeforeTranslation[i]).add(x));

        Arrows.forEach(({ position }, i) => position.copy(Nodes[i]));
        this.Arrows.forEach(x => scene.remove(x));
        Object.assign(this, { Arrows, BeforeTranslation, state });

        Log('Angles', state);
        return this.Render();
    }

    Dispose() {
        scene.remove(this.line);
        this.Emitter.remove();
    }
}
