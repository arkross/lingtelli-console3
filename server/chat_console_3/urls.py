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
from django.conf.urls import include
from django.urls import path
from rest_framework import routers
from rest_framework.authtoken import views
from account import views as acc_view

# Member account related
member_router = routers.DefaultRouter(trailing_slash=True)
member_router.register('', acc_view.MemberProfileViewset)
# member_router.register('<int:pk>/confrim/')

# Agent account related
# agent_router = routers.DefaultRouter(trailing_slash=True)
# agent_router.register('',)
# agent_router.register('<int:pk>/confrim/',)
# agent_router.register('/member/',)
# agent_router.register('/report/',) #Not sure what to provide yet


# Member page chatbot related. Not specifiy member cause agent can also use it.
# chatbot_router = routers.DefaultRouter(trailing_slash=True)
# chatbot_router.register('',)
# chatbot_router.register('<int:pk>/history/',)
# chatbot_router.register('<int:pk>/report/',)
# chatbot_router.register('<int:pk>/faq/',)
# chatbot_router.register('<int:pk>/answer/',)
# chatbot_router.register('<int:pk>/question/',)
# chatbot_router.register('<int:pk>/matching/',)
# chatbot_router.register('<int:pk>/confirm/',)
# chatbot_router.register('<int:pk>/line/',)
# chatbot_router.register('<int:pk>/facebook/',)
# chatbot_router.register('<int:pk>/upload/',)
# chatbot_router.register('<int:pk>/export/',)
# chatbot_router.register('<int:pk>/train/',)


# TODO: Do not have the exact feature for now. Need to make sure first.
# Agent page chatbot. Use for checking member analysis and creating task chatbot for member
# agent_bot_router = routers.DefaultRouter(trailing_slash=True)
# agent_bot_router.register('',)
# agent_bot_router.register('<int:pk>/history/',)
# agent_bot_router.register('<int:pk>/faq/',)
# agent_bot_router.register('<int:pk>/answer/',)
# agent_bot_router.register('<int:pk>/question/',)
# agent_bot_router.register('<int:pk>/confirm/',)
# agent_bot_router.register('<int:pk>/upload/',)
# agent_bot_router.register('<int:pk>/export/',)
# agent_bot_router.register('<int:pk>/train/',)

# Both using api
# thirdparty_router = routers.DefaultRouter(trailing_slash=True)
# thirdparty_router.register('',)

# paidtype_router = routers.DefaultRouter(trailing_slash=True)
# paidtype_router.register('',)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Common urls(Could use by both member and agent)
    # path('chatbot/', include(chatbot_router.urls), name='chatbot'),
    # path('thirdparty/', include(thirdparty_router.urls), name='thirdparty'),
    # path('paidtype/', include(paidtype_router.urls), name='paidtype')

    # Member related urls
    path('member/login/', acc_view.member_login),
    path('member/logout/', acc_view.member_logout),
    path('member/register/', acc_view.member_register),
    path('member/confirm/', acc_view.confirm_user),
    path('member/resend/', acc_view.resend_email),
    path('member/', include(member_router.urls)),

    # Agent related urls
    # path('agent/<int:pk>/chatbot/', include(agent_bot_router.urls), name='agent_chatbot')
    # path('agent/', include(account.urls.agent_urls), name='agent_account'),
    # path('agent/login/',),
    # path('agent/logout/',),
    # path('agent/register/',),
]
