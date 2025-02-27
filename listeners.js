// Contains Pointer up, down, and move listeners and
// actions related to them

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
  } else if (
    currentCanvasMode == CanvasMode.DELETE &&
    event.buttons != 0 &&
    event.target != fieldCanvas &&
    event.target != stageCanvas
  ) {
    if (
      !event.target.classList.contains("rbot") &&
      !event.target.classList.contains("bbot")
    ) {
      stageCanvas.removeChild(event.target);
    }
  }
});

// Fired when click happens on field
fieldCanvas.addEventListener("pointerdown", (event) => {
  if (!document.getElementById("sidebar").classList.contains("open")) {
    var position = getMousePosition(event);

    if (currentCanvasMode == CanvasMode.ROBOT) {
      // place robot if no more than three already
      if (
        (allianceColor == Alliance.RED && redRobots.length < 3) ||
        (allianceColor == Alliance.BLUE && blueRobots.length < 3)
      ) {
        driveConfig =
          allianceColor == Alliance.RED
            ? "r" + (redRobots.length + 1)
            : "b" + (blueRobots.length + 1);

        // group element to lock number and robot together
        robotGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        robotGroup.setAttribute("transform", "translate(" + position.x + "," + position.y +")");
        robotGroup.classList.add("robot-group");

        var robot = addImage(
          0, 0,
          90,
          // get current drivetrain choice in settings based on alliance ex. 'b2d' is blue 2's drivetrain choice
          "assets/" +
            (allianceColor == Alliance.RED ? "r" : "b") +
            document.getElementById(driveConfig + "d").value +
            ".svg",
          ROBOT_PIXEL_SIZE,
          robotGroup
        );

        robot.setAttribute(
          "class",
          (allianceColor == Alliance.RED ? "r" : "b") + "bot"
        );

        var teamNumber = document.createElementNS("http://www.w3.org/2000/svg", "text");
        teamNumber.innerHTML = document.getElementById(driveConfig).value;
        teamNumber.style = "font-family: monospace; font-weight: 900;"
        teamNumber.setAttribute("fill", "white");
        teamNumber.setAttribute("dominant-baseline", "middle");
        teamNumber.setAttribute("text-anchor", "middle");
        teamNumber.classList.add((allianceColor == Alliance.RED ? "r" : "b") + "num");

        robotGroup.appendChild(teamNumber);
        stageCanvas.appendChild(robotGroup);
        makeDragable(robotGroup);


        // push to robots array the newly created robot
        if (allianceColor == Alliance.RED) {
          redRobots.push(new Robot("r", robot, teamNumber));
        } else {
          blueRobots.push(new Robot("b", robot, teamNumber));
        }
      }
    } else if (currentCanvasMode == CanvasMode.PIECE) {
      // place gamepiece
      var piece = addImage(
        position.x,
        position.y,
        0,
        "24assets/fieldnote.svg",
        GAMEPIECE_PIXEL_SIZE,
        stageCanvas
      );

      makeDragable(piece);
    } else if (currentCanvasMode == CanvasMode.POLYGON) {
      if (currentPolygon == null) {
        currentPolygon = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );

        currentPolygon.setAttribute("fill", selectedColor);
        currentPolygon.setAttribute("points" , position.x + ", " + position.y + " ");
        currentPolygon.setAttribute("stroke", selectedColor);
        currentPolygon.setAttribute("stroke-width", "3px");
        currentPolygon.setAttribute("stroke-linejoin", "round");
        currentPolygon.setAttribute("fill-opacity", 0.4);

        stageCanvas.appendChild(currentPolygon);
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

        currentArrow.setAttribute("stroke", selectedColor);
        currentArrow.setAttribute("fill", selectedColor);
        currentArrow.setAttribute("x1", position.x);
        currentArrow.setAttribute("y1", position.y);
        currentArrow.setAttribute("x2", position.x);
        currentArrow.setAttribute("y2", position.y);
        currentArrow.setAttribute("stroke-width", 4);
        currentArrow.setAttribute(
          "marker-end",
          "url(#ah" + selectedColor.split("#")[1] + ")"
        );
        currentArrow.setAttribute("stroke-linecap", "round");

        stageCanvas.appendChild(currentArrow, stageCanvas.firstChild);
        makeDragable(currentArrow);
      }
    } else if (currentCanvasMode == CanvasMode.PEN) {
      currentPenPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polyline"
      );

      currentPenPath.setAttribute("stroke", selectedColor);
      currentPenPath.setAttribute("fill", "none");

      currentPenPath.setAttribute(
        "points",
        +position.x + "," + position.y + " "
      );
      currentPenPath.setAttribute("stroke-linecap", "round");
      currentPenPath.setAttribute("stroke-width", 4);
      stageCanvas.appendChild(currentPenPath);
      makeDragable(currentPenPath);
    }
  } else {
    // Close sidebar
    document.getElementById("sidebar").classList.replace("open", "closed");

    // End last polygon if hasn't been already
    currentPolygon = null;
  }
});

fieldCanvas.addEventListener("pointerup", (event) => {
  position = getMousePosition(event);

  currentArrow = null;
  currentPenPath = null;
});

// Set pointer(down/up) events for dragable items
function makeDragable(element) {
  element.addEventListener("pointerdown", (event) => {
    selectElement(event);
  });

  element.addEventListener("pointerup", (event) => {
    releaseElement(event);
  });
}
