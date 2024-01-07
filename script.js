// SVG element placed on field
const fieldCanvas = document.getElementById("field-canvas");

// Field background itself
const background = document.getElementById("field-background");

// ---------- Constants ---------- \\

const ROBOT_PIXEL_SIZE = 60;
const GAMEPIECE_PIXEL_SIZE = 30;

// HTML for the arrowhead marker, which needs to be carried over through a clear/reset
const MARKER_SVG =
  ' <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2" refY="2" orient="auto">\n' +
  '<polygon id="arrow-polygon" points="0 0, 5 2, 0 4" fill="context-fill" />\n</marker>';

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
// States of the actual Webapp, operate to assist with program logic execution
var allianceColor = Alliance.BLUE;
var currentCanvasMode = CanvasMode.DRAG;
var selectedColor = "white";
var currentGameStage = GameStage.AUTO;

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

// Fired when click happens on field
fieldCanvas.addEventListener("pointerdown", (event) => {
  if (!document.getElementById("sidebar").classList.contains("open")) {
    var position = getMousePosition(event);

    if (currentCanvasMode == CanvasMode.ROBOT) {
      // place robot
      addImage(
        position.x,
        position.y,
        90,
        allianceColor == Alliance.RED
          ? "assets/redtankrobot.svg"
          : "assets/bluetankrobot.svg",
        ROBOT_PIXEL_SIZE
      );
    } else if (currentCanvasMode == CanvasMode.PIECE) {
      // place gamepiece
      addImage(
        position.x,
        position.y,
        0,
        "24assets/fieldnote.svg",
        GAMEPIECE_PIXEL_SIZE
      );
    } else if (currentCanvasMode == CanvasMode.POLYGON) {
      if (currentPolygon == null) {
        currentPolygon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        gsap.set(currentPolygon, {
          attr: {
            fill: selectedColor,
            points: position.x + "," + position.y + " ",
            stroke: selectedColor,
          },
        });

        currentPolygon.setAttribute("stroke-width", "3px");
        currentPolygon.setAttribute("stroke-linejoin", "round");
        currentPolygon.setAttribute("fill-opacity", 0.4);

        fieldCanvas.appendChild(currentPolygon);
        makeDragable(currentPolygon);
      } else {
        // setup is defined, so all we need to do is add the points
        var pts = currentPolygon.getAttribute("points");
        currentPolygon.setAttribute(
          "points",
          pts + position.x + "," + position.y + " "
        );
      }
    } else if (currentCanvasMode == CanvasMode.ARROW) {
      if (currentArrow == null) {
        currentArrow = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        gsap.set(currentArrow, {
          attr: {
            stroke: selectedColor,
            fill: selectedColor,
            x1: position.x,
            y1: position.y,
            x2: position.x,
            y2: position.y,
          },
        });

        currentArrow.setAttribute("stroke-width", 4);
        currentArrow.setAttribute("marker-end", "url(#arrowhead)");
        currentArrow.setAttribute("stroke-linecap", "round");

        fieldCanvas.appendChild(currentArrow, fieldCanvas.firstChild);
        makeDragable(currentArrow);
      }
    } else if (currentCanvasMode == CanvasMode.PEN) {
      currentPenPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline"
      );

      gsap.set(currentPenPath, {
        attr: {
          stroke: selectedColor,
          fill: "none",
        },
      });

      currentPenPath.setAttribute(
        "points",
        +position.x + "," + position.y + " "
      );
      currentPenPath.setAttribute("stroke-linecap", "round");
      currentPenPath.setAttribute("stroke-width", 4);
      fieldCanvas.appendChild(currentPenPath);
      makeDragable(currentPenPath);
    }
  } else {
    // Close sidebar
    document.getElementById("sidebar").classList.replace("open", "closed");

    // End last polygon if hasn't been already
    currentPolygon = null;
  }
});

// Pointer move related events on the field
fieldCanvas.addEventListener("pointermove", (event) => {
  position = getMousePosition(event);
  if (currentCanvasMode == CanvasMode.ARROW) {
    if (currentArrow != null) {
      currentArrow.setAttribute("x2", position.x);
      currentArrow.setAttribute("y2", position.y);
    }
  } else if (currentCanvasMode == CanvasMode.DRAG) {
    if (selectedElement) {
      event.preventDefault();
      transform.setTranslate(position.x - offset.x, position.y - offset.y);
    }

    // If we pass over element during drag delete (and mouse button is held), remove the element
  } else if (currentCanvasMode == CanvasMode.PEN) {
    if (currentPenPath) {
      currentPenPath.setAttribute(
        "points",
        currentPenPath.getAttribute("points") +
          position.x +
          " " +
          position.y +
          " "
      );
    }
  } else if (currentCanvasMode == CanvasMode.DELETE && event.buttons != 0) {
    fieldCanvas.removeChild(event.target);
  }
});

fieldCanvas.addEventListener("pointerup", (event) => {
  position = getMousePosition(event);

  currentArrow = null;
  currentPenPath = null;
});

/**
 * Places an image on the field, centered at xpos/ypos with specified rotation
 * @param {*} xpos Middle x position of image
 * @param {*} ypos Middle y position of image
 * @param {*} angle angle to rotate the image by
 * @param {*} src Path to image file
 * @param {*} pixelratio height ratio to place image on field as (~60 for robot and ~25 for gamepiece)
 */
function addImage(xpos, ypos, angle, src, pixelratio) {
  var imageElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "image"
  );
  // calculated pixel ratio for element
  var calcRatio = pixelratio * heightRatio;

  // Calculated center positions
  var centerX = xpos - calcRatio / 2;
  var centerY = ypos - calcRatio / 2;

  // Set attrs to imageElement
  gsap.set(imageElement, {
    attr: {
      href: src,
      x: centerX,
      y: centerY,
      height: calcRatio,
      width: calcRatio,
    },
  });

  // Apply rotation transform around center
  imageElement.setAttribute(
    "transform",
    "rotate(" + angle + "," + xpos + "," + ypos + ")"
  );
  fieldCanvas.appendChild(imageElement);
  makeDragable(imageElement);
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
    document.getElementById("piece-button").style.backgroundImage = "url(24assets/note.svg)"
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

// Set pointer(down/up) events for dragable items
function makeDragable(element) {
  element.addEventListener("pointerdown", (event) => {
    selectElement(event);
  });

  element.addEventListener("pointerup", (event) => {
    releaseElement(event);
  });
}

// Selects element based on pointer, sets currentSelected, offset, and translate so it can be moved
// (Adapted from code here: https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/)
function selectElement(evt) {
  if (currentCanvasMode == CanvasMode.DELETE) {
    // if element is clicked on and is delete mode, delete it
    fieldCanvas.removeChild(evt.target);
  } else if (currentCanvasMode == CanvasMode.DRAG) {
    selectedElement = evt.target;
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
  document.getElementById(currentGameStage).innerHTML = fieldCanvas.innerHTML;

  // update current stage
  selectedGameStage = event.target;
  currentGameStage = event.target.id.split("-")[0];

  // display other stage on field canvas
  fieldCanvas.innerHTML = document.getElementById(currentGameStage).innerHTML;

  fieldCanvas.childNodes.forEach((node) => {
    makeDragable(node);
  });
}

function clearField() {
  document.getElementById(currentGameStage).innerHTML = MARKER_SVG;
  fieldCanvas.innerHTML = MARKER_SVG;
}

function resetPlanner() {
  if (confirm("This will reset Game Planner, would you like to continue?")) {
    document.getElementById(GameStage.AUTO).innerHTML = MARKER_SVG;
    document.getElementById(GameStage.TELEOP).innerHTML = MARKER_SVG;
    document.getElementById(GameStage.ENDGAME).innerHTML = MARKER_SVG;
    fieldCanvas.innerHTML = MARKER_SVG;
  }
}
