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

function LazyBall(x, y, r) {
	this.getX = function() { return x };
	this.getY = function() { return y };
	this.getR = function() { return r };
	this.setX = function(_x) { x = _x };
	this.setY = function(_y) { y = _y };
	this.setR = function(_r) { r = _r };
	
	var joints = []; 

	this.joint = function() {
		for(var i = 0; i < arguments.length; i++)
			joints.push(arguments[i])
	};	
	
	this.update = function(dt) {
		var fx = 0, fy = 0;
		
		joints.some(function(ball) {
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx*dx + dy*dy);
			
			if(d > r + ball.getR()) {
				dx /= d;
				dy /= d;

				x -= dx * dt * Math.pow(d/10, 2);
				y -= dy * dt * Math.pow(d/10, 2);
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

var ball1 = new LazyBall(-20, 0, 5);  var ball4 = new LazyBall(20, 0, 5);
var ball2 = new LazyBall(-20, 20, 5); var ball5 = new LazyBall(20, 20, 5);
var ball3 = new LazyBall(-20, 40, 5); var ball6 = new LazyBall(20, 40, 5);




ball1.joint(		ball2,			ball4);
ball2.joint(ball1,			ball3,			ball5);
ball3.joint(		ball2,							ball6);
ball4.joint(ball1,							ball5);
ball5.joint(		ball2,			ball4,			ball6);
ball6.joint(				ball3,			ball5, 	ball6);


var balls = [ ball1, ball2, ball3, ball4, ball5, ball6 ];

var oBall1 = new LazyBall(-20, 0, 5);
var oBall2 = new LazyBall(20, 0, 5);
var oBall3 = new LazyBall(0, 20, 5);

oBall1.joint(oBall2, oBall3);
oBall2.joint(oBall1, oBall3);
oBall3.joint(oBall1, oBall2);

var otherBalls = [ oBall1, oBall2, oBall3 ];

var allBalls = balls.concat(otherBalls);


// animation

(function() {
	var requestAnimationFrame = window.requestAnimationFrame
			|| window.mozRequestAnimationFrame
			|| window.webkitRequestAnimationFrame
			|| window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

var myBallX = ball1.getX();
var myBallY = ball1.getY();

function render() {
	clearCanvas();

	balls.some(function(ball) {
		ball.update(0.5);
		drawRect(ball.getX()-ball.getR(), ball.getY()-ball.getR(), ball.getR()*2, ball.getR()*2, 'red');
	});
	
	otherBalls.some(function(ball) {
		ball.update(0.5);
		drawRect(ball.getX()-ball.getR(), ball.getY()-ball.getR(), ball.getR()*2, ball.getR()*2, 'red');
	});
	
	ball1.setX(myBallX);
	ball1.setY(myBallY);
	
	requestAnimationFrame(render)
}

render();

getCanvas().addEventListener('mousemove', function(event) {
	myBallX = (event.x - 256);
	myBallY = (event.y - 256);
})
