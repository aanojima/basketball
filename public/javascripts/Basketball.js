function Basketball(){

	const MASS = 0.625;
	const RADIUS = INCHES(4.75);

	var _state, _mesh, _angularVelocity, _courtCollision, _normalHash, _frictionHash;

	this.getMass = function(){
		return MASS;
	}

	this.getRadius = function(){
		return RADIUS;
	}

	// TODO: save old state to have better fixing
	this.getState = function(){
		var result = [_state[0].clone(), _state[1].clone()];
		return result;
	}

	this.getPosition = function(){
		return _state[0].clone();
	}

	this.setPosition = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			_state[0].x = a.x;
			_state[0].y = a.y;
			_state[0].z = a.z;	
		}
		else {
			_state[0].x = a;
			_state[0].y = b;
			_state[0].z = c;
		}
		_mesh.position.set(_state[0].x, _state[0].y, _state[0].z);
	}

	this.setY = function(Y){
		_state[0].y = Y;
		_mesh.position.set(_state[0].x, _state[0].y, _state[0].z);
	}

	this.addPosition = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			_state[0].add(a);
		}
		else {
			_state[0].x += a;
			_state[0].y += b;
			_state[0].z += c;
		}
		_mesh.position.set(_state[0].x, _state[0].y, _state[0].z);
	}

	this.getVelocity = function(){
		return _state[1].clone();
	}

	this.setVelocity = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			_state[1].x = a.x;
			_state[1].y = a.y;
			_state[1].z = a.z;
		}
		else {
			_state[1].x = a;
			_state[1].y = b;
			_state[1].z = c;
		}
	}

	this.addVelocity = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			_state[1].x += a.x;
			_state[1].y += a.y;
			_state[1].z += a.z;
		}
		else {
			_state[1].x += a;
			_state[1].y += b;
			_state[1].z += c;
		}
	}

	this.setState = function(newState, test){
		if (newState && newState.length === 2){
			// Valid State
			_state[0] = newState[0].clone();
			_mesh.position.set(newState[0].x, newState[0].y, newState[0].z);
			_state[1] = newState[1].clone();
		}
	}

	this.setAngularVelocity = function(x, y, z){
		_angularVelocity = new THREE.Vector3(x, y, z);
	}

	this.spin = function(step){
		var axis = new THREE.Vector3(-1*_angularVelocity.z, 0, _angularVelocity.x);
		var angularSpeed = _angularVelocity.length();
		var angle = -1 * angularSpeed * step;
		this.rotateAroundWorldAxis(axis, angle);
	}

	this.getMesh = function(){
		return _mesh;
	}

	this.evalF = function(){
		var netForce = new THREE.Vector3();

		// Gravity
		var gravityDirection = new THREE.Vector3(0, -1.0, 0);
		var gravity = gravityDirection.multiplyScalar(METERS(9.8) * MASS);
		netForce.add(gravity);

		// TODO: Drag

		// TODO: External Forces

		// Friction
		for (var i in _normalHash){
			var normal = _normalHash[i];
			if (!i || !normal){
				continue;
			}
			netForce.add(normal);
		}
		
		// Friction
		for (var i in _frictionHash){
			var friction = _frictionHash[i];
			if (!i || !friction){
				continue;
			}
			netForce.add(friction);
		}

		// Net Force
		var v = _state[1].clone();
		var a = netForce.clone().divideScalar(MASS);

		var F = [v, a];
		return F;
	}

	function init(){;
		_state = [
			new THREE.Vector3( FEET(31.5), FEET(10), FEET(10)),
			new THREE.Vector3(FEET(14.5), FEET(12.5), FEET(-13))
		];

		var geometry = new THREE.SphereGeometry(RADIUS, 32, 32);
		var material = new THREE.MeshLambertMaterial({ 
			map: new THREE.ImageUtils.loadTexture('public/images/basketball.jpg')
		});
		_mesh = new THREE.Mesh(geometry, material);
		_mesh.castShadow = true;
		_mesh.receiveShadow = false;
		_mesh.position.set(_state[0].x, _state[0].y, _state[0].z);
		_angularVelocity = (new THREE.Vector3(_state[1].x, 0, _state[1].z)).multiplyScalar(0.25 / RADIUS);
		_normalHash = {};
		_frictionHash = {};
	}

	this.rotateAroundWorldAxis = function(axis, radians){
		var rotWorldMatrix = new THREE.Matrix4();
		rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
		rotWorldMatrix.multiply(_mesh.matrix);
		_mesh.matrix = rotWorldMatrix;
		_mesh.rotation.setFromRotationMatrix(_mesh.matrix);
	}

	this.setCourtCollision = function(collision){
		_courtCollision = collision;
	}

	this.addNormal = function(objectName, force){
		_normalHash[objectName] = force;
	}

	this.removeNormal = function(objectName, force){
		if (_normalHash.hasOwnProperty(objectName)){
			_normalHash[objectName] = undefined;
		}
	}

	this.addFriction = function(objectName, force){
		_frictionHash[objectName] = force;
	}

	this.removeFriction = function(objectName){
		if (_frictionHash.hasOwnProperty(objectName)){
			_frictionHash[objectName] = undefined;
		}
	}

	this.getNormalForces = function(){
		return _normalHash;
	}

	this.getFrictionForces = function(){
		return _frictionHash;
	}

	this.getBoundingBox = function(){
		_mesh.geometry.computeBoundingBox();
		return _mesh.geometry.boundingBox.clone();
	}

	init();
}