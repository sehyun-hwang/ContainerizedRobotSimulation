import { THREE, Z, scene, camera, renderer, orbit, Load } from './three.js';

function LineWithBuffer(type, args) {
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
    const geometry_scene = new THREE.LineSegments(new THREE.WireframeGeometry(Buffer));
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

let OnChange;

let _object2, _setX, AttachStep;
export const setX = x => _setX(x);
export const Changed = () => AttachStep();

let timer = 0;

const init = Load(['CSG', 'TransformControls'])
    .then(Modules => {
        const [CSG, { TransformControls }] = Modules;

        const [geometry, object] = LineWithBuffer('TetrahedronGeometry', [.5]);
        const transformControls = new TransformControls(camera, renderer.domElement);
        orbit.WithTransformControls(transformControls);
        transformControls.attach(object);
        transformControls.showZ = false;
        scene.add(transformControls);

        return { CSG, geometry, object, transformControls };
    });

export const object = Custom => init.then(({
    CSG,
    geometry,
    object,
    transformControls,
}) => {
    console.log({ Custom });
    _object2 && scene.remove(_object2);
    const [geometry2, object2] = LineWithBuffer(Custom || 'TorusKnotGeometry', [3, 1, 40, 10]);
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
});
