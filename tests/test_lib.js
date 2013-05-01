(function(global) {
	var canvas = document.createElement('canvas');
	canvas.width = 512;
	canvas.height = 512;
	document.querySelector('body').appendChild(canvas);
	var ctx = canvas.getContext('2d');
	
	global.clearCanvas = function() {
		ctx.clearRect(0, 0, 512, 512);
	}
	
	global.drawRect = function(x, y, w, h, color) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x+256, y+256, w, h, 0, 360);
		ctx.closePath();
		ctx.fill();
	}
	
	global.getCanvas = function() { return canvas; }
})(this);

var lW = new LazyWorld();

function makeStruct(centerX, centerY, structWidth, structHeight, opts) {
	var R = 8;
	var D = R*2.005;

	var balls = [];
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) 
			balls.push(new lW.LazyBall(x*D + centerX, y*D + centerY, R, opts));
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) { 
			var ball = balls[y*structWidth+x];
			
			for(var dx = -1; dx <= 1; dx++)
				for(var dy = -1; dy <= 1; dy++) {
					if(x+dx < 0 || x+dx >= structWidth || y+dy < 0 || y+dy >= structHeight)
						continue;
					var dBall = balls[(y+dy)*structWidth+(x+dx)];
					if(dBall && dBall!=ball && dx*dy==0)
						dBall.joint(new DistanceJoint(dBall, ball, (D+1/D), D));
					else if(dBall && dBall!=ball && Math.abs(dx)*Math.abs(dy)==1)
						dBall.joint(new DistanceJoint(dBall, ball, (D+1/D) * Math.sqrt(2), D * Math.sqrt(2)));
				}

			[[[-1,0],[0,-1]], [[0,-1],[1,0]], [[1,0],[0,1]], [[0,1],[-1,0]]].some(function(dv) {
				if(dv.some(function(d) {
					var dx = d[0];
					var dv = d[1];
					return (x+dx < 0 || x+dx >= structWidth || y+dy < 0 || y+dy >= structHeight);
				}))
					return;					
				
				var ballLeft = balls[(y+dv[0][1])*structWidth+x+dv[0][0]];
				var ballRight = balls[(y+dv[1][1])*structWidth+x+dv[1][0]];
				if(ballLeft && ballRight)
					ball.joint(new AngularJoint(ball, ballLeft, ballRight));				
			});
	}
		
	var topLeft = balls[0];
	var topRight = balls[structWidth-1];
	var bottomLeft = balls[structWidth*(structHeight-1)]; 
	var bottomRight = balls[structWidth*(structHeight-1)+structWidth-1];
	
	var axisDist = (structWidth-1)*D;
	var crossDist = (structWidth-1)*D * Math.sqrt(2);
		
	// distance joints
	topLeft.biJoint(new DistanceJoint(topLeft, topRight, axisDist+1/axisDist, axisDist));
	topLeft.biJoint(new DistanceJoint(topLeft, bottomLeft, axisDist+1/axisDist, axisDist));
	topLeft.biJoint(new DistanceJoint(topLeft, bottomRight, crossDist+Math.sqrt(2), crossDist));
	
	topRight.biJoint(new DistanceJoint(topRight, bottomRight, axisDist+1/axisDist, axisDist));
	topRight.biJoint(new DistanceJoint(topRight, bottomLeft, crossDist+Math.sqrt(2)/crossDist, crossDist));
	
	bottomRight.biJoint(new DistanceJoint(bottomRight, bottomLeft, axisDist+1/axisDist, axisDist));
	
	// angular joints
	topLeft.biJoint(new AngularJoint(topLeft, bottomLeft, topRight));
	topRight.biJoint(new AngularJoint(topRight, topLeft, bottomRight));
//
	bottomLeft.biJoint(new AngularJoint(bottomLeft, topLeft, bottomRight));
	bottomRight.biJoint(new AngularJoint(bottomRight, bottomLeft, topRight));

	lW.balls.push.apply(lW.balls, balls);
	
	return balls;
}	
		
var struct1 = makeStruct(-150, -150, 6, 6, 'red');
var struct2 = makeStruct(-40, -20, 6, 6, 'blue');

// animation

(function() {
	var requestAnimationFrame = window.requestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

var alignFns = [];

function render() {
	clearCanvas();			

	lW.balls.some(function(ball) {
		ball.update(0.5);
		drawRect(ball.getX()-ball.getR(), ball.getY()-ball.getR(), ball.getR(), ball.getR(), ball.getOpts());
	});

	alignFns.some(function(fn){fn()});

	requestAnimationFrame(render)
}

render();

getCanvas().addEventListener('mousedown', function(event) {
	var x = (event.x - 256);
	var y = (event.y - 256);
	lW.balls.filter(function(ball) { return ball.distance(x, y) < 10 }).some(function(ball) {
//		alignFns.push(function() {
			ball.setX(x);
			ball.setY(y);
//		});
		
		
		return true;
	});
});

(function() {
	var ballLeft = struct1.slice(1, 17);
	var ballRight = struct1.slice(18, 36)
	var alignX = 0, alignY = 0;
	var F = 5;
	alignFns.push(function() {	
		if(!lW.balls[0])
			return;
		
		var a = Math.atan2(lW.balls[0].getY() - lW.balls[3].getY(),
						  lW.balls[0].getX() - lW.balls[3].getX());		
		
		ballLeft.some(function(ball) { 
			ball.addForce(Math.cos(a)*alignY*F, Math.sin(a)*alignY*F)
			ball.addForce(Math.cos(a)*alignX*F, Math.sin(a)*alignX*F);
		});		
		ballRight.some(function(ball) { 
			ball.addForce(Math.cos(a)*alignY*F, Math.sin(a)*alignY*F);		
			ball.addForce(-Math.cos(a)*alignX*F, -Math.sin(a)*alignX*F);
		});
	});
	
	window.addEventListener('keydown', function(event) {
		if(event.keyCode == 38)
			alignY = -1;
		else if(event.keyCode == 40)
			alignY = 1;
		
		if(event.keyCode == 37)
			alignX = -1;
		else if(event.keyCode == 39)
			alignX = 1;
	})
	
	window.addEventListener('keyup', function(event) {
		if(event.keyCode == 38 || event.keyCode == 40)
			alignY = 0;
		
		if(event.keyCode == 37 ||event.keyCode == 39)
			alignX = 0;
	})	
})();