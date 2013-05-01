function LazyBall(x, y, r, opts) {
	var x = x, y = y, r = r;
	var vx = 0, vy = 0;

	this.getX = function() {
		return x
	};
	this.getY = function() {
		return y
	};
	this.getR = function() {
		return r
	};

	var P = this.P = function() {
			return [x, y]
		};
	var V = this.V = function() {
			return [vx, vy]
		};

	this.setX = function(_x) {
		x = _x
	};
	this.setY = function(_y) {
		y = _y
	};
	this.setR = function(_r) {
		r = _r
	};

	this.getOpts = function() {
		return opts;
	}

	this.distance = function(_x, _y) {
		return Math.sqrt(Math.pow(x - _x, 2) + Math.pow(y - _y, 2));
	}

	var joints = [];

	this.joint = function() {
		for (var i = 0; i < arguments.length; i++)
			joints.push(arguments[i])
	};

	this.biJoint = function() {
		for (var i = 0; i < arguments.length; i++) {
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

		joints.some(function(joint) {
			joint.process(dt);
		})

		allBalls.some(function(ball) {
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx * dx + dy * dy);

			if (d > 0 && EPS < r + ball.getR() - d) {
				dx /= d;
				dy /= d;

				vx += dx * dt * 20;
				vy += dy * dt * 20;
			}
		});

		vx *= 0.1;
		vy *= 0.1;

		x += vx * dt;
		y += vy * dt;
	}

	this.DistanceJoint = function(ball, minDist, maxDist) {
		this.redir = function(targetBall) {
			return new ball.DistanceJoint(targetBall, minDist, maxDist);
		}

		this.process = function(dt) {
			var dx = x - ball.getX();
			var dy = y - ball.getY();
			var d = Math.sqrt(dx * dx + dy * dy);

			if (maxDist && d - maxDist > EPS) {
				dx /= d;
				dy /= d;

				vx -= dx * (d - maxDist);
				vy -= dy * (d - maxDist);
			}

			if (minDist && EPS < minDist - d) {
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
			if (dV > EPS) {
				V = VMath.normalize(V);
				addForce.apply(null, VMath.scale(V, Math.pow(dV, 0.9)));
			}
		}
	}
}
