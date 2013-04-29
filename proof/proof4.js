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
		ctx.fillRect(x+256, y+256, w, h);
	}
	
	global.getCanvas = function() { return canvas; }
})(this);

var EPS = 1 / (1 << 5);

function LazyBall(x, y, r) {
	this.getX = function() { return x };
	this.getY = function() { return y };
	this.getR = function() { return r };
	this.setX = function(_x) { x = _x };
	this.setY = function(_y) { y = _y };
	this.setR = function(_r) { r = _r };
	
	this.distance = function(_x, _y) {
		return Math.sqrt(Math.pow(x-_x,2)+Math.pow(y-_y,2));
	}	
	
	var joints = []; 

	this.joint = function() {
		for(var i = 0; i < arguments.length; i++)
			joints.push(arguments[i])
	};	
	
	this.biJoint = function() {
		for(var i = 0; i < arguments.length; i++) {
			arguments[i].getBall().joint(new LazyJoint(this, arguments[i].getMinDist(), arguments[i].getMaxDist()));
			this.joint(arguments[i]);
		}
	};	
	
	var vx = 0, vy = 0;
	
	this.addForce = function(forceX, forceY) {
		vx += forceX;
		vy += forceY;
	}	
	
	this.update = function(dt) {
		var fx = 0, fy = 0;
		
		joints.some(function(joint) {
			var ball = joint.getBall();
			var minDist = joint.getMinDist();
			var maxDist = joint.getMaxDist();
		
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx*dx + dy*dy);
			
			if(maxDist && d - maxDist > EPS) {
				dx /= d;
				dy /= d;

				vx -= dx * dt * Math.pow(d/maxDist, 10);
				vy -= dy * dt * Math.pow(d/maxDist, 10);
			}	
			
			if(minDist && EPS < minDist - d) {
				dx /= d;
				dy /= d;

				vx += dx * dt * Math.pow(d/minDist, 10);
				vy += dy * dt * Math.pow(d/minDist, 10);
			}				
		});		
		
		allBalls.some(function(ball) {
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx*dx + dy*dy);
			
			if(d > 0 && EPS < r + ball.getR() - d) {
				dx /= d;
				dy /= d;

				vx += dx * dt * 20;
				vy += dy * dt * 20;
			}	
		});
		
		vx *= 0.1;
		vy *= 0.1;
		
		x += vx*dt;
		y += vy*dt;
	}	
}

function LazyJoint(ball, minDist, maxDist) {
	this.getBall = function() { return ball };
	this.getMinDist = function() { return minDist };
	this.getMaxDist = function() { return maxDist };
}



var allBalls = [];

function makeStruct(centerX, centerY, structWidth, structHeight) {
	var R = 5;
	var D = R*2.005;

	var balls = [];
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) 
			balls.push(new LazyBall(x*D + centerX, y*D + centerY, R));
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) { 
			var ball = balls[y*structWidth+x];
			
			for(var dx = -1; dx <= 1; dx++)
				for(var dy = -1; dy <= 1; dy++) {
					if(x+dx < 0 || x+dx >= structWidth || y+dy < 0 || y+dy >= structHeight)
						continue;
					var dBall = balls[(y+dy)*structWidth+(x+dx)];
					if(dBall && dBall!=ball && dx*dy==0)
						dBall.biJoint(new LazyJoint(ball, (D+1/D), D));
					else if(dBall && dBall!=ball && Math.abs(dx)*Math.abs(dy)==1)
						dBall.biJoint(new LazyJoint(ball, (D+1/D) * Math.sqrt(2), D * Math.sqrt(2)));
				}
	}
		
	var topLeft = 0;
	var topRight = structWidth-1;
	var bottomLeft = structWidth*(structHeight-1); 
	var bottomRight = structWidth*(structHeight-1)+structWidth-1;
	
	var axisDist = (structWidth-1)*D;
	var crossDist = (structWidth-1)*D * Math.sqrt(2);
		
	balls[topLeft].biJoint(new LazyJoint(balls[topRight], axisDist+1/axisDist, axisDist));
	balls[topLeft].biJoint(new LazyJoint(balls[bottomLeft], axisDist+1/axisDist, axisDist));
	balls[topLeft].biJoint(new LazyJoint(balls[bottomRight], crossDist+Math.sqrt(2), crossDist));
	
	balls[topRight].biJoint(new LazyJoint(balls[bottomRight], axisDist+1/axisDist, axisDist));
	balls[topRight].biJoint(new LazyJoint(balls[bottomLeft], crossDist+Math.sqrt(2)/crossDist, crossDist));
	
	balls[bottomRight].biJoint(new LazyJoint(balls[bottomLeft], axisDist+1/axisDist, axisDist));

	allBalls.push.apply(allBalls, balls);
	
	return balls;
}	
		
var struct1 = makeStruct(-150, -150, 12, 12);
var struct2 = makeStruct(-40, -20, 12, 12);

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

	allBalls.some(function(ball) {
		ball.update(0.5);
		drawRect(ball.getX()-ball.getR(), ball.getY()-ball.getR(), ball.getR()*2, ball.getR()*2, 'red');
	});

	alignFns.some(function(fn){fn()});

	requestAnimationFrame(render)
}

render();

getCanvas().addEventListener('mousedown', function(event) {
	var x = (event.x - 256);
	var y = (event.y - 256);
	allBalls.filter(function(ball) { return ball.distance(x, y) < 10 }).some(function(ball) {
//		alignFns.push(function() {
			ball.setX(x);
			ball.setY(y);
//		});
		
		
		return true;
	});
});

(function() {
	var ballLeft = struct1.slice(0, 12);
	var ballRight = struct1.slice(12*11, 12*11+12)
	var alignX = 0, alignY = 0;
	alignFns.push(function() {		
		var a = Math.atan2(allBalls[0].getY() - allBalls[11].getY(),
						  allBalls[0].getX() - allBalls[11].getX());		
		
		ballLeft.some(function(ball) { 
			ball.addForce(Math.cos(a)*alignY*10, Math.sin(a)*alignY*10)
			ball.addForce(Math.cos(a)*alignX*10, Math.sin(a)*alignX*10);
		});		
		ballRight.some(function(ball) { 
			ball.addForce(Math.cos(a)*alignY*10, Math.sin(a)*alignY*10);		
			ball.addForce(-Math.cos(a)*alignX*10, -Math.sin(a)*alignX*10);
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