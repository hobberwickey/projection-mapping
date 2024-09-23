// Shamelessly lifted and optomized from https://github.com/chrvadala/transformation-matrix

class Maths {
	inverse(matrix) {
		const { a, b, c, d, e, f } = matrix;
		const denom = a * d - b * c;

		return {
			a: d / denom,
			b: b / -denom,
			c: c / -denom,
			d: a / denom,
			e: (d * e - c * f) / -denom,
			f: (b * e - a * f) / denom,
		};
	}

	transform(...matrices) {
		matrices = Array.isArray(matrices[0]) ? matrices[0] : matrices;

		const multiply = (m1, m2) => {
			return {
				a: m1.a * m2.a + m1.c * m2.b,
				c: m1.a * m2.c + m1.c * m2.d,
				e: m1.a * m2.e + m1.c * m2.f + m1.e,
				b: m1.b * m2.a + m1.d * m2.b,
				d: m1.b * m2.c + m1.d * m2.d,
				f: m1.b * m2.e + m1.d * m2.f + m1.f,
			};
		};

		switch (matrices.length) {
			case 0:
				throw new Error("no matrices provided");

			case 1:
				return matrices[0];

			case 2:
				return multiply(matrices[0], matrices[1]);

			default: {
				const [m1, m2, ...rest] = matrices;
				const m = multiply(m1, m2);
				return transform(m, ...rest);
			}
		}
	}

	smoothMatrix(matrix, precision = 10000000000) {
		return {
			a: Math.round(matrix.a * precision) / precision,
			b: Math.round(matrix.b * precision) / precision,
			c: Math.round(matrix.c * precision) / precision,
			d: Math.round(matrix.d * precision) / precision,
			e: Math.round(matrix.e * precision) / precision,
			f: Math.round(matrix.f * precision) / precision,
		};
	}

	matrixFromTriangles(t1, t2) {
		const px1 = t1[0][0];
		const py1 = t1[0][1];
		const px2 = t2[0][0];
		const py2 = t2[0][1];

		// point q = second point of the triangle
		const qx1 = t1[1][0];
		const qy1 = t1[1][1];
		const qx2 = t2[1][0];
		const qy2 = t2[1][1];

		// point r = third point of the triangle
		const rx1 = t1[2][0];
		const ry1 = t1[2][1];
		const rx2 = t2[2][0];
		const ry2 = t2[2][1];

		const r1 = {
			a: px1 - rx1,
			b: py1 - ry1,
			c: qx1 - rx1,
			d: qy1 - ry1,
			e: rx1,
			f: ry1,
		};
		const r2 = {
			a: px2 - rx2,
			b: py2 - ry2,
			c: qx2 - rx2,
			d: qy2 - ry2,
			e: rx2,
			f: ry2,
		};

		const inverseR1 = this.inverse(r1);
		const affineMatrix = this.transform([r2, inverseR1]);

		// round the matrix elements to smooth the finite inversion
		return smoothMatrix(affineMatrix);
	}

	applyToPoint(matrix, point) {
		return [
			matrix.a * point[0] + matrix.c * point[1] + matrix.e,
			matrix.b * point[0] + matrix.d * point[1] + matrix.f,
		];
	}
}
