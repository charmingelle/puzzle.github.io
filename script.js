class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  isEqualTo(other) {
    return this.x === other.x && this.y === other.y;
  }

  distance(other) {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
  }

  diff(other) {
    return new Point(this.x - other.x, this.y - other.y);
  }
}

class Puzzle {
  constructor(start, pose, curveCoefs) {
    this.a = new Point(Math.round(start.x), Math.round(start.y));
    this.b = new Point(Math.round(start.x + puzzleDetails.width), Math.round(start.y));
    this.c = new Point(Math.round(start.x), Math.round(start.y + puzzleDetails.height));
    this.d = new Point(
      Math.round(start.x + puzzleDetails.width),
      Math.round(start.y + puzzleDetails.height)
    );
    this.currentA = pose;
    this.currentB = new Point(pose.x + puzzleDetails.width, pose.y);
    this.currentC = new Point(pose.x, pose.y + puzzleDetails.height);
    this.currentD = new Point(
      pose.x + puzzleDetails.width,
      pose.y + puzzleDetails.height
    );
    this.offsetA;
    this.offsetB;
    this.offsetC;
    this.offsetD;
    this.curveCoefs = curveCoefs;
    this.path = this.getPath();
  }

  getPath() {
    let path = new Path2D();

    path.moveTo(this.currentA.x, this.currentA.y);
    this.drawHorizontal(
      path,
      this.currentA,
      this.currentB,
      this.curveCoefs.startHCoef
    );
    this.drawVertical(
      path,
      this.currentB,
      this.currentD,
      this.curveCoefs.endVCoef
    );
    this.drawHorizontal(
      path,
      this.currentD,
      this.currentC,
      this.curveCoefs.endHCoef
    );
    this.drawVertical(
      path,
      this.currentC,
      this.currentA,
      this.curveCoefs.startVCoef
    );
    path.closePath();
    return path;
  }

  isMouseOver(mouse) {
    return (
      mouse.x > this.currentA.x &&
      mouse.x < this.currentB.x &&
      mouse.y > this.currentA.y &&
      mouse.y < this.currentC.y
    );
  }

  calcOffsets(mouse) {
    this.offsetA = mouse.diff(this.currentA);
    this.offsetB = mouse.diff(this.currentB);
    this.offsetC = mouse.diff(this.currentC);
    this.offsetD = mouse.diff(this.currentD);
  }

  move(mouse) {
    this.currentA = mouse.diff(this.offsetA);
    this.currentB = mouse.diff(this.offsetB);
    this.currentC = mouse.diff(this.offsetC);
    this.currentD = mouse.diff(this.offsetD);
  }

  drawHorizontal(path, a, b, coef) {
    if (coef === 0) {
      path.lineTo(b.x, b.y);
      return;
    }
    let diff = a.x - b.x;
    let third = diff / 3;

    path.lineTo(a.x - third, b.y);
    path.quadraticCurveTo(b.x + diff / 2, b.y + coef * third, b.x + third, b.y);
    path.lineTo(b.x, b.y);
  }

  drawVertical(path, a, b, coef) {
    if (coef === 0) {
      path.lineTo(b.x, b.y);
      return;
    }
    let diff = a.y - b.y;
    let third = diff / 3;

    path.lineTo(a.x, a.y - third);
    path.quadraticCurveTo(a.x + coef * third, a.y - diff / 2, b.x, b.y + third);
    path.lineTo(b.x, b.y);
  }

  drawBackground(context) {
    context.drawImage(
      background,
      this.a.x - puzzleDetails.widthThird,
      this.a.y - puzzleDetails.heightThird,
      puzzleDetails.width + 2 * puzzleDetails.widthThird,
      puzzleDetails.height + 2 * puzzleDetails.heightThird,
      this.currentA.x - puzzleDetails.widthThird,
      this.currentA.y - puzzleDetails.heightThird,
      puzzleDetails.width + 2 * puzzleDetails.widthThird,
      puzzleDetails.height + 2 * puzzleDetails.heightThird
    );
  }

  drawPuzzle(context) {
    context.save();
    context.clip(this.path, 'nonzero');
    this.drawBackground(context);
    context.stroke(this.path);
    context.restore();
  }

  drawUpper() {
    this.path = this.getPath();
    this.drawPuzzle(upperContext);
  }

  draw() {
    this.drawPuzzle(context);
  }

  isNearOtherLeft(other) {
    return (
      this.currentB.distance(other.currentA) < 10 &&
      this.currentD.distance(other.currentC) < 10
    );
  }

  isNearOtherRight(other) {
    return (
      this.currentA.distance(other.currentB) < 10 &&
      this.currentC.distance(other.currentD) < 10
    );
  }

  isNearOtherTop(other) {
    return (
      this.currentC.distance(other.currentA) < 10 &&
      this.currentD.distance(other.currentB) < 10
    );
  }

  isNearOtherBottom(other) {
    return (
      this.currentA.distance(other.currentC) < 10 &&
      this.currentB.distance(other.currentD) < 10
    );
  }

  canBeGluedToLeft(other) {
    return this.b.isEqualTo(other.a) && this.d.isEqualTo(other.c);
  }

  canBeGluedToRight(other) {
    return this.a.isEqualTo(other.b) && this.c.isEqualTo(other.d);
  }

  canBeGluedToTop(other) {
    return this.c.isEqualTo(other.a) && this.d.isEqualTo(other.b);
  }

  canBeGluedToBottom(other) {
    return this.a.isEqualTo(other.c) && this.b.isEqualTo(other.d);
  }

  getLeftShift(other) {
    if (this.isNearOtherLeft(other) && this.canBeGluedToLeft(other)) {
      return this.currentB.diff(other.currentA);
    }
    return null;
  }

  getRightShift(other) {
    if (this.isNearOtherRight(other) && this.canBeGluedToRight(other)) {
      return this.currentA.diff(other.currentB);
    }
    return null;
  }

  getTopShift(other) {
    if (this.isNearOtherTop(other) && this.canBeGluedToTop(other)) {
      return this.currentC.diff(other.currentA);
    }
    return null;
  }

  getBottomShift(other) {
    if (this.isNearOtherBottom(other) && this.canBeGluedToBottom(other)) {
      return this.currentA.diff(other.currentC);
    }
    return null;
  }

  getShift(other) {
    let shift = this.getLeftShift(other);

    if (shift) {
      return shift;
    }
    shift = this.getRightShift(other);
    if (shift) {
      return shift;
    }
    shift = this.getTopShift(other);
    if (shift) {
      return shift;
    }
    shift = this.getBottomShift(other);
    if (shift) {
      return shift;
    }
    return null;
  }

  shift(shift) {
    this.currentA = this.currentA.diff(shift);
    this.currentB = this.currentB.diff(shift);
    this.currentC = this.currentC.diff(shift);
    this.currentD = this.currentD.diff(shift);
  }
}

class PuzzleSet {
  constructor(...puzzles) {
    this.puzzles = puzzles;
  }

  isMouseOver(mouse) {
    return this.puzzles.some(puzzle => puzzle.isMouseOver(mouse));
  }

  calcOffsets(mouse) {
    this.puzzles.forEach(puzzle => puzzle.calcOffsets(mouse));
  }

  move(mouse) {
    this.puzzles.forEach(puzzle => puzzle.move(mouse));
  }

  drawUpper() {
    this.puzzles.forEach(puzzle => puzzle.drawUpper());
  }

  draw() {
    this.puzzles.forEach(puzzle => puzzle.draw());
  }

  getShift(other) {
    for (let i = 0; i < this.puzzles.length; i++) {
      for (let j = 0; j < other.puzzles.length; j++) {
        let shift = this.puzzles[i].getShift(other.puzzles[j]);

        if (shift) {
          return shift;
        }
      }
    }
    return null;
  }

  shift(shift) {
    this.puzzles.forEach(puzzle => puzzle.shift(shift));
  }
}

const setPuzzleDetails = (minPuzzleAmount = 10) => {
  if (background.width < background.height) {
    puzzleDetails.horizontalAmount = minPuzzleAmount;
    puzzleDetails.width = background.width / puzzleDetails.horizontalAmount;
    puzzleDetails.verticalAmount = parseInt(
      background.height / puzzleDetails.width
    );
    puzzleDetails.height = background.height / puzzleDetails.verticalAmount;
  } else {
    puzzleDetails.verticalAmount = minPuzzleAmount;
    puzzleDetails.height = background.height / puzzleDetails.verticalAmount;
    puzzleDetails.horizontalAmount = parseInt(
      background.width / puzzleDetails.height
    );
    puzzleDetails.width = background.width / puzzleDetails.horizontalAmount;
  }
  puzzleDetails.widthThird = puzzleDetails.width / 3;
  puzzleDetails.heightThird = puzzleDetails.height / 3;
};

const getRandomPuzzlePositions = () => {
  let xPosition = canvas.width / puzzleDetails.horizontalAmount;
  let yPosition = canvas.height / puzzleDetails.verticalAmount;
  let positions = [];

  for (let i = 0; i < puzzleDetails.horizontalAmount; i++) {
    for (let j = 0; j < puzzleDetails.verticalAmount; j++) {
      positions.push(new Point(xPosition * i, yPosition * j));
    }
  }
  return positions;
};

const initiatePuzzleSets = () => {
  setPuzzleDetails();
  let positions = getRandomPuzzlePositions();
  let puzzleSets = [];
  let curveCoefs = [];

  for (let i = 0; i < puzzleDetails.horizontalAmount; i++) {
    curveCoefs[i] = [];
    for (let j = 0; j < puzzleDetails.verticalAmount; j++) {
      curveCoefs[i][j] = {
        startHCoef: j === 0 ? 0 : -curveCoefs[i][j - 1].endHCoef,
        endHCoef:
          j === puzzleDetails.verticalAmount - 1
            ? 0
            : Math.random() > 0.5
              ? 1
              : -1,
        startVCoef: i === 0 ? 0 : -curveCoefs[i - 1][j].endVCoef,
        endVCoef:
          i === puzzleDetails.horizontalAmount - 1
            ? 0
            : Math.random() > 0.5
              ? 1
              : -1
      };
      let positionIndex = Math.floor(Math.random() * positions.length);
      let puzzleSet = new PuzzleSet(
        new Puzzle(
          new Point(i * puzzleDetails.width, j * puzzleDetails.height),
          positions[positionIndex],
          curveCoefs[i][j]
        )
      );

      positions.splice(positionIndex, 1);
      puzzleSets.push(puzzleSet);
      puzzleSet.draw();
    }
  }
  return puzzleSets;
};

const getSelectedIndex = rects => {
  for (let i = 0; i < rects.length; i++) {
    if (rects[i].isMouseOver(mouse)) {
      return i;
    }
  }
  return -1;
};

const mouseDownHandler = rects => {
  let selectedIndex = getSelectedIndex(rects);

  if (selectedIndex !== -1) {
    selected = rects[selectedIndex];
    selected.calcOffsets(mouse);
    rects.splice(selectedIndex, 1);
    context.clearRect(0, 0, canvas.width, canvas.height);
    rects.forEach(rect => {
      rect.draw();
    });
    selected.drawUpper();
  }
};

const mouseMoveHandler = e => {
  mouse = new Point(e.pageX, e.pageY);
  if (selected) {
    upperContext.clearRect(0, 0, canvas.width, canvas.height);
    selected.move(mouse);
    selected.drawUpper();
  }
};

const mouseUpHandler = rects => {
  if (selected) {
    upperContext.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < rects.length; i++) {
      let shift = selected.getShift(rects[i]);

      if (shift) {
        selected.shift(shift);
        selected.drawUpper();
        sound.play();
        selected = new PuzzleSet(...selected.puzzles, ...rects[i].puzzles);
        rects.splice(i, 1);
        break;
      }
    }
    rects.push(selected);
    selected.draw();
    selected = false;
    if (rects.length === 1) {
      win.classList.remove("hidden");
    }
  }
};

const createGame = () => {
  let rects = initiatePuzzleSets();

  window.onmousedown = () => mouseDownHandler(rects);
  window.onmousemove = e => mouseMoveHandler(e);
  window.onmouseup = () => mouseUpHandler(rects);
};

const getResizedImage = image => {
  let tempCanvas = document.createElement("canvas");
  let tempContext = tempCanvas.getContext("2d");
  let coef = Math.min(
    (0.8 * canvas.width) / image.width,
    (0.8 * canvas.height) / image.height
  );

  tempCanvas.width = coef * image.width;
  tempCanvas.height = coef * image.height;
  tempContext.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );
  let resizedImage = new Image(tempCanvas.width, tempCanvas.height);
  resizedImage.src = tempCanvas.toDataURL();
  return resizedImage;
};

let fileUpload = document.getElementById("file-upload");
let canvas = document.getElementById("canvas");
let upperCanvas = document.getElementById("upper-canvas");
let context = canvas.getContext("2d");
let upperContext = upperCanvas.getContext("2d");
let background;
let puzzleDetails = {};
let style = window.getComputedStyle(canvas);
let selected = false;
let sound = document.getElementById("sound");
let win = document.getElementById("win");
let mouse = new Point(0, 0);

canvas.width = parseInt(style.width);
canvas.height = parseInt(style.height);
upperCanvas.width = canvas.width;
upperCanvas.height = canvas.height;

fileUpload.addEventListener("click", () => {
  fileUpload.value = null;
});

fileUpload.addEventListener("change", () => {
  let image = new Image();

  image.src = URL.createObjectURL(fileUpload.files[0]);
  image.onload = () => {
    win.classList.add("hidden");
    context.clearRect(0, 0, canvas.width, canvas.height);
    background = getResizedImage(image);
    background.onload = () => {
      createGame();
    };
  };
  image.onerror = () =>
    console.log("An error occured while file uploading. Please try again.");
});
