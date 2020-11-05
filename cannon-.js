import { THREE, camera, renderer, scene, Load, orbit } from './three.js';
import Shape2Mesh from './canon-shape2mesh.js';

function Copy(src, dsc) {
    dsc.position.set(...src.position.toArray());
    dsc.quaternion.set(...src.quaternion.toArray());
}

Load([Shape2Mesh, 'TransformControls', 'CANNON']).then(([Shape2Mesh, { TransformControls }, CANNON]) => {
    const world = new CANNON.World();
    //world.gravity.set(0, 0, -1);

    const material = new THREE.MeshBasicMaterial();
    const Entries = [0, 5].map(x => {
        const body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
            //angularVelocity: new CANNON.Vec3(1, 2, 3),
        });
        body.position.set(x, 0, 0);
        world.addBody(body);

        const mesh = Shape2Mesh(body, material);
        console.log(mesh);
        scene.add(mesh);

        return [mesh, body];
    });

    world.addConstraint(new CANNON.DistanceConstraint(...Entries.map(x => x[1])));

    {
        const control = new TransformControls(camera, renderer.domElement);
        orbit.WithTransformControls(control);
        //control.addEventListener('change', event => {});

        window.addEventListener('keydown', ({ ctrlKey, shiftKey }) => (ctrlKey || shiftKey) && control.setMode('rotate'));
        window.addEventListener('keyup', () => control.setMode('translate'));

        control.attach(Entries[0][0]);
        scene.add(control);
    }

    renderer.domElement.addEventListener('Render', ({ detail }) => {
        world.step(detail);
        Copy(...Entries[0]);
        const [mesh, body] = Entries[1];
        Copy(body, mesh);
    });


});
