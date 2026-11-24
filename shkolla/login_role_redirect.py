from functools import wraps
from django.shortcuts import redirect


def zgjedh_rolin_nese_mungon(view):
    @wraps(view)
    def inner(request, *args, **kwargs):
        if request.method == "GET" and not request.GET.get("role"):
            return redirect("/")
        return view(request, *args, **kwargs)

    return inner
