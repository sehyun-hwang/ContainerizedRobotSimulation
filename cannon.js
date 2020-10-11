import { THREE, Z, scene, camera, renderer, orbit, Load } from './three.js';
//import Geometries from './Geometries.js';
//import Shape2Mesh from './canon-shape2mesh.js';
const CopyVector = (src, dsc) => dsc.set(...src.toArray());

function CopyObject(src, dsc) {
    dsc.position.set(...src.position.toArray());
    dsc.quaternion.set(...src.quaternion.toArray());
}

function LineWithBuffer(type, args) {
    const Buffer = THREE[type.replace('Geometry', 'BufferGeometry')];

    if (!Buffer)
        throw new Error('Unsupported type: ' + type);

    const geometry_scene = new THREE.LineSegments(new THREE.WireframeGeometry(new Buffer(...args)));
    const geometry_nonbuffer = new THREE.Mesh(
        new THREE[type](...args),
        new THREE.MeshBasicMaterial({
            visible: false,
        }));
    const object = new THREE.Object3D();
    object.add(geometry_scene);
    object.add(geometry_nonbuffer);
    scene.add(object);

    return [geometry_nonbuffer, object];
}

let CANNON, OnChange, changed;

export const Changed = () => changed = true;

let _setX;
export const setX = new Promise(resolve => _setX = resolve);

export const object = Load(['CANNON', 'CSG', 'OBB', 'TransformControls'])
    .then(([_CANNON, CSG, OBB, { TransformControls }]) => {
        CANNON = _CANNON;
        const [geometry, object] = LineWithBuffer('TetrahedronGeometry', [.5]);

        const transformControls = new TransformControls(camera, renderer.domElement);
        orbit.WithTransformControls(transformControls);
        transformControls.attach(object);
        transformControls.showZ = false;
        scene.add(transformControls);

        const [geometry2, object2] = LineWithBuffer('TorusKnotGeometry', [3, 1, 40, 10]);

        const Dots = new THREE.Geometry();
        scene.add(new THREE.Points(
            Dots,
            new THREE.PointsMaterial({
                size: 10,
                sizeAttenuation: false
            })));

        const material = new THREE.MeshStandardMaterial({
            opacity: 0.5,
            transparent: true,
            color: 0xff0000,
        });

        let Intersection;
        OnChange = async function () {
            Intersection && scene.remove(Intersection);
            Intersection = CSG.intersect(geometry, geometry2, material);

            const magnitude = Intersection.geometry.faces.length;
            if (!magnitude)
                return 0;
            scene.add(Intersection);

            const { position } = object;
            const { position: position2 } = Intersection;
            Dots.vertices[0] = position;
            Dots.verticesNeedUpdate = true;

            const vector = position.clone().sub(position2);
            return magnitude * vector.cross(position).z;
        };

        transformControls.addEventListener('change', () => changed = true);

        return [object, object2];
    })

    .then(([object, object2]) => {
        const world = new CANNON.World();
        const shape = new CANNON.Sphere(1);

        const body = new CANNON.Body({
            mass: 1,
            shape,
            //angularVelocity: new CANNON.Vec3(1, 2, 3),
        });

        const constraint = new CANNON.HingeConstraint(
            new CANNON.Body({
                type: CANNON.Body.STATIC,
                position: new CANNON.Vec3(0, 0, 0),
                angularDamping: 10000000,
                shape
            }), body, {
                //pivotA: new CANNON.Vec3(0, 0, 0),
                //pivotB: new CANNON.Vec3(0, 0, 0),
                axisA: new CANNON.Vec3(0, 0, 1),
                axisB: new CANNON.Vec3(0, 0, 1)
            });

        _setX(x => {
            console.log('setX', x);
            body.position.x = x;
            constraint.pivotA.x = x;
            constraint.update();
            changed = true;
        });

        //world.gravity.set(1, 1, -1);
        world.addBody(body);
        constraint.enableMotor();
        world.addConstraint(constraint);

        const Step = (delta = 0) => {
            console.log('Step');
            world.step(delta);
            CopyObject(body, object2);
            changed && OnChange().then(magnitude => {
                constraint.setMotorSpeed(-magnitude);
                if (body.angularVelocity.almostZero()) changed = false;
            });
            AttachStep();
        };

        const AttachStep = () => {
            
            renderer.domElement.addEventListener('Render', { once: false }, ({ detail }) => Step(detail));
        };

        setX.then(setX => setX(5)).then(Step);

        return object;
    });
