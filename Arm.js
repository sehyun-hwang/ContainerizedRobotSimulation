import { THREE, scene } from './three.js';
import { Log } from './utils.js';

const { Vector3 } = THREE;
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

//const translate = new Vector3(1)

export class Arm {

    Bones() {
        const { bones } = this;

    }

    Sizing(height, segmentCount) {
        const halfHeight = height / 2;
        const segmentHeight = height / segmentCount;

        const sizing = { segmentHeight, segmentCount, height, halfHeight };
        console.log(sizing)
        Object.assign(this, { sizing });
        return sizing;
    }

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

        {
            const height = this.lengths.reduce((x, y) => x + y, 0);
            const sizing = this.Sizing(height, lengths.length);
            const geometry = new THREE.CylinderBufferGeometry(
                .1, // radiusTop
                .2, // radiusBottom
                sizing.height, // height
                8, // radiusSegments
                lengths.length, // heightSegments
                true // isEndClosed
            );
            
            const bones = this.Map(() => new THREE.Bone(), 1);
            const [bone] = bones;
            bone.position.set(0,0,0)
            
            const position = geometry.attributes.position;
            const vertex = new Vector3();

            const skinIndices = [];
            const skinWeights = [];

            console.groupCollapsed();
            
        
            for (let i = 0; i < position.count; i++) {
                vertex.fromBufferAttribute(position, i);
                const y = vertex.y + sizing.halfHeight;
                const ratio = y / sizing.segmentHeight
                const skinIndex = Math.floor(ratio);
                const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

                console.log(y, ratio, skinIndex);
                skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
                skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
            }
            console.groupEnd();

            geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
            geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

<<<<<<< HEAD


            const bones = this.Map(() => new THREE.Bone(), 1);
            const [bone] = bones;

=======
>>>>>>> d2b1000dcd991f9055f393db1c1e4a97d6f24f24
            const material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                skinning: true,
                //flatShading: true,
            });
            const mesh = new THREE.SkinnedMesh(geometry, material);

            mesh.add(bone);
            bone.position.set(0,-1.5,0)
            bones.slice(1).forEach(({position},i)=>position.set(0, i*sizing.segmentHeight, 0))
            bones.Between().forEach(([x, y]) => x.add(y));

<<<<<<< HEAD

            //bones.forEach(x => x.rotateZ(-Math.PI / 2))
            //bone.position.set(1, 0, 0)
=======
>>>>>>> d2b1000dcd991f9055f393db1c1e4a97d6f24f24
            mesh.rotateZ(-Math.PI / 2)
            const skeleton = new THREE.Skeleton(bones);

            mesh.bind(skeleton);
            mesh.translateY(1.5)


            Object.assign(this, { mesh, bones: skeleton.bones })
            scene.add(mesh);
        }

        try {
            this.Angles();
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
        const { geometry, Nodes, bones, BeforeTranslation, sizing: { height } } = this;
        geometry.setFromPoints(Nodes);
        geometry.verticesNeedUpdate = true;

<<<<<<< HEAD
        const Euler = new THREE.Euler();

        console.group()
        //bones[1].position.set(0, 1, 0)
        //bones[2].position.set(0, 1, 0)
        //bones[3].position.set(1, 0, 0)
        //console.log(bones, BeforeTranslation)

        BeforeTranslation.forEach((x, i) => {

            bones[i].position.copy(x) //.add(translate);
            //i && rotation.copy(Euler.setFromVector3(BeforeTranslation[i - 1]));
=======
const Quaternion = new THREE.Quaternion();
 
        console.group();
        [
            this.X,
        ...BeforeTranslation,
        ].Between().forEach(([x,y], i) => {
            const {rotation} =  bones[i+1];
            Quaternion.setFromUnitVectors(x,y);
            //rotation.set(0,0,0)
           rotation.setFromQuaternion(Quaternion);
>>>>>>> d2b1000dcd991f9055f393db1c1e4a97d6f24f24
        });
        console.log(bones);
        {
            
        }
        //Nodes.slice(-1).forEach((x,i)=>bones[i+1].position.copy(x))
        console.groupEnd()

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
            [0, 0, 0, 0]
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
