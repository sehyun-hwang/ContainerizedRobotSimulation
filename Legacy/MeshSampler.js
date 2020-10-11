import { MeshSurfaceSampler } from 'https://cdn.jsdelivr.net/npm/three@v0.117.0/examples/jsm/math/MeshSurfaceSampler.js';

const raycasters = [];
let lines = [];

export default function LIDAR(mesh) {
    lines.forEach(x => scene.remove(x));
    lines = [];

    const lengths = [];
    raycasters.forEach(x => {
        const Intersections = x.intersectObject(mesh, true);
        const { ray } = x;

        const colors = [0xff0000, 0x00ff00, 0x0000ff];
        Intersections.forEach((x, i) => {
            const line = new THREE.ArrowHelper(ray.direction, ray.origin, x.distance, colors[i]);
            lines.push(line);
            scene.add(line);
        });
        lengths.push(Intersections.length);
    });
    console.log(lengths)

    return lines;
}

const dotGeometry = new THREE.Geometry();
const dot = new THREE.Points(dotGeometry, new THREE.PointsMaterial({
    size: 10,
    sizeAttenuation: false
}));
scene.add(dot);

const sampler = new MeshSurfaceSampler(klein).build();

for (let i = 0; i < 1000; i++) {
    const position = new THREE.Vector3(),
        normal = new THREE.Vector3();
    sampler.sample(position, normal);
    dotGeometry.vertices.push(position);

    const raycaster = new THREE.Raycaster(position, normal);
    const raycaster2 = new THREE.Raycaster(position, normal.clone().negate());
    raycasters.push(raycaster, raycaster2);
}
