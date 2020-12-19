import { THREE, Vector3, scene } from './three.js';

function Sizing(height, segmentCount) {
    const halfHeight = height / 2;
    const segmentHeight = height / segmentCount;

    return { segmentHeight, segmentCount, height, halfHeight };
}

export function constructor(that) {
    const { lengths, } = that;

    const height = lengths.reduce((x, y) => x + y, 0);
    const sizing = Sizing(height, lengths.length);
    const geometry = new THREE.CylinderBufferGeometry(
        .1, // radiusTop
        .2, // radiusBottom
        sizing.height, // height
        8, // radiusSegments
        lengths.length, // heightSegments
        true // isEndClosed
    );

    const bones = that.Map(() => new THREE.Bone(), 1);
    const [bone] = bones;

    const position = geometry.attributes.position;
    const vertex = new Vector3();

    const skinIndices = [];
    const skinWeights = [];

    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        const y = vertex.y + sizing.halfHeight;
        const ratio = y / sizing.segmentHeight;
        const skinIndex = Math.round(ratio);

        skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
        skinWeights.push(1, 0, 0, 0);
    }

    console.log({ skinIndices, skinWeights });

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const mesh = new THREE.SkinnedMesh(geometry, new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        skinning: true,
        flatShading: true,
    }));
    mesh.rotateZ(-Math.PI / 2);

    bone.position.set(0, -sizing.halfHeight, 0);
    bones.slice(1).forEach(({ position }) => position.set(0, sizing.segmentHeight, 0));
    bones.Between().forEach(([x, y]) => x.add(y));

    const skeleton = new THREE.Skeleton(bones);
    mesh.add(bone);
    mesh.bind(skeleton);
    mesh.translateY(lengths[0] + sizing.segmentHeight);

    Object.assign(that, { sizing, mesh, bones: skeleton.bones, Mesh3D: mesh });
    scene.add(mesh);
}

const Quaternion = new THREE.Quaternion();
const Quaternion2 = new THREE.Quaternion();

export function Render(that) {
    const { bones, BeforeTranslation, X, Z } = that;
    console.group();
    Quaternion2.setFromAxisAngle(Z, Math.PI / 2);
    [
        X,
        ...BeforeTranslation,
    ].Between().forEach(([x, y], i) => {
        const { rotation } = bones[i];
        Quaternion.setFromUnitVectors(x.clone().applyQuaternion(Quaternion2), y.clone().applyQuaternion(Quaternion2));
        rotation.setFromQuaternion(Quaternion);
    });
    console.groupEnd();
}
