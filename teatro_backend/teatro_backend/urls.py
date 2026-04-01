"""
URL configuration for teatro_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from api import views as api_views

from .views import FrontendAppView

urlpatterns = [
    path("", FrontendAppView.as_view(), name="inicio"),
    path("backend/", api_views.inicio_backend, name="inicio_backend"),
    path("eventos/", api_views.eventos_panel, name="eventos_panel"),
    path("papasfritas/", admin.site.urls),
    path("api/", include("api.urls")),
]
