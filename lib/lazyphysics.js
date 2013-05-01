(function(global) {
	global.LazyWorld = function() {
		var balls = this.balls = [];
				
		this.LazyBall = function(x, y, r, opts) {
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
				joints.some(function(joint) {
					joint.process(dt);
				})

				balls.some(function(ball) {
					var dx = x - ball.getX();
					var dy = y - ball.getY();
					var d = Math.sqrt(dx * dx + dy * dy);

					if (d > 0 && VMath.EPSILON < r + ball.getR() - d) {
						dx /= d;
						dy /= d;

						vx += dx * dt * 20;
						vy += dy * dt * 20;
					}
				});

				vx *= 0.05;
				vy *= 0.05;

				x += vx * dt;
				y += vy * dt;
			}
			
		}

	}
})(this);