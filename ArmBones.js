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

    console.log(sizing);
    bone.position.set(0, 0, 0);

    const position = geometry.attributes.position;
    const vertex = new Vector3();

    const skinIndices = [];
    const skinWeights = [];

    console.groupCollapsed();

    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        const y = vertex.y + sizing.halfHeight;
        const ratio = y / sizing.segmentHeight;
        const skinIndex = Math.floor(ratio);
        const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

        console.log(y, ratio, skinIndex);
        skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
        skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
    }
    console.groupEnd();

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        skinning: true,
        //flatShading: true,
    });
    const mesh = new THREE.SkinnedMesh(geometry, material);

    mesh.add(bone);
    bone.position.set(0, -1.5, 0);
    bones.slice(1).forEach(({ position }, i) => position.set(0, i * sizing.segmentHeight, 0));
    bones.Between().forEach(([x, y]) => x.add(y));

    mesh.rotateZ(-Math.PI / 2);
    const skeleton = new THREE.Skeleton(bones);

    mesh.bind(skeleton);
    mesh.translateY(1.5);

    Object.assign(that, { sizing, mesh, bones: skeleton.bones, Mesh3D: mesh });
    scene.add(mesh);
}

const Quaternion = new THREE.Quaternion();
export function Render(that) {
    const { bones, BeforeTranslation, X } = that;
    console.group();
    [
        X,
        ...BeforeTranslation,
    ].Between().forEach(([x, y], i) => {
        const { rotation } = bones[i + 1];
        Quaternion.setFromUnitVectors(x, y);
        //rotation.set(0,0,0)
        rotation.setFromQuaternion(Quaternion);
    });
    console.log(bones); {

    }
    console.groupEnd();
}
