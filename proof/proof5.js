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

var EPS = 1 / (1 << 5);

function LazyBall(x, y, r, opts) {
	var x = x, y = y, r = r;
	var vx = 0, vy = 0;	

	this.getX = function() { return x };
	this.getY = function() { return y };
	this.getR = function() { return r };
	
	var P = this.P = function() { return [x, y] };
	var V = this.V = function() { return [vx, vy] };
	
	this.setX = function(_x) { x = _x };
	this.setY = function(_y) { y = _y };
	this.setR = function(_r) { r = _r };
	
	this.getOpts = function() { return opts; }
	
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
			arguments[i].redir(this);
			this.joint(arguments[i]);
		}
	};	
	
	var addForce = this.addForce = function(forceX, forceY) {
		vx += forceX;
		vy += forceY;
	}	
	
	this.update = function(dt) {
		var fx = 0, fy = 0;
		
		joints.some(function(joint) { joint.process(dt); })
		
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
	
	this.DistanceJoint = function(ball, minDist, maxDist) {
			this.redir = function(targetBall) {
				return new ball.DistanceJoint(targetBall, minDist, maxDist);
			}
			
	
			this.process = function(dt) {
				var dx = x - ball.getX();
				var dy = y - ball.getY();
				var d = Math.sqrt(dx*dx + dy*dy);
				
				if(maxDist && d - maxDist > EPS) {
					dx /= d;
					dy /= d;
		
					vx -= dx * (d - maxDist);
					vy -= dy * (d - maxDist);
				}	
				
				if(minDist && EPS < minDist - d) {
					dx /= d;
					dy /= d;
		
					vx += dx * (minDist - d);
					vy += dy * (minDist - d);
				}	
			}	
		}
		
	this.AngularJoint = function(leftBall, rightBall) {
		var angleL = VMath.angle(VMath.sub(leftBall.P(), P()), VMath.sub(leftBall.P(), rightBall.P()));
		
		var angleP = VMath.angle(VMath.sub(P(), leftBall.P()), VMath.sub(P(), rightBall.P()));
		var sinP = Math.sin(angleP);
		
		var angleR = Math.PI - angleL - angleP;
		var sinR = Math.sin(angleR);
	
		this.redir = function(targetBall) {
			return new leftBall.AngularJoint(targetBall, rightBall)
		}
		
		this.process = function(dt) {
			var lR = VMath.sub(leftBall.P(), rightBall.P());
			var dLR = VMath.length(lR);
			
			lR = VMath.normalize(lR);
			rP = VMath.rotate(lR, -angleL);
			
			var bP = VMath.sub(leftBall.P(), VMath.scale(rP, dLR * sinR / sinP));
			
			var V = VMath.sub(bP, P());
			var dV = VMath.length(V);
			if(dV > EPS) {
				V = VMath.normalize(V);
				addForce.apply(null, VMath.scale(V, Math.pow(dV, 0.9)));
			}
		}		
	}
}

var allBalls = [];

function makeStruct(centerX, centerY, structWidth, structHeight, opts) {
	var R = 8;
	var D = R*2.005;

	var balls = [];
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) 
			balls.push(new LazyBall(x*D + centerX, y*D + centerY, R, opts));
	for(var y = 0; y < structHeight; y++)
		for(var x = 0; x < structWidth; x++) { 
			var ball = balls[y*structWidth+x];
			
			for(var dx = -1; dx <= 1; dx++)
				for(var dy = -1; dy <= 1; dy++) {
					if(x+dx < 0 || x+dx >= structWidth || y+dy < 0 || y+dy >= structHeight)
						continue;
					var dBall = balls[(y+dy)*structWidth+(x+dx)];
					if(dBall && dBall!=ball && dx*dy==0)
						dBall.joint(new dBall.DistanceJoint(ball, (D+1/D), D));
					else if(dBall && dBall!=ball && Math.abs(dx)*Math.abs(dy)==1)
						dBall.joint(new dBall.DistanceJoint(ball, (D+1/D) * Math.sqrt(2), D * Math.sqrt(2)));
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
					ball.joint(new ball.AngularJoint(ballLeft, ballRight));				
			});
	}
		
	var topLeft = balls[0];
	var topRight = balls[structWidth-1];
	var bottomLeft = balls[structWidth*(structHeight-1)]; 
	var bottomRight = balls[structWidth*(structHeight-1)+structWidth-1];
	
	var axisDist = (structWidth-1)*D;
	var crossDist = (structWidth-1)*D * Math.sqrt(2);
		
	// distance joints
	topLeft.biJoint(new topLeft.DistanceJoint(topRight, axisDist+1/axisDist, axisDist));
	topLeft.biJoint(new topLeft.DistanceJoint(bottomLeft, axisDist+1/axisDist, axisDist));
	topLeft.biJoint(new topLeft.DistanceJoint(bottomRight, crossDist+Math.sqrt(2), crossDist));
	
	topRight.biJoint(new topRight.DistanceJoint(bottomRight, axisDist+1/axisDist, axisDist));
	topRight.biJoint(new topRight.DistanceJoint(bottomLeft, crossDist+Math.sqrt(2)/crossDist, crossDist));
	
	bottomRight.biJoint(new bottomRight.DistanceJoint(bottomLeft, axisDist+1/axisDist, axisDist));
	
	// angular joints
	topLeft.biJoint(new topLeft.AngularJoint(bottomLeft, topRight));
	topRight.biJoint(new topRight.AngularJoint(topLeft, bottomRight));
//
	bottomLeft.biJoint(new bottomLeft.AngularJoint(topLeft, bottomRight));
	bottomRight.biJoint(new bottomRight.AngularJoint(bottomLeft, topRight));

	allBalls.push.apply(allBalls, balls);
	
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

	allBalls.some(function(ball) {
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
	allBalls.filter(function(ball) { return ball.distance(x, y) < 10 }).some(function(ball) {
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
		if(!allBalls[0])
			return;
		
		var a = Math.atan2(allBalls[0].getY() - allBalls[3].getY(),
						  allBalls[0].getX() - allBalls[3].getX());		
		
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