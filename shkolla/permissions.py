from rest_framework.permissions import BasePermission


# Vetem drejtori ka qasje
class EshteDrejtor(BasePermission):
    message = "Vetem drejtori ka leje per kete veprim."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.roli == 'drejtor'
        )


# Vetem mesimdhenesi ka qasje
class EshteMesimdhenes(BasePermission):
    message = "Vetem mesimdhenesi ka leje per kete veprim."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.roli == 'mesimdhenes'
        )


# Vetem nxenesi ka qasje
class EshteNxenes(BasePermission):
    message = "Vetem nxenesi ka leje per kete veprim."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.roli == 'nxenes'
        )