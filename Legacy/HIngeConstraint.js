var s = 5,
    d = 0.1 * s;

var body = new CANNON.Body({
    mass: 1,
    shape
});
var staticBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Sphere(1)
});

var constraint = new CANNON.HingeConstraint(staticBody, body, {
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1)
});
constraint.setMotorSpeed(10);
constraint.enableMotor();

world.addConstraint(c);
world.addBody(body);
world.addBody(staticBody)
