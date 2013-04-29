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

var EPS = 1 / (1 << 10);

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

				x -= dx * dt * Math.pow(d/maxDist, 2);
				y -= dy * dt * Math.pow(d/maxDist, 2);
			}	
			
			if(minDist && EPS < minDist - d) {
				dx /= d;
				dy /= d;

				x += dx * dt * Math.pow(d/minDist, 2);
				y += dy * dt * Math.pow(d/minDist, 2);
			}	
		});		
		
		allBalls.some(function(ball) {
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx*dx + dy*dy);
			
			if(d > 0 && d < r + ball.getR()) {
				dx /= d;
				dy /= d;

				x += dx * dt;
				y += dy * dt;
			}	
		});
	}	
}

function LazyJoint(ball, minDist, maxDist) {
	this.getBall = function() { return ball };
	this.getMinDist = function() { return minDist };
	this.getMaxDist = function() { return maxDist };
}



var allBalls = [];

function makeStruct(centerX, centerY, structWidth, structHeight) {
	var balls = [];
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) 
			balls.push(new LazyBall(x*15 + centerX, y*15 + centerY, 5));
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) { 
			var ball = balls[y*structWidth+x];
			
			for(var dx = -1; dx < 1; dx++)
				for(var dy = -1; dy < 1; dy++) {
					var dBall = balls[(y+dy)*structWidth+(x+dx)];
					if(dBall && dBall!=ball && dx!=dy)
						dBall.biJoint(new LazyJoint(ball, 11, 11));
					else if(dBall && dBall!=ball && Math.abs(dx)!=Math.abs(dy))
						dBall.biJoint(new LazyJoint(ball, 11 * Math.sqrt(2), 11 * Math.sqrt(2)));
				}
	}
		
	var topLeft = 0;
	var topRight = structWidth;
	var bottomLeft = structWidth*(structHeight-1) 
	var bottomRight = structWidth*(structHeight-1)+structWidth-1;
	
	var axisDist = structWidth*30;
	var crossDist = structWidth*30 * Math.sqrt(2);
		
	balls[topLeft].biJoint(new LazyJoint(balls[topRight], axisDist, axisDist));
	balls[topLeft].biJoint(new LazyJoint(balls[bottomLeft], axisDist, axisDist));
	balls[topLeft].biJoint(new LazyJoint(balls[bottomRight], crossDist, crossDist));
	
	balls[topRight].biJoint(new LazyJoint(balls[bottomRight], axisDist, axisDist));
	balls[topRight].biJoint(new LazyJoint(balls[bottomLeft], crossDist, crossDist));
	
	balls[bottomRight].biJoint(new LazyJoint(balls[bottomLeft], axisDist, axisDist));

	allBalls.push.apply(allBalls, balls);
}	
		
makeStruct(-150, -150, 12, 12);
makeStruct(50, 50, 12, 12);

// animation

(function() {
	var requestAnimationFrame = window.requestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

function render() {
	clearCanvas();

	allBalls.some(function(ball) {
		ball.update(0.5);
		drawRect(ball.getX()-ball.getR(), ball.getY()-ball.getR(), ball.getR()*2, ball.getR()*2, 'red');
	});
	
	requestAnimationFrame(render)
}

render();

getCanvas().addEventListener('mousemove', function(event) {
	var x = (event.x - 256);
	var y = (event.y - 256);
	allBalls.filter(function(ball) { return ball.distance(x, y) < 10 }).some(function(ball) {
		ball.setX(x);
		ball.setY(y);
	});
})
