import { THREE, Load } from './three.js';

export default Load(['ParametricGeometries']).then(_ParametricGeometries =>
    type => {
        let geometry = THREE[type] || _ParametricGeometries[type];
        if (!geometry)
            throw new Error('Unsupported type: ' + type);

        switch (type) {

        case 'klein':
            geometry = new THREE.ParametricGeometry(geometry, 10, 10);
            break;

        case 'TorusKnotGeometry':
            geometry = new geometry(10, 3, 25, 8);
            break;

        default:
            throw new Error('Unsupported type: ' + type);
        }

        return geometry;
    });
