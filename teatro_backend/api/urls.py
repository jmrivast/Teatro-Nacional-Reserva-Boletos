from django.urls import path
from . import views

urlpatterns = [
    path("", views.info_api, name="info_api"),
    path("eventos/", views.listar_eventos, name="listar_eventos"),
]
