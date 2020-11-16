import { THREE, scene } from './three.js';
const { Vector3, Bone } = THREE;

const geometry = new THREE.CylinderBufferGeometry(
	1, // radiusTop
	1, // radiusBottom
	10, // height
	8, // radiusSegments
	3, // heightSegments
	true // openEnded
)
const position = geometry.attributes.position;
const vertex = new Vector3();

const skinIndices = [];
const skinWeights = [];
const sizing = (function () {
	const segmentHeight = 12;
	const segmentCount = 4;
	const height = segmentHeight * segmentCount;
	const halfHeight = height / 2;
	return { segmentHeight, segmentCount, height, halfHeight };
})()
for (let i = 0; i < position.count; i++) {
	console.log(i)


	vertex.fromBufferAttribute(position, i);
	console.log(vertex.y)
	const y = (vertex.y + sizing.halfHeight);

	const skinIndex = Math.floor(y / sizing.segmentHeight);
	const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

	skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
	skinWeights.push(1 - skinWeight, skinWeight, 0, 0);

}

geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));



const bones = (function createBones() {

	const bones = [];

	let prevBone = new Bone();
	bones.push(prevBone);
	prevBone.position.y = -sizing.halfHeight;

	for (let i = 0; i < sizing.segmentCount; i++) {

		const bone = new Bone();
		bone.position.y = sizing.segmentHeight;
		bones.push(bone);
		prevBone.add(bone);
		prevBone = bone;

	}

	return bones;

})()

const material = new THREE.MeshPhongMaterial({
	skinning: true,
	color: 0x156289,
	side: THREE.DoubleSide,
});
const mesh = new THREE.SkinnedMesh(geometry, material);
const skeleton = new THREE.Skeleton(bones);

mesh.add(bones[0]);
bones[0].position.multiplyScalar(0);
mesh.bind(skeleton);

scene.add(mesh);


setInterval(() => {
	const time = Date.now() * 0.001;
	for (let i = 0; i < mesh.skeleton.bones.length; i++) {
		mesh.skeleton.bones[i].rotation.z = Math.sin(time) * 2 / mesh.skeleton.bones.length;

	}
}, 1000)
