export class RubikEngine {
  constructor() {
    this.cube = [];
    this.initCube();
    // Guardamos el estado inicial para referencia de progreso
    this.solvedCube = JSON.parse(JSON.stringify(this.cube));
  }

  initCube() {
    this.cube = [];
    const faceColors = { U: 'Y', D: 'W', F: 'R', B: 'O', L: 'B', R: 'G' };

    for (let x = 0; x < 3; x++) {
      this.cube[x] = [];
      for (let y = 0; y < 3; y++) {
        this.cube[x][y] = [];
        for (let z = 0; z < 3; z++) {
          const cubie = { U: null, D: null, F: null, B: null, L: null, R: null };
          if (y === 2) cubie.U = faceColors.U;
          if (y === 0) cubie.D = faceColors.D;
          if (z === 2) cubie.F = faceColors.F;
          if (z === 0) cubie.B = faceColors.B;
          if (x === 0) cubie.L = faceColors.L;
          if (x === 2) cubie.R = faceColors.R;
          this.cube[x][y][z] = cubie;
        }
      }
    }
  }

  rotateLayer(axis, index, direction) {
    if (axis === 'y') {
      const layer = [[], [], []];
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          layer[x][z] = this.cube[x][index][z];
        }
      }
      const rotated = this.rotateMatrix(layer, direction);
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          this.cube[x][index][z] = rotated[x][z];
        }
      }
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          this.rotateCubieStickers(this.cube[x][index][z], axis, direction);
        }
      }
    }
    if (axis === 'x') {
      const layer = [[], [], []];
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          layer[y][z] = this.cube[index][y][z];
        }
      }
      const rotated = this.rotateMatrix(layer, direction);
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          this.cube[index][y][z] = rotated[y][z];
        }
      }
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          this.rotateCubieStickers(this.cube[index][y][z], axis, direction);
        }
      }
    }
    if (axis === 'z') {
      const layer = [[], [], []];
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          layer[x][y] = this.cube[x][y][index];
        }
      }
      const rotated = this.rotateMatrix(layer, direction);
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          this.cube[x][y][index] = rotated[x][y];
        }
      }
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          this.rotateCubieStickers(this.cube[x][y][index], axis, direction);
        }
      }
    }
  }

  rotateMatrix(matrix, direction) {
    const N = matrix.length;
    let result = Array.from({ length: N }, () => Array(N).fill(null));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (direction === 1) {
          result[j][N - 1 - i] = matrix[i][j];
        } else {
          result[N - 1 - j][i] = matrix[i][j];
        }
      }
    }
    return result;
  }

  rotateCubieStickers(cubie, axis, direction) {
    if (axis === 'y') {
      if (direction === 1) {
        const temp = cubie.F;
        cubie.F = cubie.L;
        cubie.L = cubie.B;
        cubie.B = cubie.R;
        cubie.R = temp;
      } else {
        const temp = cubie.F;
        cubie.F = cubie.R;
        cubie.R = cubie.B;
        cubie.B = cubie.L;
        cubie.L = temp;
      }
    }
    if (axis === 'x') {
      if (direction === 1) {
        const temp = cubie.U;
        cubie.U = cubie.B;
        cubie.B = cubie.D;
        cubie.D = cubie.F;
        cubie.F = temp;
      } else {
        const temp = cubie.U;
        cubie.U = cubie.F;
        cubie.F = cubie.D;
        cubie.D = cubie.B;
        cubie.B = temp;
      }
    }
    if (axis === 'z') {
      if (direction === 1) {
        const temp = cubie.U;
        cubie.U = cubie.L;
        cubie.L = cubie.D;
        cubie.D = cubie.R;
        cubie.R = temp;
      } else {
        const temp = cubie.U;
        cubie.U = cubie.R;
        cubie.R = cubie.D;
        cubie.D = cubie.L;
        cubie.L = temp;
      }
    }
  }

  scramble(moves = 20) {
    const axes = ['x', 'y', 'z'];
    for (let i = 0; i < moves; i++) {
      const axis = axes[Math.floor(Math.random() * 3)];
      const index = Math.floor(Math.random() * 3);
      const direction = Math.random() > 0.5 ? 1 : -1;
      this.rotateLayer(axis, index, direction);
    }
  }

  // --- NUEVO MÉTODO PARA EL PROGRESO ---
  getProgress() {
    let totalStickers = 0;
    let correctStickers = 0;

    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const cubie = this.cube[x][y][z];
          const solvedCubie = this.solvedCube[x][y][z];

          for (const face of ['U', 'D', 'F', 'B', 'L', 'R']) {
            if (solvedCubie[face] !== null) {
              totalStickers++;
              if (cubie[face] === solvedCubie[face]) {
                correctStickers++;
              }
            }
          }
        }
      }
    }

    return (correctStickers / totalStickers) * 100;
  }
}
