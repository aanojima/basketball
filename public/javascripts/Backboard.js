function Backboard(side){
	
	const WIDTH = INCHES(72);
	const HEIGHT = INCHES(42);
	const DEPTH = INCHES(4);
	const DISTANCE = FEET(42) + DEPTH;
	const GROUND_DISTANCE = FEET(10) + 0.5*HEIGHT - INCHES(5); // ATTACH_HEIGHT + INCHES(1)
	const ELASTICITY = 0.8;
	const FK_COEFFICIENT = 0.25; // TODO: Research

	// FACES
	const NONE = 0;
	const FRONT = 1;
	const BACK = 2;
	const BOTTOM = 3;
	const TOP = 4;
	const LEFT = 5;
	const RIGHT = 6;

	// EDGES
	const FRONTBOTTOM = 130;
	const FRONTTOP = 140;
	const FRONTLEFT = 105;
	const FRONTRIGHT = 106;
	const BACKBOTTOM = 230;
	const BACKTOP = 240;
	const BACKLEFT = 205;
	const BACKRIGHT = 206;
	const BOTTOMLEFT = 035;
	const BOTTOMRIGHT = 036;
	const TOPLEFT = 045;
	const TOPTOMRIGHT = 046;

	// CORNERS
	const FRONTBOTTOMLEFT = 135;
	const FRONTBOTTOMRIGHT = 136;
	const FRONTTOPLEFT = 135;
	const FRONTTOPRIGHT = 136;
	const BACKBOTTOMLEFT = 235;
	const BACKBOTTOMRIGHT = 236;
	const BACKTOPLEFT = 245;
	const BACKTOPRIGHT = 246;

	var _mesh, _sideSign;

	this.getMesh = function(){
		return _mesh;
	}

	this.getNormal = function(face){
		return this.getNormals()[face];
	}

	this.getNormals = function(){
		var normals = {};
		normals[FRONT] = new THREE.Vector3(_sideSign * -1.0, 0, 0);
		normals[BACK] = new THREE.Vector3(_sideSign * 1.0, 0, 0);
		normals[BOTTOM] = new THREE.Vector3(0, -1.0, 0);
		normals[TOP] = new THREE.Vector3(0, 1.0, 0);
		normals[LEFT] = new THREE.Vector3(0, 0, _sideSign * -1.0);
		normals[RIGHT] = new THREE.Vector3(0, 0, _sideSign * 1.0);
		return normals;
	}

	this.getEdgeLineSegment = function(faces){
		var bbox = this.getBoundingBox();
		var pointA = bbox.min.clone();
		var pointB = bbox.max.clone();
		var dimensions = [
			side === "AWAY" ? bbox.min.x : bbox.max.x,
			side === "AWAY" ? bbox.max.x : bbox.min.x,
			bbox.min.y,
			bbox.max.y, 
			side === "AWAY" ? bbox.min.z : bbox.max.z,
			side === "AWAY" ? bbox.max.z : bbox.min.z
		];
		for (var i in faces){
			var face = parseInt(faces[i]);
			var value = dimensions[face - 1];
			if (face === FRONT || face === BACK){
				pointA.x = value;
				pointB.x = value;
			}
			else if (face === BOTTOM || face === TOP){
				pointA.y = value;
				pointB.y = value;
			}
			else if (face === LEFT || face === RIGHT){
				pointA.z = value;
				pointB.z = value;
			}
		}
		return [pointA, pointB];
	}

	this.getEdgePoint = function(faces, center){
		// Point on the center of specified edge
		var edgePoint = this.getPoint(faces); //WHAT IS THIS? never used....
		// Use center to get point on edge
		var points = this.getEdgeLineSegment(faces);
		var origin = points[0];
		var direction = points[1].clone().sub(points[0].clone()).normalize();
		var ray = new THREE.Ray(origin, direction);
		return ray.closestPointToPoint(center);
	}

	this.getPoint = function(faces){
		var bbox = this.getBoundingBox();
		var corner = _mesh.position.clone();
		for (var i in faces){
			var face = parseInt(faces[i]);
			switch (face){
				case FRONT:
					var frontX;
					if (side === "HOME"){
						frontX = bbox.max.x;
					}
					else if (side === "AWAY"){
						frontX = bbox.min.x;
					}
					corner.x = frontX;
					break;
				case BACK:
					var backX;
					if (side === "HOME"){
						backX = bbox.min.x;
					}
					else if (side === "AWAY"){
						backX = bbox.max.x;
					}
					corner.x = backX;
					break;
				case BOTTOM:
					corner.y = bbox.min.y;
					break;
				case TOP:
					corner.y = bbox.max.y;
					break;
				case LEFT:
					var leftZ;
					if (side === "HOME"){
						leftZ = bbox.max.z;
					}
					else if (side === "AWAY"){
						leftZ = bbox.min.z;
					}
					corner.z = leftZ;
					break;
				case RIGHT:
					var rightZ;
					if (side === "HOME"){
						rightZ = bbox.min.z;
					}
					else if (side === "AWAY"){
						rightZ = bbox.max.z;
					}
					corner.z = rightZ;
					break;
				default:
					break;
			}
		}
		return corner;
	}

	// TODO: Predict if it will hit in the next time-step
	this.fixCollisionPosition = function(basketball, step, hit){
		// TODO: NEED TO FIX (See Rim Torus collision detection)
		var bbox = this.getBoundingBox();
		var radius = basketball.getRadius();
		var center = basketball.getPosition();
		var direction = basketball.getVelocity().normalize();
		var faces = Object.keys(hit.points);
		var boxPoint, forwardPoint;
		if (hit.type !== "face"){
			// GET Box Point
			if (hit.type === "corner"){
				boxPoint = this.getPoint(faces);	
			}
			else if (hit.type === "edge"){
				boxPoint = this.getEdgePoint(faces, center);
			}

			// Find Forward Point
			var rayStart = boxPoint.clone().add(direction.clone().multiplyScalar(2*radius));
			var relativeStart = rayStart.clone().sub(center.clone());
			var rayDirection = direction.clone().multiplyScalar(-1);
			var ray = new THREE.Ray(rayStart, rayDirection);
			var a = rayDirection.lengthSq();
			var b = 2 * rayDirection.dot(relativeStart);
			var c = relativeStart.lengthSq() - Math.pow(radius, 2);
			var discriminant = Math.pow(b, 2) - (4 * a*c);
			var t = Infinity;
			if (discriminant > 0){
				var tempT = (-1.0*b - Math.sqrt(discriminant)) / (2.0*a);
				if (tempT >= 0 && tempT < t){
					t = tempT;
					var normalNew = relativeStart.clone().add(rayDirection.clone().multiplyScalar(t)).sub(center).normalize();
				}
				tempT = (-1.0*b + Math.sqrt(discriminant)) / (2.0*a);
				if (tempT >= 0 && tempT < t){
					t = tempT;
					var normalNew = relativeStart.clone().add(rayDirection.clone().multiplyScalar(t)).sub(center).normalize();
				}
			}
			if (t === Infinity){
				t = 0;
			}
			forwardPoint = ray.at(t);
		}
		else {
			// TODO: get normal of face
			var normal = this.getNormal(parseInt(Object.keys(hit.points)[0]));
			var rayDirection = normal.negate();
			var ray = new THREE.Ray(center.clone(), rayDirection.clone());
			boxPoint = ray.intersectBox(bbox);
			forwardPoint = center.clone().add(rayDirection.clone().multiplyScalar(radius));
		}
		var reverseDisplacement = boxPoint.clone().sub(forwardPoint.clone());
		basketball.addPosition(reverseDisplacement);
		return;

		// for (var face in hit.points){
		// 	switch (parseInt(face)){
		// 		case FRONT:
		// 			var newFront = 0;
		// 			if (side == "HOME"){
		// 				newFront = bbox.max.x + radius;
		// 			}
		// 			else if (side == "AWAY"){
		// 				newFront = bbox.min.x - radius;
		// 			}
		// 			center.x = newFront;
		// 			break;
		// 		case BACK:
		// 			var newBack = 0;
		// 			if (side == "HOME"){
		// 				newBack = bbox.min.x - radius;
		// 			}
		// 			else if (side == "AWAY"){
		// 				newBack = bbox.max.x + radius;
		// 			}
		// 			center.x = newBack;
		// 			break;
		// 		case TOP:
		// 			center.y = bbox.max.y + radius;
		// 			break;
		// 		case BOTTOM:
		// 			center.y = bbox.min.y - radius;
		// 			break;
		// 		case LEFT:
		// 			var newLeft = 0;
		// 			if (side == "HOME"){
		// 				newLeft = bbox.max.z + radius;
		// 			}
		// 			else if (side == "AWAY"){
		// 				newLeft = bbox.min.z - radius;
		// 			}
		// 			center.z = newLeft;
		// 			break;
		// 		case RIGHT:
		// 			var newRight = 0;
		// 			if (side == "AWAY"){
		// 				newRight = bbox.max.z + radius;
		// 			}
		// 			else if (side == "HOME"){
		// 				newRight = bbox.min.z - radius;
		// 			}
		// 			center.z = newRight;
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// }
		// basketball.setPosition(center);
	}

	this.getBounceVector = function(velocity, collisions){
		// Get R (velocity)
		var R = velocity.clone();

		// Calculate N
		// TODO: Weird for edges and corners
		var N = new THREE.Vector3();
		for (var face in collisions){
			var nComponent = this.getNormal(face);
			N.add(nComponent);
		}
		N.normalize();

		// R - 2*N*(N.R)
		var NR = N.clone().dot(R);
		var component = N.clone().multiplyScalar(2 * NR);
		var bounce = R.sub(component);

		// Loss of momentum (elasticity)
		bounce.multiplyScalar(ELASTICITY);
		return bounce;
	}

	function numValidDimensions(point, bbox){
		var p = point.clone();
		var bb = bbox.clone();
		var count = 0;
		count += (p.x >= bb.min.x && p.x <= bb.max.x) ? 1 : 0;
		count += (p.y >= bb.min.y && p.y <= bb.max.y) ? 1 : 0;
		count += (p.z >= bb.min.z && p.z <= bb.max.z) ? 1 : 0;
		return count;
	}

	this.hasCollision = function(basketball, hit){
		// Plane Information
		var position = _mesh.position.clone();
		var bbox = this.getBoundingBox();
		var normals = this.getNormals();
		var frontNormal = normals[FRONT];
		var backNormal = normals[BACK];
		var topNormal = normals[TOP];
		var bottomNormal = normals[BOTTOM];
		var leftNormal = normals[LEFT];
		var rightNormal = normals[RIGHT];

		var radius = basketball.getRadius();
		var center = basketball.getPosition();
		
		// FRONT and BACK
		var frontPoint = center.clone().sub(frontNormal.clone().multiplyScalar(radius)); // point on ball
		var backPoint = center.clone().sub(backNormal.clone().multiplyScalar(radius));

		// TOP and BOTTOM
		var topPoint = center.clone().sub(topNormal.clone().multiplyScalar(radius)); // point on ball
		var bottomPoint = center.clone().sub(bottomNormal.clone().multiplyScalar(radius));

		// SIDES
		var leftPoint = center.clone().sub(leftNormal.clone().multiplyScalar(radius)); // point on ball
		var rightPoint = center.clone().sub(rightNormal.clone().multiplyScalar(radius));


		var collision = bbox.distanceToPoint(center) <= radius;
		if (collision){
			if (hit === undefined){
				hit = {
					"type" : undefined,
					"points" : {}
				};
			}

			var countHash = {
				0 : {},
				1 : {},
				2 : {},
				3 : {}
			};

			frontCount = numValidDimensions(frontPoint, bbox);
			countHash[frontCount][FRONT] = frontPoint;

			backCount = numValidDimensions(backPoint, bbox);
			countHash[backCount][BACK] = backPoint;

			topCount = numValidDimensions(topPoint, bbox);
			countHash[topCount][TOP] = topPoint;

			bottomCount = numValidDimensions(bottomPoint, bbox);
			countHash[bottomCount][BOTTOM] = bottomPoint;

			leftCount = numValidDimensions(leftPoint, bbox);
			countHash[leftCount][LEFT] = leftPoint;

			rightCount = numValidDimensions(rightPoint, bbox);
			countHash[rightCount][RIGHT] = rightPoint;

			// Fill "hit" object
			for (var i = 3; i >= 0; i--){
				var nPoints = Object.keys(countHash[i]).length;
				if (countHash.hasOwnProperty(i) && Object.keys(countHash[i]).length > 0){
					switch (nPoints){
						case 1:
							hit["type"] = "face";
							break;
						case 2:
							hit["type"] = "edge";
							break;
						case 3:
							hit["type"] = "corner";
							break;
						default:
							break;
					}
					hit["points"] = countHash[i];
					break;
				}
			}
		}
		return collision;
	}

	this.getBoundingBox = function(){
		_mesh.geometry.computeBoundingBox();
		var bb = _mesh.geometry.boundingBox.clone();
		var xMin = bb.min.x;
		var zMin = bb.min.z;
		var xMax = bb.max.x;
		var zMax = bb.max.z;
		bb.min.x = zMin;
		bb.min.z = xMin;
		bb.max.x = zMax;
		bb.max.z = xMax;
		bb.min.add(_mesh.position.clone());
		bb.max.add(_mesh.position.clone());
		return bb;
	}

	this.getFaceBox = function(face){
		var normals = this.getNormals();
		switch (face){
			case FRONT:

		}
	}

	function init(side){
		// TODO: Unique texture for each side
		// Z+, Z-, Y+, Y-
		var materials = [
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-side.png'),
				shininess: 15
			}),
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-side.png'),
				shininess: 15
			}),
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-top.png'),
				shininess: 15
			}),
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-top.png'),
				shininess: 15
			}),
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-front.png'),
				shininess: 15
			}),
			new THREE.MeshPhongMaterial({
				map : THREE.ImageUtils.loadTexture('public/images/basketball-backboard-back.png'),
				shininess: 15
			})
		];
		var material = new THREE.MeshFaceMaterial(materials);
		var geometry = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH);
		if (side === "HOME"){
			_sideSign = -1;
		} else if (side == "AWAY"){
			_sideSign = 1;
		} else {
			return;
		}
		_mesh = new THREE.Mesh(geometry, material);
		_mesh.castShadow = false;
		_mesh.receiveShadow = true;
		_mesh.position.y = GROUND_DISTANCE; // Attachment Height - 1 inch
		_mesh.position.x = _sideSign * DISTANCE;
		_mesh.rotation.y = _sideSign * Math.PI / -2; // Depends on side
		_offset = _mesh.position.z;
	}

	init(side);

}