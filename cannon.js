import { THREE, Z, scene, camera, renderer, orbit, Load } from './three.js';
//import Geometries from './Geometries.js';
//import Shape2Mesh from './canon-shape2mesh.js';

let speed = 1;
export const CannonSpeed = _speed => speed = _speed;

const CopyVector = (src, dsc) => dsc.set(...src.toArray());

function CopyObject(src, dsc) {
    dsc.position.set(...src.position.toArray());
    dsc.quaternion.set(...src.quaternion.toArray());
}

function LineWithBuffer(type, args = []) {
    let Buffer, NonBuffer;

    if (typeof type === 'string') {
        NonBuffer = new THREE[type](...args);
        Buffer = new THREE[type.replace('Geometry', 'BufferGeometry')](...args);
    }
    else {
        const [{ geometry }] = type.children;

        if (!'BufferGeometry' === geometry.type)
            throw new Error('Unsupported .obj');

        NonBuffer = new THREE.Geometry();
        NonBuffer.fromBufferGeometry(geometry);
        Buffer = geometry;
    }

    if (Buffer && NonBuffer);
    else
        throw new Error('Unsupported type: ' + type);

    console.log(NonBuffer, Buffer);
    const geometry_scene = new THREE.LineSegments(
        new THREE.WireframeGeometry(Buffer),
        new THREE.LineBasicMaterial({
            color: new THREE.Color(...Array.from({ length: 3 }, () => Math.random() / 2 + .5)),
        }));
    const geometry_nonbuffer = new THREE.Mesh(
        NonBuffer,
        new THREE.MeshBasicMaterial({
            visible: false,
        }));
    const object = new THREE.Object3D();
    object.add(geometry_scene);
    object.add(geometry_nonbuffer);
    scene.add(object);

    return [geometry_nonbuffer, object];
}

let CANNON, OnChange;

let _object2, setX, AttachStep;
export const Cannonx = x => setX(x);
export const Changed = () => AttachStep();

let timer = 0;

const init = Load(['CSG', 'TransformControls', 'CANNON'])
    .then(Modules => {
        const [CSG, { TransformControls }, _CANNON] = Modules;
        CANNON = _CANNON;

        const [geometry, object] = LineWithBuffer('TetrahedronGeometry', [.5]);
        const transformControls = new TransformControls(camera, renderer.domElement);
        orbit.WithTransformControls(transformControls);
        transformControls.attach(object);
        transformControls.showZ = false;
        scene.add(transformControls);

        return { CSG, geometry, object, transformControls };
    });

const DefaultGeometryArgs = {
    TorusKnotGeometry: [3, 1, 40, 10],
    BoxGeometry: [3, .5, 3],
}

export const CannonObject = (Custom = 'BoxGeometry') => init.then(({
        CSG,
        geometry,
        object,
        transformControls,
    }) => {
        console.log({ Custom });
        _object2 && scene.remove(_object2);
        const [geometry2, object2] = LineWithBuffer(Custom, DefaultGeometryArgs[Custom]);
        _object2 = object2;

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
            console.log('OnChange');
            console.time(++timer);

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

        transformControls.addEventListener('change', Changed);

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

        //world.gravity.set(1, 1, -1);
        world.addBody(body);
        constraint.enableMotor();
        world.addConstraint(constraint);

        {
            const element = renderer.domElement;
            const event = 'Render';
            let Finished;

            const Step = (delta = 0) => {
                console.log('Step');
                world.step(delta);
                CopyObject(body, object2);

                OnChange().then(magnitude => {
                    constraint.setMotorSpeed(-magnitude * speed);
                    console.log({ magnitude });
                    body.angularVelocity.almostZero() ? Finished() : AttachStep();
                    console.timeEnd(timer);
                });
            };

            const Handler = ({ detail }) => Step(detail);
            AttachStep = () => {
                element.removeEventListener(event, Handler);
                element.addEventListener(event, Handler, { once: true });
                return new Promise(resolve => Finished = resolve);
            };

            setX = x => {
                console.log('setX', x);
                body.position.x = x;
                constraint.pivotA.x = x;
                constraint.update();
                return AttachStep();
            };

            setX(5).then(Step);
        }

        return object;
    });
