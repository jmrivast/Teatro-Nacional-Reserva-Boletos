from django.utils.decorators import method_decorator
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie


@method_decorator(ensure_csrf_cookie, name="dispatch")
class FrontendAppView(TemplateView):
    template_name = "index.html"
