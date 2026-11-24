from django.shortcuts import render
from django.views.decorators.cache import never_cache


@never_cache
def director_login_entry(request):
    return render(request, 'shkolla/director_login.html')
