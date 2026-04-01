from django.urls import path
from . import views

urlpatterns = [
    path("", views.info_api, name="info_api"),
    path("config/", views.frontend_config_api, name="frontend_config_api"),
    path("auth/register/", views.auth_register_api, name="auth_register_api"),
    path("auth/login/", views.auth_login_api, name="auth_login_api"),
    path("auth/session/", views.auth_session_api, name="auth_session_api"),
    path("auth/logout/", views.auth_logout_api, name="auth_logout_api"),
    path("eventos/", views.listar_eventos, name="listar_eventos"),
    path("eventos/<int:evento_id>/", views.detalle_evento_api, name="detalle_evento_api"),
    path("reservas/", views.reservas_api, name="reservas_api"),
    path(
        "reservas/<str:codigo_reserva>/",
        views.detalle_reserva_api,
        name="detalle_reserva_api",
    ),
]
