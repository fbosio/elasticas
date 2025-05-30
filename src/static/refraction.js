var refraction = {
    defaultPlotPadding: 10,
    initialAngleUp: 45,
    initialCanvasSize: null,
    isDraggingAngle: false,

    materialNamePhysicalConstants: {
        "Aluminium, rolled": { density: 2700, lameConstants: [6.1, 2.5] },
        "Beryllium": { density: 1850, lameConstants: [1.6, 14.7] },
        "Brass, yellow, 70 Cu, 30 Zn": {
            density: 8580,
            lameConstants: [11.3, 3.8],
        },
        "Constantan": { density: 8920, lameConstants: [11.4, 6.9] },
    },

    selectionElementIdFieldElementIds: {
        "material-up": {
            density: "rho-up",
            lameConstants: ["lambda-up", "mu-up"],
            slowness: "slowness-up",
            angle: "angle-up",
        },
        "material-down": {
            density: "rho-down",
            lameConstants: ["lambda-down", "mu-down"],
            slowness: "slowness-down",
            angle: "angle-down",
        },
    },

    colors: { up: "#288DA8", down: "#E69F5C" },

    initialize: function () {
        var canvas = document.getElementById('canvas')
        refraction.initialCanvasSize = { width: canvas.width, height: canvas.height }

        this.addElementEventListeners()
        this.fillElements()
        this.fitCanvasToContainer()
    },

    addElementEventListeners: function () {
        this.addMaterialSelectionElementEventListener('material-up')
        this.addTextFieldElementEventListener('angle-up')
        this.addMaterialSelectionElementEventListener('material-down')
        this.addTextFieldElementEventListener('angle-down')
        this.addCanvasElementEventListeners('canvas')
    },

    fillElements: function () {
        this.fillMaterialSelectionElement("material-up");
        this.fillMaterialSelectionElement("material-down");

        var angleUpElement = document.getElementById("angle-up");
        angleUpElement.value = this.initialAngleUp;

        this.fillOtherAngle("material-up");
    },

    plot: function (padding) {
        var canvas = document.getElementById("canvas");
        this.clearCanvas(canvas);
        padding = padding || this.defaultPlotPadding;
        this.drawAxes(canvas, padding);
        var polarCoordinates = this.getPolarCoordinates(padding);
        this.drawSemicircles(canvas, polarCoordinates);
        this.drawWaves(canvas, polarCoordinates);
    },

    fillMaterialSelectionElement: function (elementId) {
        var selectionElement = document.getElementById(elementId);
        selectionElement.innerHTML = "";

        for (var name in this.materialNamePhysicalConstants) {
            var option = document.createElement("option");
            option.label = name;
            option.value = name;
            selectionElement.appendChild(option);
        }

        selectionElement.value = selectionElement.children[0].value;
        this.selectMaterial({ target: selectionElement });
    },

    addMaterialSelectionElementEventListener: function (elementId) {
        this.addEventById(elementId, 'change', this.selectMaterial)
    },

    addTextFieldElementEventListener: function (elementId) {
        this.addEventById(elementId, 'change', this.changeAngle)
    },

    addCanvasElementEventListeners: function (elementId) {
        this.addEventById(elementId, 'mousedown', this.startAngleDrag)
        this.addEventById(elementId, 'mousemove', this.dragAngle)
        this.addEventById(elementId, 'mouseup', this.stopAngleDrag)
    },

    addEventById: function (elementId, type, listener) {
        var element = document.getElementById(elementId)
        this.addEventToElement(element, type, listener)
    },

    addEventToElement: function (element, type, listener) {
        if (element.addEventListener)
            element.addEventListener(type, listener)
        else
            element.attachEvent('on' + type, listener)
    },

    selectMaterial: function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement;
        var selectionElementId = target.id;

        var elements = refraction.getMaterialFieldElements(selectionElementId);

        var materialName = target.value;
        var physicalConstants =
            refraction.materialNamePhysicalConstants[materialName];

        elements.density.value = physicalConstants.density;
        elements.lameConstants[0].value = physicalConstants.lameConstants[0];
        elements.lameConstants[1].value = physicalConstants.lameConstants[1];

        refraction.fillOutputElements(selectionElementId);
        refraction.fillOtherAngle(selectionElementId);
        refraction.plot();
    },

    changeAngle: function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement;
        var textElementId = target.id;

        for (var selectionElementId in refraction.selectionElementIdFieldElementIds) {
            fieldElementIds =
                refraction.selectionElementIdFieldElementIds[selectionElementId];
            if (textElementId === fieldElementIds.angle) {
                refraction.fillOtherAngle(selectionElementId);
                refraction.plot();
                break;
            }
        }
    },

    startAngleDrag: function (event) {
        refraction.isDraggingAngle = true;
        refraction.dragAngle(event);
    },

    dragAngle: function (event) {
        if (!refraction.isDraggingAngle) return;

        event = event || window.event;

        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        var width = canvas.width;
        var height = canvas.height;

        var x = event.clientX - rect.left - width / 2;
        var y = event.clientY - rect.top - height / 2;

        var isDraggingUp = y < 0;

        var offsetAngleFactor;
        var angleElementId;

        if (isDraggingUp) {
            offsetAngleFactor = 1;
            angleElementId = "angle-up";
        } else {
            offsetAngleFactor = -1;
            angleElementId = "angle-down";
        }

        var selectedAngle =
            Math.atan2(y, x) + (offsetAngleFactor * Math.PI) / 2;
        var angleElement = document.getElementById(angleElementId);
        angleElement.value = (selectedAngle * 180) / Math.PI;

        refraction.changeAngle({ target: { id: angleElementId } });
    },

    stopAngleDrag: function () {
        refraction.isDraggingAngle = false;
    },

    fitCanvasToContainer: function () {
        var container = document.getElementById("plot2d-container")
        var canvas = document.getElementById('canvas')
        var aspectRatio = canvas.width / canvas.height;
        canvas.width = container.clientWidth;
        if (canvas.width > refraction.initialCanvasSize.width)
            canvas.width = refraction.initialCanvasSize.width
        canvas.height = canvas.width / aspectRatio;
        refraction.plot()
    },

    fillOutputElements: function (selectionElementId) {
        var fieldIds =
            this.selectionElementIdFieldElementIds[selectionElementId];
        var slownessId = fieldIds.slowness;
        var slownessElement = document.getElementById(slownessId);

        var fieldElements = this.getMaterialFieldElements(selectionElementId);

        slownessElement.value = this.getWaveSlowness(fieldElements);
    },

    fillOtherAngle: function (selectionElementId) {
        var fieldElements = this.getMaterialFieldElements(selectionElementId);
        var slowness = this.getWaveSlowness(fieldElements);

        var fieldIds =
            this.selectionElementIdFieldElementIds[selectionElementId];
        var angleId = fieldIds.angle;
        var angleElement = document.getElementById(angleId);

        var angle = (angleElement.value * Math.PI) / 180;

        for (var otherSelectionElementId in this
            .selectionElementIdFieldElementIds) {
            if (otherSelectionElementId !== selectionElementId) break;
        }

        var otherFieldElements = this.getMaterialFieldElements(
            otherSelectionElementId
        );
        var otherSlowness = this.getWaveSlowness(otherFieldElements);

        var otherFieldIds =
            this.selectionElementIdFieldElementIds[otherSelectionElementId];
        var otherAngleId = otherFieldIds.angle;
        var otherAngleElement = document.getElementById(otherAngleId);

        var otherAngle = Math.asin(
            (slowness / otherSlowness) * Math.sin(angle)
        );

        otherAngleElement.value = (otherAngle * 180) / Math.PI;
    },

    clearCanvas: function (canvas) {
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = 1;
    },

    getPolarCoordinates: function (padding) {
        var elementsUp = this.getMaterialFieldElements("material-up");
        var angleUp = (parseFloat(elementsUp.angle.value) * Math.PI) / 180;
        var slownessUp = this.getWaveSlowness(elementsUp);

        var elementsDown = this.getMaterialFieldElements("material-down");
        var angleDown = (parseFloat(elementsDown.angle.value) * Math.PI) / 180;
        var slownessDown = this.getWaveSlowness(elementsDown);

        var slownessMax = Math.max(slownessUp, slownessDown);

        var radiusUp =
            ((slownessUp / slownessMax) * canvas.width) / 2 - padding;
        var radiusDown =
            ((slownessDown / slownessMax) * canvas.width) / 2 - padding;

        var polarCoordinates = {
            up: [radiusUp, angleUp],
            down: [radiusDown, angleDown],
        };

        return polarCoordinates;
    },

    drawSemicircles: function (canvas, polarCoordinates) {
        var context = canvas.getContext("2d");

        context.lineWidth = 2;

        var radiusUp = polarCoordinates.up[0];
        var radiusDown = polarCoordinates.down[0];

        context.strokeStyle = this.colors.up;
        context.beginPath();
        context.arc(
            canvas.width / 2,
            canvas.height / 2,
            radiusUp,
            0,
            Math.PI,
            true
        );
        context.stroke();

        context.strokeStyle = this.colors.down;
        context.beginPath();
        context.arc(
            canvas.width / 2,
            canvas.height / 2,
            radiusDown,
            0,
            Math.PI,
            false
        );
        context.stroke();
    },

    drawWaves: function (canvas, polarCoordinates) {
        var context = canvas.getContext("2d");

        var radiusUp = polarCoordinates.up[0];
        var angleUp = polarCoordinates.up[1];
        var radiusDown = polarCoordinates.down[0];
        var angleDown = polarCoordinates.down[1];

        context.strokeStyle = this.colors.up;
        context.beginPath();
        context.moveTo(canvas.width / 2, canvas.height / 2);
        context.lineTo(
            canvas.width / 2 + radiusUp * Math.sin(angleUp),
            canvas.height / 2 - radiusUp * Math.cos(angleUp)
        );
        context.stroke();

        context.strokeStyle = this.colors.down;
        context.beginPath();
        context.moveTo(canvas.width / 2, canvas.height / 2);
        context.lineTo(
            canvas.width / 2 - radiusDown * Math.sin(angleDown),
            canvas.height / 2 + radiusDown * Math.cos(angleDown)
        );
        context.stroke();
    },

    getMaterialFieldElements: function (selectionElementId) {
        var inputFieldIds =
            refraction.selectionElementIdFieldElementIds[selectionElementId];

        var densityFieldId = inputFieldIds.density;

        var lameConstantFieldIds = inputFieldIds.lameConstants;
        var lambdaFieldId = lameConstantFieldIds[0];
        var muFieldId = lameConstantFieldIds[1];

        var angleFieldId = inputFieldIds.angle;

        var densityFieldElement = document.getElementById(densityFieldId);
        var lambdaFieldElement = document.getElementById(lambdaFieldId);
        var muFieldElement = document.getElementById(muFieldId);
        var angleElement = document.getElementById(angleFieldId);

        return {
            density: densityFieldElement,
            lameConstants: [lambdaFieldElement, muFieldElement],
            angle: angleElement,
        };
    },

    getWaveSlowness: function (elements) {
        var rho = parseFloat(elements.density.value);
        var lameConstantsElements = elements.lameConstants;
        var lambda = parseFloat(lameConstantsElements[0].value);
        var mu = parseFloat(lameConstantsElements[1].value);

        return Math.sqrt((rho / (lambda + 2 * mu)) * 10);
    },

    drawAxes: function (canvas, padding) {
        var width = canvas.width;
        var height = canvas.height;

        var context = canvas.getContext("2d");
        context.strokeStyle = "gray";
        context.beginPath();
        context.moveTo(padding, height / 2);
        context.lineTo(width - padding, height / 2);
        context.moveTo(width / 2, padding);
        context.lineTo(width / 2, height - padding);
        context.stroke();
    },
};
