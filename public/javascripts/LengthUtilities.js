function CM(cm){
	// ADJUST SCALE FOR LENGTH:PIXEL RATIO
	var SCALE = 0.3;
	return SCALE * cm;
}

function METERS(m){
	return CM(100.0 * m);
}

function INCHES(inches){
	return CM(2.54 * inches);
}

function FEET(feet){
	return INCHES(12.0 * feet);
}

function PIXEL2FEET(pixel){
	return pixel / (0.3 * 2.54 * 12);
}