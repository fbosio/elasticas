"""Calculation of phase and group velocities and polarization vectors."""

import numpy as np


def _null_output(l):
    """Receive propagation vector stack `l` and return a tuple with three null
    components `Gamma`, `c`, `A`.
    """

    z = np.zeros(np.shape(l) + (3,))

    return z, z[..., 0], z


class SlimMatrix:
    """Namespace for functions related to "slim" matrices."""

    i = np.array([0, 1, 2, 3, 3, 4, 4, 5, 5])
    j = np.array([0, 1, 2, 1, 2, 2, 0, 0, 1])
    k = np.array([0, 1, 2, 2, 1, 0, 2, 1, 0])

    @classmethod
    def get_matrix_from_vector(cls, vector):
        """Build a matrix from the given vector and return the matrix.
        `vector.shape[-1]` is assumed to be 3.
        The matrix is constructed as shown in the following example.

        >>> class SlimMatrix.get_matrix_from_vector([1, 2, 3])
        array([[1., 0., 0.],
               [0., 2., 0.],
               [0., 0., 3.],
               [0., 3., 2.],
               [3., 0., 1.],
               [2., 1., 0.]])

        """
        array = np.asarray(vector)

        matrix = np.zeros(array.shape[:-1] + (6, 3))
        matrix[..., cls.i, cls.j] = array[..., cls.k]

        return matrix


def get_christoffel_tensor(C, l):
    """Calculate Christoffel tensor from the following inputs.

          `C`: stiffness matrix in GPa = 10⁹ N/m²
          `l`: direction of wave propagation

    Output: `Gamma`, the Christoffel tensor.

    It is assumed that `C.shape == (6, 6)`.

    Dimensions of `Gamma` depend on `l`.
    If `l` is a three-dimensional vector, `Gamma.shape` is (3, 3).
    If `l.shape` is (k, 3), `Gamma.shape` is (k, 3, 3).
    If `l.shape` is (m, n, 3), `Gamma.shape` is (m, n, 3, 3), etc.

    Note: `Gamma` will be a Christoffel tensor as long as the direction of
     propagation is a unit vector, i. e., `norm(l) == 1`.
    """

    L = SlimMatrix.get_matrix_from_vector(l)

    return L.swapaxes(-2, -1) @ C @ L


def get_group_velocities(C, rho, l, c, A):
    """Calculate group velocities from the following inputs.

          `C`: stiffness matrix in GPa = 10⁹ N/m²
        `rho`: density in kg/m³
          `l`: direction of wave propagation
          `c`: vector with phase velocities per component in m/s
          `A`: matrix with normalized polarization vectors per column

    Return the group velocity vector `g` in m/s.

    It is assumed that `C.shape == (6, 6)`.

    `g.shape` depends on all of its inputs.
    But basically, if `l.shape` is (m, n, 3), `g.shape` is (m, n, 3, 3).
    The structure resembles that of `l` and `c`.
    `g.shape[-2]` corresponds to a coordinate (x, y, z) like `l.shape[-1]`.
    `g.shape[-1]` corresponds to a polarization or "mode" like `c.shape[-1]`.
    """

    new_A = SlimMatrix.get_matrix_from_vector(np.asarray(A).swapaxes(-2, -1))
    new_l = l[..., np.newaxis, np.newaxis, :]
    g = new_l @ new_A.swapaxes(-2, -1) @ C @ new_A
    g = g.squeeze().swapaxes(-2, -1) / (rho * c[..., np.newaxis, :])
    g *= 1e9  # convert units to m/s

    return g


def do(C, rho, l):
    """Calculate from the following inputs.

          `C`: stiffness matrix in GPa = 10⁹ N/m²
        `rho`: density in kg/m³
          `l`: direction of wave propagation

    Return a tuple with the three elements `Gamma`, `c`, `A`, where
        `Gamma`: Christoffel matrix in GPa
            `c`: vector with phase velocities per component in m/s
            `A`: matrix with normalized polarization vectors per column

    It is assumed that `C.shape == (6, 6)`.

    Dimensions of `Gamma`, `c` and `A` depend on `l`.
    If `l` is a three-dimensional vector:
        `Gamma.shape` is (3, 3), `c.shape` is 3 and `A.shape` is (3, 3).
    If `l.shape` is (k, 3):
        `Gamma.shape` is (k, 3, 3)
        `c.shape` is (k, 3)
        `A.shape` is (k, 3, 3).
    If `l.shape` is (m, n, 3):
        `Gamma.shape` is (m, n, 3, 3)
        `c.shape` is (m, n, 3)
        `A.shape` is (m, n, 3, 3)
    etc.

    Note: `Gamma` will be a Christoffel tensor as long as the direction of
     propagation is a unit vector, i. e., `norm(l) == 1`.
    """

    Gamma, c, A = _null_output(l)

    if rho != 0 and np.nonzero(l)[0].size != 0:
        # Normalize direction of wave propagation `l`
        n = np.copy(l) / np.linalg.norm(l, axis=-1, keepdims=True)

        Gamma = get_christoffel_tensor(C, n)

        # Get eigenvalues (rho · c**2) and eigenvectors (A) from Gamma.
        w, A = np.linalg.eigh(Gamma)
        if (w > 0).all():  # matrix C must be positive-definite
            c = (w * 1e9 / rho) ** 0.5  # convert units to m/s
            indices = np.argsort(c)  # ascending order
            c = np.take_along_axis(c, indices, -1)
            A = np.take_along_axis(A, indices[..., np.newaxis, :], -1)
        else:
            Gamma, c, A = _null_output(l)

    return Gamma, c, A
