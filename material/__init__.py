"""Predefined materials, material detection and definition of types."""

import numpy as np

from .constants import CONSTANTS


def type(material=None):
    """Return the type corresponding to the given `material`.
    It may be an int between 0 and 6 or a member of the enum `types.Material`.

    If `material` is not given, return a list of the defined types.

    Examples:
        >>> type(5)
            'Cubic'
        >>> type(Material.MONOCLINIC)
            'Monoclinic'
        >>> type()
            ['Triclinic', 'Monoclinic', 'Ortorhombic', 'Tetragonal',
             'Hexagonal', 'Cubic', 'Isotropic']
    """

    types = [
        "Triclinic",
        "Monoclinic",
        "Orthorhombic",
        "Tetragonal",
        "Hexagonal",
        "Cubic",
        "Isotropic",
    ]

    if material is None:
        return types
    else:
        return types[material]


def detect(C, rho):
    """Receive a 6x6 stiffness matrix and a density and return the material.
    If the material doesn't exist, return an empty str.
    """

    C = np.asarray(C)

    for material_name in CONSTANTS:
        material_constants = CONSTANTS[material_name]
        if (
            np.allclose(material_constants.matrix, C)
            and material_constants.density == rho
        ):
            return material_name

    return ""
