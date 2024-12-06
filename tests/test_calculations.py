import numpy as np
from numpy.testing import assert_allclose, assert_equal

import calculations
from material import symmetries
from material.constants import Cubic
from material.types import Material


def test_return_null_output_given_null_propagation_vector():
    z = np.zeros([3, 3])
    expected_arrays = z, z[..., 0], z

    retrieved_arrays = calculations.do(C=np.zeros([6, 6]), rho=1, l=np.zeros(3))

    for expected_array, retrieved_array in zip(expected_arrays, retrieved_arrays):
        assert_equal(retrieved_array, expected_array)


class TestIsotropicMaterial:
    def test_phase_velocities(self):
        C, rho = self.make_material()
        points = self.make_points()

        _, c, _ = calculations.do(C=C, rho=rho, l=points)

        retrieved_arrays = np.moveaxis(c, -1, 0)
        expected_values = 3000, 3000, 5000

        for retrieved_array, expected_value in zip(retrieved_arrays, expected_values):
            assert_allclose(retrieved_array, expected_value, atol=1e-12)

    def test_group_velocities(self):
        C, rho = self.make_material()
        points = self.make_points()

        Gamma, c, A = calculations.do(C=C, rho=rho, l=points)

        retrieved = calculations.get_group_velocities(C=C, rho=rho, l=points, c=c, A=A)
        expected = (c[..., np.newaxis] * points[..., np.newaxis, :]).swapaxes(-2, -1)

        assert_allclose(retrieved, expected, atol=8e-12)

    def make_material(self):
        isotropic_material = Cubic(density=4000, c11=100, c12=28, c44=36)

        symmetry = symmetries.detect(isotropic_material.matrix)
        assert symmetry == Material.ISOTROPIC

        return isotropic_material.matrix, isotropic_material.density

    def make_points(self):
        angle_samples = 300
        u, v = np.meshgrid(
            np.linspace(-np.pi, np.pi, angle_samples),
            np.linspace(-np.pi / 2, np.pi / 2, angle_samples + 1)[::-1],
        )
        x, y, z = np.cos(u) * np.cos(v), np.sin(u) * np.cos(v), np.sin(v)
        points = np.dstack([x, y, z])

        return points
