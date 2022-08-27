"""Main functions of the web application.

- Address routing
- Template rendering
- HTTP request, response and error handling
"""

from flask import Flask, request, render_template, abort

import material, plots
from material import symmetries


app = Flask("elasticas")


@app.route("/", methods=["GET", "POST"])
def index():
    """Render HTML or send JSON response depending on the HTTP method."""

    subroutines = {"GET": _render_main_page, "POST": _send_json_response}
    subroutine = subroutines[request.method]
    return subroutine()


# Subroutines
def _render_main_page():
    """Load user interface data and send a template to render HTML."""

    materials = {}
    for name in material.CONSTANTS:
        material_type = symmetries.detect(material.CONSTANTS[name].matrix)
        material_type = material.type(material_type)
        if not material_type in materials:
            materials[material_type] = []
        materials[material_type].append(name)

    return render_template(
        "index.html",
        symmetries=material.type(),
        materials_data=materials,
        colors=("#AA0000", "#005000", "#0000FF"),
    )


def _send_json_response():
    """Read request data, process and send response.

    Return HTTP status code if invalid data is read.
    """

    try:
        data = request.json
        content = data["content"]
        return {
            "material": _send_response_material,
            "symmetry": _send_response_symmetry,
            "numbers": _send_response_numbers,
        }[content](data)
    except KeyError:  # Error raisen if the JSON lacks a required field
        abort(400)  # 400 = HTTP status code for bad request


def _send_response_material(data):
    """Read name of material and return the corresponding constants."""

    name = data["material"]
    constants = material.CONSTANTS[name]
    C = constants.matrix.tolist()
    rho = constants.density

    return {"C": C, "rho": rho}


def _send_response_symmetry(data):
    """Read symmetry name and material constants.
    
    Apply symmetry and return new material constants.
    """

    name = data["symmetry"]
    C = symmetries.apply(data["C"], name)

    return {"C": C.tolist()}


def _send_response_numbers(data):
    """Return a dict with symmetry, material name and plot data.

    The input data must be a dict with density "rho" and stiffness matrix "C".
    """

    rho = data["rho"]
    C = data["C"]

    symmetry_type = material.type(symmetries.detect(C))
    material_name = material.detect(C, rho)

    plot_data_2d = plots.get_velocity_curves(C, rho)

    return {
        "symmetry": symmetry_type,
        "material": material_name,
        "plotData2d": plot_data_2d,
    }
