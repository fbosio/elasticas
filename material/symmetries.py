"""Detection and application of symmetries to matrices of materials."""
import numpy as np

from .types import Material


def detect(C):
    """Receive a 6 by 6 stiffness matrix and return a member of the enum
    `Material` with the symmetry type the matrix has.
    The returned symmetry type can be used as an integer directly.
    """
    C = np.asarray(C)
    if ((C[:3, 3:5] == 0) & (C[3:5, 5] == 0)).all():
        if (C[:3, 5] == 0).all() and C[3, 4] == 0:
            if C[0, 0] == C[1, 1] and C[0, 2] == C[1, 2] and C[3, 3] == C[4, 4]:
                if C[0, 0] == C[2, 2] and C[0, 1] == C[0, 2] and C[3, 3] == C[5, 5]:
                    if C[0, 0] == C[0, 1] + 2 * C[3, 3]:
                        return Material.ISOTROPIC
                    return Material.CUBIC
                if round(C[0, 1] - C[0, 0] + 2 * C[5, 5], 2) == 0:
                    return Material.HEXAGONAL
                return Material.TETRAGONAL
            return Material.ORTHORHOMBIC
        return Material.MONOCLINIC
    return Material.TRICLINIC


def apply(C, material=Material.TRICLINIC):
    """Return a matrix from the given inputs `C` and `material`.

    `material` may be an `int` or a member of the enum `Material`.
    """
    new_C = np.asarray(C).copy()
    if material == Material.MONOCLINIC:
        new_C[:3, 3:5] = new_C[3:5, 5] = 0
    elif material == Material.ORTHORHOMBIC:
        new_C = apply(new_C, Material.MONOCLINIC)
        new_C[:3, 5] = new_C[3, 4] = 0
    elif material == Material.TETRAGONAL:
        new_C = apply(new_C, Material.ORTHORHOMBIC)
        new_C[1, 1] = new_C[0, 0]
        new_C[1, 2] = new_C[0, 2]
        new_C[4, 4] = new_C[3, 3]
    elif material == Material.HEXAGONAL:
        new_C = apply(new_C, Material.TETRAGONAL)
        value = (new_C[0, 0] - new_C[0, 1]) / 2
        if value > 0:
            new_C[5, 5] = value
        else:
            new_C[1, 1] = new_C[0, 0] = new_C[0, 1] + 2 * new_C[5, 5]
    elif material == Material.CUBIC:
        new_C = apply(new_C, Material.ORTHORHOMBIC)
        new_C[2, 2] = new_C[1, 1] = new_C[0, 0]
        new_C[1, 2] = new_C[0, 2] = new_C[0, 1]
        new_C[5, 5] = new_C[4, 4] = new_C[3, 3]
    elif material == Material.ISOTROPIC:
        new_C = apply(new_C, Material.CUBIC)
        new_C[2, 2] = new_C[1, 1] = new_C[0, 0] = new_C[0, 1] + 2 * new_C[3, 3]
    new_C = np.triu(new_C)
    return new_C + new_C.T - np.diag(np.diag(new_C))
