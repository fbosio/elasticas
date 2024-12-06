import numpy as np

import material
from material import symmetries
from material.constants import Cubic, Hexagonal, Orthorhombic
from material.types import Material


class TestType:
    def test_return_nonempty_list_no_argument_given(self):
        names = material.type()
        name = names[0]

        assert name, "Retrieved empty name"

    def test_return_titlecased_name_material_given(self):
        name = material.type(Material.ISOTROPIC)

        assert name == "Isotropic"


class MaterialConstantsMock:
    matrix = np.zeros([6, 6])
    density = 1


class TestDetect:
    materialConstantsMock = MaterialConstantsMock()

    def test_return_name_existent_material(self, monkeypatch):
        monkeypatch.setattr(
            material, "CONSTANTS", {"Test material": self.materialConstantsMock}
        )
        name = material.detect(
            self.materialConstantsMock.matrix, self.materialConstantsMock.density
        )

        assert name == "Test material"

    def test_return_empty_str_non_existent_material(self, monkeypatch):
        monkeypatch.setattr(
            material, "CONSTANTS", {"Test material": self.materialConstantsMock}
        )
        name = material.detect(self.materialConstantsMock.matrix, 2)

        assert not name, "Retrieved non-empty name of non-existent material"


class TestSymmetries:
    def test_detect_isotropic_material(self):
        isotropic_material = Cubic(density=1, c11=100, c12=28, c44=36)
        C = isotropic_material.matrix
        symmetry = symmetries.detect(C)

        assert symmetry == Material.ISOTROPIC

    def test_detect_hexagonal_material(self):
        hexagonal_material = Hexagonal(
            density=1, c11=34.6, c12=9.4, c13=10.7, c33=28.4, c44=8.36
        )
        C = hexagonal_material.matrix
        symmetry = symmetries.detect(C)

        assert symmetry == Material.HEXAGONAL

    def test_detect_orthorhombic_material(self):
        orthorhombic_material = Orthorhombic(
            density=1,
            c11=20.1,
            c12=11.11,
            c13=0.23,
            c22=15.17,
            c23=5.99,
            c33=19.61,
            c44=7.64,
            c55=5.18,
            c66=6.94,
        )
        C = orthorhombic_material.matrix
        symmetry = symmetries.detect(C)

        assert symmetry == Material.ORTHORHOMBIC

    def test_apply_isotropic_symmetry_to_cubic_material(self):
        cubic_material = Cubic(density=1, c11=108, c12=61, c44=28)
        C = cubic_material.matrix
        new_matrix = symmetries.apply(C, material=Material.ISOTROPIC)
        symmetry = symmetries.detect(new_matrix)

        assert symmetry == Material.ISOTROPIC

    def test_apply_hexagonal_symmetry_to_orthorhombic_material(self):
        orthorhombic_material = Orthorhombic(
            density=1, c11=25, c12=5, c13=13, c22=28, c23=4, c33=26, c44=7, c55=6, c66=8
        )
        C = orthorhombic_material.matrix
        new_matrix = symmetries.apply(C, material=Material.HEXAGONAL)
        symmetry = symmetries.detect(new_matrix)

        assert symmetry == Material.HEXAGONAL


class TestConstantsRepr:
    def test_cubic_repr_includes_class_name(self):
        cubic_material = Cubic(density=1, c11=108, c12=61, c44=28)
        printable_repr = repr(cubic_material)

        assert "Cubic" in printable_repr

    def test_hexagonal_repr_includes_class_name(self):
        hexagonal_material = Hexagonal(density=1, c11=35, c12=9, c13=11, c33=28, c44=8)
        printable_repr = repr(hexagonal_material)

        assert "Hexagonal" in printable_repr

    def test_orthorhombic_repr_includes_class_name(self):
        orthorhombic_material = Orthorhombic(
            density=1, c11=25, c12=5, c13=13, c22=28, c23=4, c33=26, c44=7, c55=6, c66=8
        )
        printable_repr = repr(orthorhombic_material)

        assert "Orthorhombic" in printable_repr
