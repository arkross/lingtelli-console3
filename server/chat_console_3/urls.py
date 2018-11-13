"""chat_console_3 URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
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
from django.urls import path
from rest_framework import routers
from account import views as acc_view

# member_router = routers.DefaultRouter()
# member_router.register('<int:pk>',)

# agent_router = routers.DefaultRouter()




urlpatterns = [
    path('admin/', admin.site.urls),
    # Member related urls
    # path('member/', include(member_router.urls), name='member_related'),
    path('member/login/', acc_view.member_login),
    # path('member/logout'),
    path('member/register/', acc_view.member_register),
    path('member/confirm/', acc_view.confirm_user_view),
    path('member/resend/', acc_view.resend_email_view),

    # Agent related urls
    # path('agent/', include(account.urls.agent_urls), name='agent_account'),
    # path('agent/login'),
    # path('agent/logout'),
    # path('agent/register'),
]
