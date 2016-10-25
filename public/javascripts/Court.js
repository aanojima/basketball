function Court(){
	
	const ELASTICITY = 0.7;
	const FK_COEFFICIENT = 0.25;
	
	var _offset, _mesh;

	this.getOffset = function(){
		return _offset;
	}

	this.getMesh = function(){
		return _mesh;
	}

	this.getNormal = function(){
		return new THREE.Vector3(0, 1.0, 0);
	}

	this.getBounceVector = function(velocity){
		// R_i - 2*N*(N.R)
		if (velocity.y == 0){
			return velocity.clone();
		}
		var R = velocity.clone()
		var N = this.getNormal();
		var NR = this.getNormal().dot(R);
		var component = this.getNormal().multiplyScalar(2 * NR);
		var bounce = R.sub(component);

		// Loss of momentum (elasticity)
		bounce.multiplyScalar(ELASTICITY);
		return bounce;
	}

	// TODO: pass hit to help better fix position/velocity during collision
	this.hasCollision = function(basketball){
		var radius = basketball.getRadius();
		var center = basketball.getPosition();

		// Point is C - N
		var point = center.sub(this.getNormal().multiplyScalar(radius));

		// P.N + D = 0
		var temp = point.dot(this.getNormal()) - _offset;
		return temp <= 0;
	}

	this.getNormalForce = function(mass){
		return (new THREE.Vector3(0, METERS(9.8), 0)).multiplyScalar(mass);
	}

	this.getFrictionForce = function(normal, velocity){
		// TODO: Static vs. Kinetic
		return velocity.normalize().multiplyScalar(-1 * FK_COEFFICIENT * normal.length());
	}

	function init(){
		var texture = new THREE.ImageUtils.loadTexture('public/images/basketball-court.png');
		var material = new THREE.MeshPhongMaterial({
			map : texture,
			color : 0xffffff,
			side: THREE.DoubleSide,
			shininess: 30
		});
		var geometry = new THREE.PlaneBufferGeometry(FEET(94), FEET(50), 10, 10);
		_mesh = new THREE.Mesh(geometry, material);
		_mesh.receiveShadow = true;
		_mesh.rotation.x = Math.PI / 2;
		_offset = _mesh.position.y;
		
	}

	init();
}