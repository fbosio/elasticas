var subroutines = {


  initPolarPlot: function (args) {
    var fontSize = args.fontSize;
    var numberAngleGuides = args.numberAngleGuides;
    var colors = args.colors;
    
    var canvas = elements.canvases.plot2d;
    canvas.offscreenCanvas = document.createElement("canvas");
    var ctx = canvas.offscreenCanvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    canvas.offscreenCanvas.width = width;
    canvas.offscreenCanvas.height = height;
    var maxRadius = Math.min(width, height) / 2;
    var labelSpace = 2.7 * fontSize;
    var radius = maxRadius - labelSpace;
    var guideLabelSpace = 3.5 * fontSize;
    var numberGuideCircles = Math.floor(radius / guideLabelSpace);

    ctx.strokeStyle = "lightgray";
    ctx.font = fontSize + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var i = 0; i < numberAngleGuides; i++) {
      var angle = 2 * Math.PI / numberAngleGuides * i;
      var circleX = width/2 + radius*Math.cos(angle);
      var circleY = height/2 - radius*Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(width/2, height/2);
      ctx.lineTo(circleX, circleY);
      ctx.stroke();
      var textX = circleX + labelSpace/2*Math.cos(angle);
      var textY = circleY - labelSpace/2*Math.sin(angle);
      ctx.fillText(angle/Math.PI*180 + "°", textX, textY);
    }
    for (var j = 0; j < numberGuideCircles; j++) {
      var guideRadius = radius * j / numberGuideCircles;
      ctx.beginPath();
      ctx.arc(width/2, height/2, guideRadius, 0, 2*Math.PI);
      ctx.stroke();
    }

    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.arc(width/2, height/2, radius, 0, 2*Math.PI);
    ctx.stroke();

    canvas.getContext("2d").drawImage(canvas.offscreenCanvas, 0, 0);

    var selected = this.getSelected();
    selected.r = [0, 0, 0];
    selected.A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    return {
      radius: radius,
      numberGuideCircles: numberGuideCircles,
      fontSize: fontSize,
      font: ctx.font,
      colors: colors,
      selected: selected,
      dragState: {},
    };
  },

  getSelected: function () {
    return {
      angle: this.getSelectedPolarAngle(),
      variable: this.getSelectedRadioButton(["velocity", "slowness",
                                             "groupvelocity"]),
      plane: this.getSelectedRadioButton(["XY-plane", "XZ-plane", "YZ-plane"])
    }
  },

  getSelectedPolarAngle: function () {
    angle = this.parsePolarAngle(elements.inputs.angle.value);

    if (isNaN(angle)) 
      angle = 0;

    return this.normalizePolarAngleRadians(angle);
  },

  getSelectedRadioButton: function (group) {
    for (var i = 0; i < group.length; i++) {
      var name = group[i];
      var button = elements.radioButtons[name];
      if (button.checked) {
        return elements.radioButtons[name].value;
      }
    }
  },

  parsePolarAngle: function (angle) {
    return parseFloat(angle.replace(",", "."));
  },

  normalizePolarAngleRadians: function (angle) {
    angle %= 360;

    if (angle < 0)
      angle += 360;

    var angleRadians = angle * Math.PI / 180;

    return angleRadians;
  },

  
  sendNumbers: function () {
    var C = elements.inputs.matrixC.parsed();
    var rho = this.getFloatValue(elements.inputs.rho.value);

    var data = {
      content: "numbers",
      C: C,
      rho: rho,
    };
    this.postData(data, function (json) {
      elements.selects.material.value = json.material;
      elements.inputs.symmetry.value = json.symmetry;

      axesState["2d"].response = json.plotData2d;

      subroutines.updatePolarPlot();

      elements.spans.loading.hidden = true;
    });
  },
    

  getFloatValue: function (value) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  },


  postData: function (data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function (e) {
      callback(JSON.parse(e.target.responseText));
    });
    xhr.open("POST", "");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(data));
  },


  updatePolarPlot: function () {
    var axes2DState = axesState["2d"];
    var response = axes2DState.response;
    if (!response) return;
    var t = response.t;

    var nearest_i;
    var i, j, k;  // Loop counters
    for (i = 0; i < t.length; i++) {
      if (Math.abs(t[i] - axes2DState.selected.angle) < 0.01) {
        nearest_i = i;
        break
      }
    }

    var plane = axes2DState.selected.plane;
    var variable = axes2DState.selected.variable;
    var rAtPlane = response[variable].r[plane];
    var projection = (plane === "XZ") ? [0, 2]
                     : ((plane === "YZ") ? [1, 2] : [0, 1]);
    var xIndex = projection[0];
    var yIndex = projection[1];

    var rAtAngle;
    if (variable === "groupvelocity") {
      rAtAngle = [null, null, null];
      for (i = 0; i < 3; i++) {
        for (j = 1; j < 50; j++) {
          for (k = 0; k < rAtPlane.length; k++) {
            var groupVelocity = rAtPlane[k][i];
            var gx = groupVelocity[xIndex];
            var gy = groupVelocity[yIndex];
            var angle = Math.PI + Math.atan2(gy, -gx);
            if (Math.abs(angle - axes2DState.selected.angle) < 0.01 * j)
              rAtAngle[i] = Math.max(rAtAngle[i], Math.sqrt(
                Math.pow(gx, 2) + Math.pow(gy, 2)
              ));
          }
          if (rAtAngle[i] !== null) break;
        }
        if (rAtAngle[i] === null) rAtAngle[i] = 0;
      }
    } else {
      rAtAngle = rAtPlane[nearest_i];
    }
    var digits = variable === "velocity" ? 0 : 3;
    for (i = 0; i < elements.outputs.variable.length; i++) {
      var element = elements.outputs.variable[i];
      element.innerHTML = rAtAngle[i].toFixed(digits);
    }
    var aAtAngle = response.A[plane][nearest_i];
    elements.outputs.matrixA.fill(aAtAngle);
    axes2DState.selected.r = rAtAngle;
    axes2DState.selected.A = aAtAngle;
    
    var canvas = elements.canvases.plot2d
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var centerX = width / 2;
    var centerY = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(canvas.offscreenCanvas, 0, 0);
    
    if (response[variable].max[plane] === 0) return;

    var axesRadius = axes2DState.radius;
    var drawingScale = axesRadius / response[variable].max[plane];
    var colors = axes2DState.colors;
    
    ctx.lineWidth = 1;
    for (i = 0; i < 3; i++) {
      ctx.strokeStyle = colors[i];
      ctx.beginPath();
      for (j = 1; j < t.length; j++) {
        var prevX, prevY, px, py;
        if (variable == "groupvelocity") {
          var prevGroupVelocity = rAtPlane[j-1][i];
          var prevX = prevGroupVelocity[xIndex] * drawingScale;
          var prevY = prevGroupVelocity[yIndex] * drawingScale;
          var groupVelocity = rAtPlane[j][i];
          var px = groupVelocity[xIndex] * drawingScale;
          var py = groupVelocity[yIndex] * drawingScale;
        } else {
          var prevRadius = rAtPlane[j-1][i] * drawingScale;
          var prevX = prevRadius * Math.cos(t[j-1]);
          var prevY = prevRadius * Math.sin(t[j-1]);
          var pRadius = rAtPlane[j][i] * drawingScale;
          var px = pRadius * Math.cos(t[j]);
          var py = pRadius * Math.sin(t[j]);
        }
        ctx.moveTo(centerX + prevX, centerY - prevY);
        ctx.lineTo(centerX + px, centerY - py);
      }
      ctx.stroke();
    }

    var selectedAngle = axes2DState.selected.angle;

    var raySelectX = centerX + axesRadius*Math.cos(selectedAngle);
    var raySelectY = centerY - axesRadius*Math.sin(selectedAngle);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(raySelectX, raySelectY);
    ctx.stroke();

    var pointRadius = 4;
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      var intersectionRadius = axes2DState.selected.r[i] * drawingScale;
      var pointX = centerX + intersectionRadius*Math.cos(selectedAngle);
      var pointY = centerY - intersectionRadius*Math.sin(selectedAngle);
      ctx.arc(pointX, pointY, pointRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(centerX, centerY, pointRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = axes2DState.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    var space = axesRadius / axes2DState.numberGuideCircles;
    var labelValueStep = space / drawingScale;
    for (i = 0; i <= axes2DState.numberGuideCircles; i++) {
      var labelValue = Math.round(i*labelValueStep);
      var labelX = centerX + i*space;
      ctx.fillText(labelValue, labelX, centerY + axes2DState.fontSize);
    }
  },


};
