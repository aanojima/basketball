const KNOTS_PER_LAYER = 12;

function Net(side){

	const TOP_RADIUS = INCHES(9);
	const BOTTOM_RADIUS = INCHES(5.75);
	const HEIGHT = INCHES();
	const TOP_LAYER_SPACING = INCHES(4);
	const LAYER_SPACING = INCHES(1.5);
	const KNOT_LAYERS = 6; // plus ones on top and ones on bottom
	const ANGLE_STEP = (2.0 * Math.PI / KNOTS_PER_LAYER);
	const DISTANCE = FEET(42) - INCHES(4) - TOP_RADIUS; // Backboard Depth
	
	const KNOT_MASS = 0.002; // TODO
	const LINE_MASS = 0.005; // TODO
	
	const KD = 0.115; // TODO
	const KSST = 0.7;
	const TOP_RST = 0.5*TOP_LAYER_SPACING;
	const RST = 0.5*LAYER_SPACING;

	// TODO: See Object3D Group (group.add)
	var _knotMeshes, _lineMeshes, _group;

	this.getMesh = function(){
		return _group;
	}

	this.getKnots = function(){
		return _knots;
	}

	this.getLines = function(){
		return _lines;
	}

	this.getKnot = function(layer,index){
		// I is the Layer
		// J is the Knot
		return _knots[layer*KNOTS_PER_LAYER + index];
	}

	this.addKnotPosition = function(i,a,b,c){
		var knot = _knots[i];
		knot.addPosition(a,b,c);
	}

	this.addKnotVelocity = function(i,a,b,c){
		var knot = _knots[i];
		knot.addVelocity(a,b,c);
	}

	function getLine(layer,index){
		// I is the layer
		// J is the knot
		return _lines[layer*KNOTS_PER_LAYER + index];
	}

	this.handleCollision = function(basketball){
		// TODO
	}

	this.computeSpring = function(k, r, layer1, index1, layer2, index2){
		var knotA = this.getKnot(layer1, index1);
		var knotB = this.getKnot(layer2, index2);
		var d = knotA.getPosition().sub(knotB.getPosition());
		return d.clone().normalize().multiplyScalar(-1*k*(d.length() - r));
	}

	this.evalF = function(){
		var F = {
			'v' : [],
			'a' : []
		};
		for (var i in _knots){

			// i,j subscripts
			var iLayer = Math.floor(i / KNOTS_PER_LAYER );
			var jIndex = i % KNOTS_PER_LAYER;

			// For Top "Fixed" Knots, Ignore
			if (iLayer == 0){
				F['v'].push(new THREE.Vector3());
				F['a'].push(new THREE.Vector3());
				continue;
			}

			// Other Knots
			var knot = _knots[i];

			// For Rest, Calculate Gravity, Drag, Spring
			var x = knot.getPosition();
			var v = knot.getVelocity();

			F['v'].push(v); // position derivatives (velocity)

			var netForce = new THREE.Vector3();

			// Gravity
			var gravityForce = (new THREE.Vector3(0,-1,0)).multiplyScalar(METERS(9.8) * KNOT_MASS);
			netForce.add(gravityForce);

			// Drag
			var dragForce = v.clone().negate().multiplyScalar(KD)
			netForce.add(dragForce);

			// Spring Force
			var springForce = new THREE.Vector3();

			// TODO: Structural Spring
			var jAdj = KNOTS_PER_LAYER + 1;
			if ((iLayer % 2) == 0){
				jAdj = KNOTS_PER_LAYER - 1;
			}
			var rst = iLayer - 1 == 0 ? TOP_RST : RST;
			springForce.add(this.computeSpring(KSST, rst, iLayer, jIndex, iLayer - 1, jIndex));
			springForce.add(this.computeSpring(KSST, rst, iLayer, jIndex, iLayer - 1, (jIndex + jAdj) % KNOTS_PER_LAYER ));
			if (iLayer < KNOT_LAYERS){
				// Not at Bottom
				springForce.add(this.computeSpring(KSST, RST, iLayer, jIndex, iLayer + 1, jIndex));
				springForce.add(this.computeSpring(KSST, RST, iLayer, jIndex, iLayer + 1, (jIndex + jAdj) % KNOTS_PER_LAYER ));
			}

			netForce.add(springForce);

			knot.setForce(netForce);
			F['a'].push(netForce.divideScalar(KNOT_MASS));
		}
		return F;
	}

	this.updateLines = function(){
		_lines.forEach(function(line,i){
			line.getMesh().geometry.verticesNeedUpdate = true;
		});
	}

	function changePosition(dx,dy,dz){
		for (var i in _knots){
			var knot = _knots[i].getMesh();
			knot.position.x += dx;
			knot.position.y += dy;
			knot.position.z += dz;
		}
	}

	this.changePosition = changePosition;
	var getKnot = this.getKnot;

	function init(side){
		_knots = [];
		_lines = [];
		_group = new THREE.Object3D();

		// TOP FIXED LAYER
		for (var i = 0; i < KNOTS_PER_LAYER; i++){
			var angle = i * ANGLE_STEP;
			var x = TOP_RADIUS * Math.cos(angle);
			var z = TOP_RADIUS * Math.sin(angle);
			var knot = new Knot(x,0,z,true);
			_knots.push(knot);
			_group.add(knot.getMesh());
		}

		// OTHER LAYERS
		for (var j = 0; j < KNOT_LAYERS + 1; j++){
			var y = -1*TOP_LAYER_SPACING - j * LAYER_SPACING;
			var startAngle = ((j + 1)  % 2) * 0.5 * ANGLE_STEP;
			var radius = Math.exp(j / (-4 * KNOTS_PER_LAYER)) * BOTTOM_RADIUS; // TODO: Depends on some function
			for (var i = 0; i < KNOTS_PER_LAYER; i++){
				var angle = startAngle + i * ANGLE_STEP;
				var x = radius * Math.cos(angle);
				var z = radius * Math.sin(angle);
				var knot = new Knot(x,y,z,false);
				_knots.push(knot);
				_group.add(knot.getMesh());
				
				// First Diagonal
				// 0,0 <=> 0
				var previousKnotA = getKnot(j,i);
				var lineA = new Line(previousKnotA, knot);
				_lines.push(lineA);
				_group.add(lineA.getMesh());

				// Second Diagonal
				var indexOffset = (j % 2 == 0) ? 1 : KNOTS_PER_LAYER - 1;
				var previousKnotB = getKnot(j,(i+indexOffset) % KNOTS_PER_LAYER);
				var lineB = new Line(previousKnotB, knot);
				_lines.push(lineB);
				_group.add(lineB.getMesh());
			}
		}

		var sideSign;
		if (side === "HOME"){
			sideSign = -1;
		} else if (side == "AWAY"){
			sideSign = 1;
		} else {
			return;
		}
		changePosition(sideSign * DISTANCE,FEET(10),0);

	}

	init(side);
}

function Knot(x,y,z,fixed){

	// TODO: Make knot another line with top and bottom
	// see https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTgLCQJeOoxHAPyAAEoFc12kLYaLipYL2tq0lVJR9LvDQD8kWMe8A
	const KNOT_RADIUS = INCHES(0.1);

	var _mesh, _state, _force, _fixed;

	this.getMesh = function(){
		return _mesh;
	}

	this.getPosition = function(){
		return _state[0].clone();
	}

	this.addPosition = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			// Vector
			_mesh.position.x += a.x;
			_mesh.position.y += a.y;
			_mesh.position.z += a.z;
		}
		else if (a !== undefined && b !== undefined && c !== undefined){
			// Values
			_mesh.position.x += a;
			_mesh.position.y += b;
			_mesh.position.z += c;
		}	
	}

	this.getVelocity = function(){
		return _state[1].clone();
	}

	this.addVelocity = function(a,b,c){
		if (a !== undefined && b === undefined && c === undefined){
			// Vector
			_state[1].x += a.x;
			_state[1].y += a.y;
			_state[1].z += a.z;
		}
		else if (a !== undefined && b !== undefined && c !== undefined){
			// Values
			_state[1].x += a;
			_state[1].y += b;
			_state[1].z += c;
		}	
	}

	this.getForce = function(){
		return _force.clone();
	}

	this.setForce = function(force){
		_force = force;
	}

	this.handleCollision = function(basketball, step){
		var bRadius = basketball.getRadius();
		var kRadius = KNOT_RADIUS;
		var bPos = basketball.getPosition();
		var kPos = this.getPosition();
		var bMass = basketball.getMass();
		var bVel = basketball.getVelocity()
		var bDir = bVel.clone().normalize();
		var bSpeed = bVel.clone().length();
		var intersection = bPos.clone().sub(kPos.clone()).length() <= bRadius + kRadius;
		if (intersection && !_fixed){
			// Project knot to surface of basketball
			var vec = kPos.clone().sub(bPos.clone());
			var dir = vec.clone().normalize();
			var dist = (bRadius + kRadius) - vec.length();
			var maxOffset = 0.5 * kRadius; // TODO
			var ratio = 1 - dir.clone().dot(bDir.clone()); // TODO
			var projectVec = dir.clone().multiplyScalar(dist + ratio * maxOffset);
			this.addPosition(projectVec);

			// Set Basketball Velocity a little lower (in opposite direction)
			var relForce = this.getForce().length();
			// var scale = 0.001; // TODO
			var bRevVel = dir.clone().negate().multiplyScalar((relForce / (bMass * step)));
			// basketball.addVelocity(bRevVel);
			return { "intersection" : intersection, "reverse-velocity" : bRevVel };
		}
		return { "intersection" : intersection };
	}

	function init(x,y,z,fixed){
		_fixed = fixed;
		var geometry = new THREE.SphereGeometry(KNOT_RADIUS, 32, 32);
		var material = new THREE.MeshBasicMaterial({
			color: 0xffffff
		});
		_mesh = new THREE.Mesh(geometry, material);
		_mesh.position.set(x,y,z);
		_mesh.castShadow = false;
		_mesh.receiveShadow = false;

		_state = [
			_mesh.position,
			new THREE.Vector3()
		];
		_force = new THREE.Vector3();
	}

	init(x,y,z,fixed);
}

function Line(knotA,knotB){
	const SPRING_CONSTANT = 0.25; // TODO

	var _mesh, _knotA, _knotB;

	this.getMesh = function(){
		return _mesh;
	}

	this.getKnots = function(){
		return [_knotA, _knotB];
	}

	this.update = function(){
		_mesh.geometry.verticesNeedUpdate = true;
	}

	function init(knotA,knotB){
		_knotA = knotA;
		_knotB = knotB;
		var geometry = new THREE.Geometry();
		geometry.vertices.push(
			knotA.getMesh().position,
			knotB.getMesh().position
		);

		var material = new THREE.LineBasicMaterial({
			color : 0xffffff,
			linewidth : INCHES(1),
			side: THREE.DoubleSide
		});

		_mesh = new THREE.Line(geometry, material);
		_mesh.castShadow = false;
		_mesh.receiveShadow = true;
	}

	init(knotA, knotB);
}
