(function(global) {
	global.AngularJoint = function(contextBall, leftBall, rightBall) {
		var angleL = VMath.angle(VMath.sub(leftBall.P(), contextBall.P()),
				VMath.sub(leftBall.P(), rightBall.P()));

		var angleP = VMath.angle(VMath.sub(contextBall.P(), leftBall.P()),
				VMath.sub(contextBall.P(), rightBall.P()));
		var sinP = Math.sin(angleP);

		var angleR = Math.PI - angleL - angleP;
		var sinR = Math.sin(angleR);

		this.redir = function(targetBall) {
			return new AngularJoint(leftBall, targetBall, rightBall)
		}

		this.process = function(dt) {
			var lR = VMath.sub(leftBall.P(), rightBall.P());
			var dLR = VMath.length(lR);

			lR = VMath.normalize(lR);
			rP = VMath.rotate(lR, -angleL);

			var bP = VMath
					.sub(leftBall.P(), VMath.scale(rP, dLR * sinR / sinP));

			var V = VMath.sub(bP, contextBall.P());
			var dV = VMath.length(V);
			if (dV > VMath.EPSILON) {
				V = VMath.normalize(V);
				contextBall.addForce.apply(null, VMath.scale(V, Math.pow(dV, 0.9)));
			}
		}
	}
})(this);
