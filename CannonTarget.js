import { THREE, Vector2, scene } from './three.js'

const r = 1,
    R = 2,
    t = .1,
    n = 3;

export default function () {
    const shape = new THREE.Shape();

    const Vectors = [
        new Vector2(t, r),
        new Vector2(t, R),
        new Vector2(-t, R),
    ];

    const Origin = new Vector2();
    console.log(Origin.x)
    for (let i = 0; i < n; i++)
        Vectors.forEach(x => {
            shape.lineTo(...x.toArray());
            console.log(x);
            x.rotateAround(Origin, 2 * Math.PI / n);
        });


    const extrudeSettings = {
        depth: 1,
        bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

}
