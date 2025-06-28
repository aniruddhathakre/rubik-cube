// --- Cube State & Logic ---
class Cube {
  constructor() {
    this.reset();
  }

  reset() {
    this.faces = {
      U: Array(9).fill("white"),
      D: Array(9).fill("yellow"),
      L: Array(9).fill("orange"),
      R: Array(9).fill("red"),
      F: Array(9).fill("green"),
      B: Array(9).fill("blue"),
    };
  }

  rotateFace(face, prime = false) {
    const rotate = (arr) => {
      return prime
        ? [
            arr[2],
            arr[5],
            arr[8],
            arr[1],
            arr[4],
            arr[7],
            arr[0],
            arr[3],
            arr[6],
          ]
        : [
            arr[6],
            arr[3],
            arr[0],
            arr[7],
            arr[4],
            arr[1],
            arr[8],
            arr[5],
            arr[2],
          ];
    };

    this.faces[face] = rotate(this.faces[face]);

    const adjacent = {
      U: [
        ["B", 0],
        ["R", 0],
        ["F", 0],
        ["L", 0],
      ],
      D: [
        ["F", 2],
        ["R", 2],
        ["B", 2],
        ["L", 2],
      ],
      F: [
        ["U", 2],
        ["R", 3, true],
        ["D", 0, true],
        ["L", 1],
      ],
      B: [
        ["U", 0],
        ["L", 3, true],
        ["D", 2, true],
        ["R", 1],
      ],
      L: [
        ["U", 3],
        ["F", 1],
        ["D", 3],
        ["B", 3, true],
      ],
      R: [
        ["U", 1],
        ["B", 1, true],
        ["D", 1],
        ["F", 3],
      ],
    };

    const indices = [
      [0, 1, 2],
      [2, 5, 8],
      [6, 7, 8],
      [0, 3, 6],
    ];

    const seq = adjacent[face];
    const rows = seq.map(([f, i, rev]) =>
      (rev ? [...indices[i]].reverse() : indices[i]).map(
        (idx) => this.faces[f][idx]
      )
    );

    const rotated = prime ? [3, 0, 1, 2] : [1, 2, 3, 0];
    rotated.forEach((to, i) => {
      const [f, iRow, rev] = seq[to];
      const idxs = rev ? [...indices[iRow]].reverse() : indices[iRow];
      idxs.forEach((idx, j) => {
        this.faces[f][idx] = rows[i][j];
      });
    });
  }

  applyMove(move) {
    const face = move[0];
    const prime = move.includes("'");
    this.rotateFace(face, prime);
  }

  applyMoves(moves) {
    moves.forEach((m) => this.applyMove(m));
  }

  getSvg() {
    const faceColors = this.faces;
    const positions = {
      U: { x: 3, y: 0 },
      L: { x: 0, y: 3 },
      F: { x: 3, y: 3 },
      R: { x: 6, y: 3 },
      B: { x: 9, y: 3 },
      D: { x: 3, y: 6 },
    };

    const tileSize = 25;
    const svgSize = tileSize * 12; // 12 tiles wide and high in layout
    const svgParts = [
      `<svg viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">`,
    ];

    for (let face in faceColors) {
      const { x, y } = positions[face];
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const cx = (x + col) * tileSize;
        const cy = (y + row) * tileSize;
        svgParts.push(
          `<rect x="${cx}" y="${cy}" width="${tileSize}" height="${tileSize}" fill="${faceColors[face][i]}" stroke="#000" stroke-width="1"/>`
        );
      }
    }

    svgParts.push("</svg>");
    return svgParts.join("\n");
  }
}

// --- Solver (Reverses scramble) ---
class Solver {
  constructor(scrambleMoves) {
    this.scrambleMoves = scrambleMoves;
  }

  getSolutionMoves() {
    return [...this.scrambleMoves]
      .reverse()
      .map((m) => (m.includes("'") ? m[0] : m + "'"));
  }
}

// --- DOM Control ---
const cube = new Cube();
let scrambleMoves = [];

const cubeContainer = document.getElementById("cube-container");
const stepsList = document.getElementById("steps-list");
const scrambleBtn = document.getElementById("scramble-btn");
const solveBtn = document.getElementById("solve-btn");
const resetBtn = document.getElementById("reset-btn");

function renderCube() {
  cubeContainer.innerHTML = cube.getSvg();
}

function updateSteps(steps, prefix = "") {
  stepsList.innerHTML = "";
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    li.textContent = `${prefix}${step}`;
    stepsList.appendChild(li);
  });
}

function generateScramble(length = 20) {
  const faces = ["U", "D", "L", "R", "F", "B"];
  const modifiers = ["", "'"];
  const moves = [];

  let prev = "";
  while (moves.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === prev) continue;
    prev = face;
    const move = face + modifiers[Math.floor(Math.random() * modifiers.length)];
    moves.push(move);
  }

  return moves;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function animateMoves(moves, prefix = "") {
  for (let move of moves) {
    cube.applyMove(move);
    renderCube();
    const li = document.createElement("li");
    li.textContent = `${prefix}${move}`;
    stepsList.appendChild(li);
    await sleep(300);
  }
}

// --- Button Events ---
scrambleBtn.addEventListener("click", async () => {
  scrambleMoves = generateScramble();
  updateSteps([], "Scramble: ");
  solveBtn.disabled = false;
  await animateMoves(scrambleMoves, "Scramble: ");
});

solveBtn.addEventListener("click", async () => {
  if (!scrambleMoves.length) return;
  const solver = new Solver(scrambleMoves);
  const solution = solver.getSolutionMoves();
  await animateMoves(solution, "Solve: ");
  solveBtn.disabled = true;
});

resetBtn.addEventListener("click", () => {
  cube.reset();
  scrambleMoves = [];
  renderCube();
  updateSteps(["Steps"]);
  solveBtn.disabled = true;
});

// Manual move buttons
document.querySelectorAll(".button-group button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const move = btn.dataset.move;
    cube.applyMove(move);
    renderCube();
    const li = document.createElement("li");
    li.textContent = `Manual: ${move}`;
    stepsList.appendChild(li);
  });
});

// --- Init ---
renderCube();
updateSteps(["Steps"]);
