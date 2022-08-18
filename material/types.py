"""Material types. They are defined by the enum 'Material'."""

from enum import IntEnum


Material = IntEnum(
    "Material",
    "TRICLINIC MONOCLINIC ORTHORHOMBIC TETRAGONAL HEXAGONAL CUBIC ISOTROPIC",
    start=0,
)
