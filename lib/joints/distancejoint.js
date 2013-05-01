(function(global) {
	global.DistanceJoint = function(contextBall, ball, minDist, maxDist) {
		this.redir = function(targetBall) {
			return new DistanceJoint(contextBall, targetBall, minDist, maxDist);
		}

		this.process = function(dt) {
			var dV = VMath.sub(contextBall.P(), ball.P());
			var d = VMath.length(dV);

			if (maxDist && d - maxDist > VMath.EPSILON) {
				dV = VMath.scale(dV, -1/d * (d - maxDist));
				contextBall.addForce(dV[0], dV[1]);
			}

			if (minDist && VMath.EPSILON < minDist - d) {
				dV = VMath.scale(dV, 1/d * (minDist - d));
				contextBall.addForce(dV[0], dV[1]);
			}
		}
	}
})(this);
