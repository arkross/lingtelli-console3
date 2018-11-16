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
from rest_framework.authtoken import views
from account import views as acc_view

# Member account related
# member_router = routers.DefaultRouter()
# member_router.register('',)

# Agent account related
# agent_router = routers.DefaultRouter()
# agent_router.register('',)

# Member page chatbot related. Not specifiy member cause agent can also use it.
# chatbot_router = routers.DefaultRouter()
# chatbot_router.register('',)
# chatbot_router.register('<int:pk>/history/',)
# chatbot_router.register('<int:pk>/report/',)
# chatbot_router.register('<int:pk>/faq/',)
# chatbot_router.register('<int:pk>/answer/',)
# chatbot_router.register('<int:pk>/question/',)
# chatbot_router.register('<int:pk>/matching/',)

# TODO: Do not have the exact feature for now. Need to make sure first.
# Agent page chatbot. Use for checking member analysis and creating task chatbot for member
# agent_bot_router = routers.DefaultRouter()
# agent_bot_router.register('',)
# agent_bot_router.register('<int:pk>/history/',)
# agent_bot_router.register('<int:pk>/report/',)

# Both using api
# project_router = routers.DefaultRouter()
# project_router.register('thirdparty/',)
# project_router.register('paidtype/',)





urlpatterns = [
    path('admin/', admin.site.urls),

    # Common urls(Could use by both member and agent)
    # path('chatbot/', include(chatbot_router.urls), name='chatbot')
    # path('', include(project_router.urls), name='project')

    # Member related urls
    # path('member/', include(member_router.urls), name='member_account'),
    # path('member/login/'),
    # path('member/logout'),
    path('member/register/', acc_view.member_register),
    path('member/confirm/', acc_view.confirm_user_view),
    path('member/resend/', acc_view.resend_email_view),

    # Agent related urls
    # path('agent/<int:pk>/chatbot/', include(agent_bot_router.urls), name='agent_chatbot')
    # path('agent/', include(account.urls.agent_urls), name='agent_account'),
    # path('agent/login'),
    # path('agent/logout'),
    # path('agent/register'),
    # path('agent/online_member/'),
    # path('agent/report/')
]
