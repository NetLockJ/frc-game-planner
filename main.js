// SVG element placed on field
const fieldCanvas = document.getElementById("field-canvas");

const stageCanvas = document.getElementById("stage-canvas")

// Field background itself
const background = document.getElementById("field-background");

// ---------- Constants ---------- \\

const ROBOT_PIXEL_SIZE = 60;
const GAMEPIECE_PIXEL_SIZE = 28;

// ---------- Document (Enums) ---------- \\

const Alliance = {
  BLUE: 0,
  RED: 1,
};

const CanvasMode = {
  DELETE: 0,
  PEN: 1,
  DRAG: 2,
  POLYGON: 3,
  ROBOT: 4,
  PIECE: 5,
  ARROW: 6,
};

const GameStage = {
  AUTO: "auto",
  TELEOP: "teleop",
  ENDGAME: "endgame",
};

// ---------- Document Variables ---------- \\
// States of the document, operate to assist with program logic execution
var allianceColor = Alliance.BLUE;
var currentCanvasMode = CanvasMode.DRAG;
var selectedColor = "#FFF";
var currentGameStage = GameStage.AUTO;

// arrays of both alliance robots
var redRobots = [];
var blueRobots = [];

// Good height ratio canvas px / window height px (needs to be var so it can be slightly adjusted
// on document load)
var heightRatio = 1.0 / 635.0;

// currently selected svg element, for use with code to update position
var selectedElement = null;
// Offset from click point on element and output position
var offset = null;
// Current selected svg transform
var transform = null;

// element of currently selected tool
var selectedTool = null;

// element of currently selected color
var selectedColorElement = document.getElementById("white-color-selector");

// button element for current selected game stage
var selectedGameStage = document.getElementById("auto-button");

// Current polygon being created, place where points will be put
var currentPolygon = null;

// Current arrow being created
var currentArrow = null;

// Current Pen Path
var currentPenPath = null;

// resize svg drawing element to size of background image
window.onload = function () {
  fieldCanvas.style.height = window.getComputedStyle(background, null).height;
  fieldCanvas.style.width = window.getComputedStyle(background, null).width;

  // Multiply height ratio by actual width of field displayed on screen
  heightRatio *= parseFloat(
    window.getComputedStyle(background, null).height.split("px")[0]
  );
};

/**
 * Places an image on the field, centered at xpos/ypos with specified rotation
 * @param {*} xpos Middle x position of image
 * @param {*} ypos Middle y position of image
 * @param {*} angle angle to rotate the image by
 * @param {*} src Path to image file
 * @param {*} pixelratio height ratio to place image on field as (~60 for robot and ~25 for gamepiece)
 */
function addImage(xpos, ypos, angle, src, pixelratio, parent) {
  var imageElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "image"
  );
  // calculated pixel ratio for element
  var calcRatio = pixelratio * heightRatio;

  // Calculated center positions
  var centerX = xpos - calcRatio / 2;
  var centerY = ypos - calcRatio / 2;

  imageElement.setAttribute("href", src);
  imageElement.setAttribute("x", centerX);
  imageElement.setAttribute("y", centerY);
  imageElement.setAttribute("height", calcRatio);
  imageElement.setAttribute("width", calcRatio);

  // Apply rotation transform around center
  imageElement.setAttribute(
    "transform",
    "rotate(" + angle + "," + xpos + "," + ypos + ")"
  );

  parent.appendChild(imageElement);

  return imageElement;
}

function setMode(mode) {
  // addstr helps with the extra different "buttons" that use this (ones with color)
  // Some need a different class, so we have to accout for that here

  addstr = currentCanvasMode == CanvasMode.ROBOT ? "other-" : "";

  if (selectedTool != null) {
    selectedTool.classList.replace(addstr + "active", addstr + "non-active");
  }

  // event is deprecated, but I don't know how else to do this in an efficent way, so !TODO: Fix!
  selectedTool = event.target;

  addstr = mode == CanvasMode.ROBOT ? "other-" : "";

  selectedTool.classList.replace(addstr + "non-active", addstr + "active");

  if (currentCanvasMode == CanvasMode.PIECE && mode == CanvasMode.PIECE) {
    document.getElementById("piece-button").style.backgroundImage =
      "url(24assets/note.svg)";
  }

  if (currentCanvasMode == CanvasMode.ROBOT && mode == CanvasMode.ROBOT) {
    document.getElementById("robot-button").style.backgroundImage =
      allianceColor == Alliance.RED
        ? "url(icons/blueroboticon.svg)"
        : "url(icons/redroboticon.svg)";
    // Invert to other alliance color number, (0 or 1)
    allianceColor = (allianceColor + 1) % 2;
  }

  currentCanvasMode = mode;

  // reset other basic tool needs
  currentPolygon = null;
  currentArrow = null;
}

// Used to get click position relative to the main SVG
function getMousePosition(evt) {
  var CTM = fieldCanvas.getScreenCTM();
  return {
    x: (evt.clientX - CTM.e) / CTM.a,
    y: (evt.clientY - CTM.f) / CTM.d,
  };
}

// Selects element based on pointer, sets currentSelected, offset, and translate so it can be moved
// (Adapted from code here: https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/)
function selectElement(evt) {
  if (currentCanvasMode == CanvasMode.DELETE) {
    // if element is clicked on and is delete mode, delete it (unless it is a robot)

    if(!(evt.target.classList.contains("rbot") || evt.target.classList.contains("bbot"))) {
      stageCanvas.removeChild(evt.target);
    }
    
  } else if (currentCanvasMode == CanvasMode.DRAG) {
    selectedElement = evt.target;
    
    if (selectedElement.parentElement.classList.contains("robot-group")) {
      selectedElement = selectedElement.parentElement;
    }

    offset = getMousePosition(evt);
    // Get all the transforms currently on this element
    var transforms = selectedElement.transform.baseVal;
    // Ensure the first transform is a translate transform
    if (
      transforms.length === 0 ||
      transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
    ) {
      // Create an transform that translates by (0, 0)
      var translate = fieldCanvas.createSVGTransform();
      translate.setTranslate(0, 0);
      // Add the translation to the front of the transforms list
      selectedElement.transform.baseVal.insertItemBefore(translate, 0);
    }
    // Get initial translation amount
    transform = transforms.getItem(0);
    offset.x -= transform.matrix.e;
    offset.y -= transform.matrix.f;
  }
}

function releaseElement(evt) {
  selectedElement = null;
}

function changeColor(newColor) {
  selectedColorElement.classList.replace(
    "selected-color",
    "non-selected-color"
  );

  selectedColorElement = event.target;
  selectedColorElement.classList.replace(
    "non-selected-color",
    "selected-color"
  );
  selectedColor = newColor;
}

function selectStage() {
  selectedGameStage.classList.toggle("selected-stage");
  event.target.classList.toggle("selected-stage");

  // Store current svg to whichever stage it belongs to
  document.getElementById(currentGameStage).innerHTML = stageCanvas.innerHTML;

  // update current stage
  selectedGameStage = event.target;
  currentGameStage = event.target.id.split("-")[0];

  // display other stage on field canvas
  stageCanvas.innerHTML = document.getElementById(currentGameStage).innerHTML;

  blueRobots = []
  redRobots = []

  for(i = 0; i < stageCanvas.getElementsByClassName("bbot").length; i++) {
    blueRobots.push(new Robot("b", stageCanvas.getElementsByClassName("bbot").item(i), null));
    blueRobots.at(i).updateDriveTrainByString(document.getElementById("b" + (i + 1) + "d").value);
  }

  for(i = 0; i < stageCanvas.getElementsByClassName("rbot").length; i++) {
    redRobots.push(new Robot("r", stageCanvas.getElementsByClassName("rbot").item(i), null));
    redRobots.at(i).updateDriveTrainByString(document.getElementById("r" + (i + 1) + "d").value);
  }

  stageCanvas.childNodes.forEach((node) => {
    makeDragable(node);
  });
}

function clearField() {
  document.getElementById(currentGameStage).innerHTML = "";
  stageCanvas.innerHTML = "";

  redRobots = [];
  blueRobots = [];
}

function resetPlanner() {
  if (confirm("This will reset Game Planner, would you like to continue?")) {
    document.getElementById(GameStage.AUTO).innerHTML = "";
    document.getElementById(GameStage.TELEOP).innerHTML = "";
    document.getElementById(GameStage.ENDGAME).innerHTML = "";
    stageCanvas.innerHTML = "";
  }
}

class Robot {
  constructor(color, robotElement, numberElement) {
    this.robotElement = robotElement;
    this.color = color;
    this.numberElement = numberElement;
  }

  // Update Drivetrain to newly selected
  updateDriveTrain(event) {
    this.robotElement.setAttributeNS(
      null,
      "href",
      "assets/" + this.color + event.target.value + ".svg"
    );
  }

  updateDriveTrainByString(type) {
    this.robotElement.setAttributeNS(
      null,
      "href",
      "assets/" + this.color + type + ".svg"
    );
  }

  updateTeamNumber(event) {
    this.numberElement.innerHTML = event.target.value;
  }
}
