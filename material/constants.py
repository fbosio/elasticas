"""Classes for materials and database implementation."""

import numpy as np

from . import symmetries
from .types import Material


class ConstantsBase:
    """Store stiffness matrix and density of a material."""

    def __init__(self, density, constants_mapping, material=Material.TRICLINIC):
        """Store density and create stiffness matrix from constants.

        `constants_mapping` is a dict that maps tuples (row, column) to the
        value the matrix will have in that row and column.
        `material` is the symmetry that will be applied afterwards.
        """
        self._density = density
        self._matrix = np.zeros([6, 6])
        i, j = np.array(tuple(constants_mapping.keys())).T
        self._matrix[i, j] = tuple(constants_mapping.values())
        self._matrix = symmetries.apply(self._matrix, material)

    @property
    def matrix(self):
        """Stiffness matrix."""
        return self._matrix

    @property
    def density(self):
        """Density."""
        return self._density




class Cubic(ConstantsBase):
    """Material with cubic symmetry."""

    def __init__(self, density, c11, c12, c44):
        """Receive density and 3 independent constants to make the object."""
        super().__init__(
            density, {(0, 0): c11, (0, 1): c12, (3, 3): c44}, Material.CUBIC
        )

    def __repr__(self):
        """Return str that displays the material constants."""
        c = self.matrix
        attributes = self.density, c[0, 0], c[0, 1], c[3, 3]
        return f"Cubic{attributes}"


class Hexagonal(ConstantsBase):
    """Material with hexagonal symmetry."""

    def __init__(self, density, c11, c12, c13, c33, c44):
        """Receive density and 5 independent constants to make the object."""
        super().__init__(
            density,
            {(0, 0): c11, (0, 1): c12, (0, 2): c13, (2, 2): c33, (3, 3): c44},
            Material.HEXAGONAL,
        )

    def __repr__(self):
        """Return str that displays the material constants."""
        c = self.matrix
        attributes = self.density, c[0, 0], c[0, 1], c[0, 2], c[3, 3]
        return f"Hexagonal{attributes}"


CONSTANTS = {
    "Ag (plata)": Cubic(10490, 124, 93.4, 46.1),
    "Al (aluminio)": Cubic(2700, 108.2, 61.3, 28.5),
    "Au (oro)": Cubic(19300, 186, 157, 42),
    "Cu (cobre)": Cubic(8940, 168.4, 121.4, 75.4),
    "Ir (iridio)": Cubic(22560, 580, 242, 256),
    "Ni (níquel)": Cubic(8900, 246.5, 147.3, 124.7),
    "Pb (plomo)": Cubic(11340, 49.5, 42.3, 14.9),
    "Pd (paladio)": Cubic(12023, 227.1, 176, 71.7),
    "Pt (platino)": Cubic(21450, 346.7, 250.7, 76.5),
    "Cr (cromo)": Cubic(7140, 339.8, 58.6, 99),
    "Fe (hierro)": Cubic(7870, 228, 132, 116.5),
    "K (potasio)": Cubic(856, 4.14, 2.21, 2.63),
    "Li (litio)": Cubic(535, 13.5, 11.44, 8.78),
    "Mo (molibdeno)": Cubic(10280, 459, 176, 110),
    "Na (sodio)": Cubic(968, 7.32, 6.25, 4.19),
    "NaCl (sal)": Cubic(2165, 48.7, 12.4, 12.6),
    "Nb (niobio)": Cubic(857, 245.5, 139, 29.3),
    "Ta (tantalio)": Cubic(16650, 267, 161, 82.5),
    "V (vanadio)": Cubic(6110, 228, 119, 42.6),
    "W (wolframio/tungsteno)": Cubic(19600, 501, 198, 151.4),
    "C (grafito)": Hexagonal(2100, 1160, 290, 109, 46.6, 2.3),
    "C (diamante)": Cubic(3515, 1076, 125, 575.8),
    "Ge (germanio)": Cubic(5323, 128.9, 48.3, 67.1),
    "Si (silicio)": Cubic(2336, 165.7, 63.9, 79.6),
    "GaAs (arseniuro de galio)": Cubic(5317, 118.8, 53.7, 59.4),
    "GaP (fosfuro de galio)": Cubic(4138, 141.2, 62.5, 70.5),
    "InP (fosfuro de indio)": Cubic(4810, 102.2, 57.6, 46),
    "KCl (cloruro de potasio)": Cubic(1987, 39.5, 4.9, 6.3),
    "LiF (fluoruro de litio)": Cubic(2640, 111.2, 42.0, 62.8),
    "MgO (óxido de magnesio)": Cubic(3580, 289.2, 88, 154.6),
    "Ti (titanio)": Hexagonal(4507, 162.4, 92.0, 69.0, 180.7, 46.7),
    "TiC (carburo de titanio)": Cubic(4920, 500, 113, 175),
    "Be (berilio)": Hexagonal(1848, 292.3, 26.7, 14, 336.4, 162.5),
    "Cd (cadmio)": Hexagonal(8650, 115.8, 39.8, 40.6, 51.4, 20.4),
    "Co (cobalto)": Hexagonal(8900, 307.1, 165, 102.7, 358.1, 78.3),
    "Hf (hafnio)": Hexagonal(13310, 181.1, 77.2, 66.1, 196.9, 55.7),
    "Mg (magnesio)": Hexagonal(1738, 59.7, 26.2, 21.7, 61.7, 16.4),
    "Re (renio)": Hexagonal(21020, 612.5, 270, 206, 682.7, 162.5),
    "Zn (zinc)": Hexagonal(7140, 161, 34.2, 50.1, 61.0, 38.3),
    "ZnO (óxido de zinc)": Hexagonal(5606, 209.7, 121.1, 105.1, 210.9, 42.5),
    "Zr (zirconio)": Hexagonal(6501, 143.4, 72.8, 65.3, 164.8, 32.0),
}
