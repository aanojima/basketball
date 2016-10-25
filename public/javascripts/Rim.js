function Rim(side){
	
	// Dimensional Constants
	const RING_RADIUS = INCHES(9);
	const RING_MINOR_RADIUS = INCHES(0.3125);

	const ATTACH_WIDTH = INCHES(4);
	const ATTACH_DEPTH = INCHES(6);
	const ATTACH_HEIGHT = INCHES(4);

	const ATTACH_BOTTOM_THICKNESS = INCHES(2);
	const ATTACH_FRONT_THICKNESS = INCHES(1);

	const SHADOW_HEIGHT = INCHES(1);

	const DISTANCE = FEET(42) - INCHES(4) - RING_RADIUS; // Backboard Depth

	const R_SEGMENTS = 32;
	const T_SEGMENTS = 64;

	// Physics Constants
	const ELASTICITY = 0.5;

	// Private Member Fields
	var _group, _torusMesh, _attachmentMesh, _shadowMesh;

	this.getMesh = function(){
		return _group;
	}

	function vector(x,y,z){
		return new THREE.Vector3(INCHES(x), INCHES(y), INCHES(z));
	}

	function faceHelper(a,b,c){
		return new THREE.Face3(a, b, c);
	}

	function rayIntersectTorus(ray, a, b){
		var o = ray.origin.clone();
		var d = ray.direction.clone();

		// Grouping together like-terms (same degree of t)
		var A = o.lengthSq() - Math.pow(a, 2) - Math.pow(b, 2);
		var B = 2*o.clone().dot(d.clone());
		var C = 1;
		var D = 4*Math.pow(a, 2)*Math.pow(b, 2) - 4*Math.pow(a, 2)*Math.pow(o.y, 2);
		var E = -8*Math.pow(a, 2)*o.y*d.y;
		var F = -4*Math.pow(a, 2)*Math.pow(d.y, 2);

		// Quartic Equation Coefficients
		var A1 = 1;
		var B1 = 2*B;
		var C1 = 2*A + B*B - F;
		var D1 = 2*A*B - E;
		var E1 = A*A - D;

		var roots = calculateQuarticRoots(B1, C1, D1, E1);

		var t = 0;
		for (var i in roots){
			var root = roots[i];
			if (root.imag == 0 && root.real > t){
				t = root.real;
			}
		}

		return t;

		// // Quartic Equation Solution
		// var p1 = 2*C1*C1*C1 - 9*B1*C1*D1 + 27*A1*D1*D1 + 27*B1*B1*E1 - 72*A1*C1*E1;
		// var p2 = p1 + Math.sqrt(-4*Math.pow(C1*C1 - 3*B1*D1 + 12*A1*E1, 3) + p1*p1);
		// var p3 = ((C1*C1 - 3*B1*D1 + 12*A1*E1) / (3*A1*Math.cbrt(p2 / 2))) + ((Math.cbrt(p2 / 2)) / (3*A1));
		// var p4 = Math.sqrt((B1*B1)/(4*A1*A1) - (2*C1)/(3*A1) + p3);
		// var p5 = ((B1*B1) / (2*A1*A1)) - ((4*C1) / (3*A1)) - p3;
		// var p6 = ((-1*(B1*B1*B1) / (A1*A1*A1)) + ((4*B1*C1) / (A1*A1)) - ((8*D1) / A1)) / (4*p4);
		// var term1 = -1*(B1 / (4*A1));
		// var term2 = p4 / 2;
		// var term3 = Math.sqrt(p5 + p6) / 2;

		// // All Roots (solutions) of the Quartic Equation
		// var t0 = term1 - term2 - term3;
		// var t1 = term1 - term2 + term3;
		// var t2 = term1 + term2 - term3;
		// var t3 = term1 + term2 + term3;

		// // Return largest positive t value (first collision)
		// console.log(t0, t1, t2, t3);
		// return Math.max(t0, t1, t2, t3);
	}

	function getTorusCenter(){
		var torusBox = new THREE.Box3();
		torusBox.setFromObject(_torusMesh);
		var a = torusBox.min.clone();
		var b = torusBox.max.clone();
		var torusCenter = a.add(b).multiplyScalar(0.5);
		return torusCenter;
	}

	function getBounceVector(velocity, normal){
		// Get R (velocity)
		var R = velocity.clone();

		// Get N (normal)
		var N = normal.clone().normalize();

		// R - 2*N*(N.R)
		var NR = N.clone().dot(R);
		var component = N.clone().multiplyScalar(2 * NR);
		var bounce = R.sub(component);

		// Loss of momentum (elasticity)
		bounce.multiplyScalar(ELASTICITY);
		return bounce;
	}

	this.handleCollision = function(basketball){
		var bbox = this.getBoundingBox();
		var radius = basketball.getRadius();
		var center = basketball.getPosition();

		// Geeral Intersection
		var intersection = bbox.distanceToPoint(center) <= radius;
		if (!intersection){
			// STOP here, reduce time spent on operation
			return false;
		}

		// Specific Intersection

		// Make a "Padded" Torus (extend the minor radius by the radius of the sphere)
		var paddedMinorRadius = RING_MINOR_RADIUS + radius;

		// See if Center of Basketball is inside "Padded" Torus
		var torusCenter = getTorusCenter();
		var x = center.x - torusCenter.x;
		var y = center.y - torusCenter.y;
		var z = center.z - torusCenter.z;
		var temp = 
		Math.pow(
			Math.pow(x, 2) + 
			Math.pow(y, 2) + 
			Math.pow(z, 2) -
			(
				Math.pow(RING_RADIUS, 2) + 
				Math.pow(paddedMinorRadius, 2)
			),
		2)
		- 4 * Math.pow(RING_RADIUS, 2) * (Math.pow(paddedMinorRadius, 2) - Math.pow(y, 2));
		intersection = temp <= 0;

		// If collision
		if (intersection){
			// FIXING the Collision (in case of overshooting)

			// Create new Ray (origin = center, direction = -velocity normalized)
			// console.log(x, y, z);
			var origin = new THREE.Vector3(x, y, z);
			var velocity = basketball.getVelocity();
			
			// DEBUG (since no velocity for collision)
			// velocity = new THREE.Vector3(1,1,1);
			
			var direction = velocity.clone().negate().normalize();
			var ray = new THREE.Ray(origin, direction);

			var t = rayIntersectTorus(ray, RING_RADIUS, paddedMinorRadius);
			if (t < 0 || !isFinite(t) || isNaN(t)){
				t = 0;
			}

			// Fix the position of the basketball
			var reverseDisplacement = velocity.clone().negate().normalize().multiplyScalar(t);
			basketball.addPosition(reverseDisplacement);


			// TODO: Find Intersection of Ray and "Padded" Torus [PaddedPoint]
			// TODO: Find Normal on "Padded" Torus from ObjectPoint (ProfilePoint to ObjectPoint normalized)
			// Add Normal to Hit Object
			var paddedSurfacePoint = ray.at(t);

			var x = paddedSurfacePoint.x;
			var z = paddedSurfacePoint.z;
			var tubeCenterPoint = new THREE.Vector3(x, 0, z).normalize().multiplyScalar(RING_RADIUS);
			var normal = paddedSurfacePoint.clone().sub(tubeCenterPoint.clone()).normalize();
			var bounce = getBounceVector(velocity, normal);
			basketball.setVelocity(bounce);
		}

		// If not, collision = false


		return intersection;
	}

	this.getBoundingBox = function(){
		var bb = new THREE.Box3();
		bb.setFromObject(_group);
		return bb;	
	}

	function init(side){
		var sideSign;
		if (side === "HOME"){
			sideSign = -1;
		} else if (side == "AWAY"){
			sideSign = 1;
		} else {
			return;
		}

		_group = new THREE.Object3D();

		// Ring
		var torusGeometry = new THREE.TorusGeometry(RING_RADIUS, RING_MINOR_RADIUS, R_SEGMENTS, T_SEGMENTS);
		var torusMaterial = new THREE.MeshLambertMaterial({
			color : 0xcf5300,
			side: THREE.DoubleSide
		});
		_torusMesh = new THREE.Mesh(torusGeometry, torusMaterial);
		_torusMesh.castShadow = true;
		_torusMesh.receiveShadow = true;
		_group.add(_torusMesh);
		
		// Backboard Attachment
		var attachmentGeometry = new THREE.Geometry();
		attachmentGeometry.vertices.push(
			new THREE.Vector3(ATTACH_WIDTH / -2, RING_RADIUS, 0),
			new THREE.Vector3(ATTACH_WIDTH /  2, RING_RADIUS, 0),
			new THREE.Vector3(ATTACH_WIDTH / -2, RING_RADIUS + ATTACH_DEPTH, 0),
			new THREE.Vector3(ATTACH_WIDTH /  2, RING_RADIUS + ATTACH_DEPTH, 0),
			new THREE.Vector3(ATTACH_WIDTH / -2, RING_RADIUS + ATTACH_DEPTH, -1 * ATTACH_HEIGHT),
			new THREE.Vector3(ATTACH_WIDTH /  2, RING_RADIUS + ATTACH_DEPTH, -1 * ATTACH_HEIGHT),
			new THREE.Vector3(ATTACH_WIDTH / -2, RING_RADIUS + ATTACH_DEPTH - ATTACH_BOTTOM_THICKNESS, -1 * ATTACH_HEIGHT),
			new THREE.Vector3(ATTACH_WIDTH /  2, RING_RADIUS + ATTACH_DEPTH - ATTACH_BOTTOM_THICKNESS, -1 * ATTACH_HEIGHT),
			new THREE.Vector3(ATTACH_WIDTH / -2, RING_RADIUS, -1 * ATTACH_FRONT_THICKNESS),
			new THREE.Vector3(ATTACH_WIDTH /  2, RING_RADIUS, -1 * ATTACH_FRONT_THICKNESS)
		);
		attachmentGeometry.faces.push(
			faceHelper(0, 1, 2),
			faceHelper(1, 2, 3),
			faceHelper(2, 3, 4),
			faceHelper(3, 4, 5),
			faceHelper(4, 5, 6),
			faceHelper(5, 6, 7),
			faceHelper(6, 7, 8),
			faceHelper(7, 8, 9),
			faceHelper(8, 9, 0),
			faceHelper(9, 1, 0),
			faceHelper(0, 2, 4),
			faceHelper(4, 6, 8),
			faceHelper(0, 4, 8),
			faceHelper(1, 3, 5),
			faceHelper(5, 7, 9),
			faceHelper(1, 5, 9)
		);
		var attachmentMaterial = new THREE.MeshLambertMaterial({
			color : 0xcf5300,
			side: THREE.DoubleSide
		});
		_attachmentMesh = new THREE.Mesh(attachmentGeometry, attachmentMaterial);
		_attachmentMesh.castShadow = true;
		_attachmentMesh.receiveShadow = true;
		_group.add(_attachmentMesh);

		// Ring Shadow
		var shadowGeometry = new THREE.Geometry();
		var shadowSegments = T_SEGMENTS / 2;
		for (var i = 0; i < shadowSegments + 1; i++){
			// Clone
			var zOffset = SHADOW_HEIGHT + RING_MINOR_RADIUS;
			if (i == 0 || i == shadowSegments){
				// Special (Don't set Z that far back)
				zOffset /= 2;
			}
			var torusVertex = torusGeometry.vertices[i].clone();
			var x = torusVertex.x;
			var y = torusVertex.y;
			var z = torusVertex.z;
			var shadowVertex = new THREE.Vector3(x,y,z - zOffset);
			shadowGeometry.vertices.push(torusVertex, shadowVertex);
		}
		for (var i = 0; i < 2*shadowSegments; i += 2){
			var face1 = new THREE.Face3(i, i+1, i+2 );
			var face2 = new THREE.Face3(i+1, i+2, i+3);
			shadowGeometry.faces.push(face1,face2);
		}
		var shadowMaterial = new THREE.MeshLambertMaterial({
			color : 0xcf5300,
			side: THREE.DoubleSide
		});
		_shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
		_shadowMesh.castShadow = true;
		_shadowMesh.receiveShadow = true;
		_group.add(_shadowMesh)

		_group.position.y = FEET(10);
		_group.position.x = sideSign * DISTANCE; // DEPENDS ON SIDE
		_group.rotation.z = sideSign * Math.PI / -2; // Depends on side
		_group.rotation.x = Math.PI / -2;
	}

	init(side);
}