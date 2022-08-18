"""Module for generating curves and surfaces of velocity and slowness."""

import numpy as np

import calculations


class PolarPlot2D:
    """Data adapter for client-side plotting of curves.
    Construct an object from this class and call it to get data from inputs

             `C`: stiffness matrix in GPa = 10⁹ N/m²
           `rho`: density in kg/m³
    """

    def __init__(self):
        angle_samples = int(2 * np.pi * 500)
        t = np.linspace(0, 2 * np.pi, angle_samples, endpoint=False)
        p = np.column_stack([np.cos(t), np.sin(t), np.zeros_like(t)])
        permutations = [[0, 1, 2], [0, 2, 1], [2, 0, 1]]

        self.t = t.tolist()
        self.p = p[:, permutations].swapaxes(0, 1)
        self.planes = "XY", "XZ", "YZ"

    def __call__(self, C, rho):
        _, c, A = calculations.do(C, rho, self.p)
        m = 1e5 / c
        cg = 1e7 * calculations.get_group_velocities(C, rho, self.p, c, A)

        if (np.isnan(c) | np.isinf(c)).any():
            c = np.zeros_like(c)
        if (np.isnan(m) | np.isinf(m)).any():
            m = np.zeros_like(m)
        if (np.isnan(cg) | np.isinf(cg)).any():
            cg = np.zeros_like(cg)

        c_max = c.max(axis=2).max(axis=1)
        m_max = m.max(axis=2).max(axis=1)
        cg_max = np.linalg.norm(cg, axis=-2).max(axis=2).max(axis=1)

        A = A.swapaxes(-2, -1)
        cg = cg.swapaxes(-2, -1)  # c[plane, t, A] => cg[plane, t, A, l]

        data = {
            "t": self.t,
            "velocity": {"r": {}, "max": {}},
            "slowness": {"r": {}, "max": {}},
            "groupvelocity": {"r": {}, "max": {}},
            "A": {},
        }
        for i, plane in enumerate(self.planes):
            data["velocity"]["r"][plane] = c[i, ...].tolist()
            data["velocity"]["max"][plane] = c_max[i]
            data["slowness"]["r"][plane] = m[i, ...].tolist()
            data["slowness"]["max"][plane] = m_max[i]
            data["groupvelocity"]["r"][plane] = cg[i, ...].tolist()
            data["groupvelocity"]["max"][plane] = cg_max[i].tolist()
            data["A"][plane] = A[i, ...].round(3).tolist()

        return data


class SphericalPlot3D:
    """Data adapter for client-side plotting of surfaces.
    A number of angle samples is needed to construct an object of this class.
    Call the object to get the data from inputs

             `C`: stiffness matrix in GPa = 10⁹ N/m²
           `rho`: density in kg/m³
    """

    def __init__(self, angle_samples):
        u, v = np.meshgrid(
            np.linspace(-np.pi, np.pi, angle_samples),
            np.linspace(-np.pi / 2, np.pi / 2, angle_samples + 1)[::-1],
        )
        x, y, z = np.cos(u) * np.cos(v), np.sin(u) * np.cos(v), np.sin(v)
        self.p = np.dstack([x, y, z])
        self.angle_samples = angle_samples

    def __call__(self, C, rho):
        _, c, A = calculations.do(C, rho, self.p)
        m = 1e5 / c
        cg = 1e6 * calculations.get_group_velocities(C, rho, self.p, c, A)

        if (np.isnan(c) | np.isinf(c)).any():
            c = np.zeros_like(c)
        if (np.isnan(m) | np.isinf(m)).any():
            m = np.zeros_like(m)
        if (np.isnan(cg) | np.isinf(cg)).any():
            cg = np.zeros_like(cg)

        p = self.p[np.newaxis, ...]
        c = c.transpose(2, 0, 1)[..., np.newaxis]
        c_vertices = (c * p).reshape(c.shape[0], -1)
        c_max = c.max()
        m = m.transpose(2, 0, 1)[..., np.newaxis]
        m_vertices = (m * p).reshape(m.shape[0], -1)
        m_max = m.max()
        cg = cg.transpose(3, 0, 1, 2)
        cg_vertices = cg.reshape(cg.shape[0], -1)
        cg_max = cg.max()
        n = self.angle_samples
        faces = (
            np.r_[
                (np.c_[:n] + np.r_[0, 0, 1]) % n + np.r_[0, n, 0],
                (np.c_[:n] - np.r_[0, 0, 1]) % n + np.r_[0, n, n],
            ]
            + np.c_[: (n - 1) * n : n][..., np.newaxis]
        ).ravel()

        return {
            "velocity": {"vertices": c_vertices.tolist(), "max": c_max},
            "slowness": {"vertices": m_vertices.tolist(), "max": m_max},
            "groupvelocity": {"vertices": cg_vertices.tolist(), "max": cg_max},
            "faces": faces.tolist(),
        }


_polar_plot_2d = PolarPlot2D()
_spherical_plot_3d = SphericalPlot3D(angle_samples=40)


def get_velocity_curves(C, rho):
    """Generate data to plot velocity curves from the following inputs.

             `C`: stiffness matrix in GPa = 10⁹ N/m²
           `rho`: density in kg/m³

     Return a JSON-serializable dict with the following information.

                `t`: vector of angles in radians sampling a complete turn
         `velocity`: dict with phase velocity data
                       `r`: matrix with velocity curves
                     `max`: maximum velocity value for scaling plots
         `slowness`: dict with slowness data
                       `r`: matrix with slowness curves
                     `max`: maximum slowness value for scaling plots
    `groupvelocity`: dict with group velocity data
                       `r`: matrix with group velocity curves
                     `max`: maximum group velocity norm for scaling plots
                `A`: matrix with normalized polarization vectors per column
    """

    return _polar_plot_2d(C, rho)


def get_velocity_surfaces(C, rho):
    """Generate data to plot surface curves from the following inputs.

             `C`: stiffness matrix in GPa = 10⁹ N/m²
           `rho`: density in kg/m³

     Return a JSON-serializable dict with the following information.

         `velocity`: dict with phase velocity data
                     `vertices`: vertices of the phase velocity surface
                          `max`: maximum velocity value for scaling plots
         `slowness`: dict with slowness data
                     `vertices`: vertices of the slowness surface
                          `max`: maximum slowness value for scaling plots
    `groupvelocity`: dict with group velocity data
                     `vertices`: vertices of the group velocity surface
                          `max`: maximum slowness value for scaling plots
            `faces`: list of vertex indices for each face
    """

    return _spherical_plot_3d(C, rho)
