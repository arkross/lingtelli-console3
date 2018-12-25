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
from paidtype import views as paid_view
from thirdparty import views as third_view
from chatbot import views as bot_view
from faq import views as faq_view
from history import views as his_view
from report import views as rep_view

from django.contrib.auth.models import User

# Member account related
member_router = routers.DefaultRouter(trailing_slash=True)
member_router.register('', acc_view.MemberProfileViewset)
#XXX /member/pk/delete_confirm/ for delete confirmation api(detail_route)

# Agent account related
# agent_router = routers.DefaultRouter(trailing_slash=True)
# agent_router.register('',)
# agent_router.register(r'(?P<id>\d+)/confrim',)

# Agent member managment related
agent_member_router = routers.DefaultRouter(trailing_slash=True)
agent_member_router.register('', acc_view.AgentMemberViewset)
# agent_router.register(r'(?P<pk>\d+)/report',) #Not sure what to provide yet


# Member page chatbot related. Not specifiy member cause agent can also use it.
chatbot_router = routers.DefaultRouter(trailing_slash=True)
chatbot_router.register('', bot_view.ChatbotViewset)
#XXX /chatbot/pk/delete_confirm/ for delete confirmation api(detail_route)
chatbot_router.register(r'(?P<id>\d+)/history', his_view.HistoryViewSet)
chatbot_router.register(r'(?P<id>\d+)/report', rep_view.ReportViewSet)
chatbot_router.register(r'(?P<id>\d+)/faq', faq_view.FAQGrouptViewset)
chatbot_router.register(r'(?P<id>\d+)/answer', faq_view.AnswerViewset)
chatbot_router.register(r'(?P<id>\d+)/question', faq_view.QuestionViewset)
chatbot_router.register(r'(?P<id>\d+)/matching', his_view.QuestionMatchHistoryViewSet)
chatbot_router.register(r'(?P<id>\d+)/line', bot_view.LineViewset)
chatbot_router.register(r'(?P<id>\d+)/facebook', bot_view.FacebookViewset)



# TODO: Do not have the exact feature for now. Need to make sure first.
# Agent page chatbot. Use for checking member analysis and creating task chatbot for member
# agent_bot_router = routers.DefaultRouter(trailing_slash=True)
# agent_bot_router.register('',)
# agent_bot_router.register(r'(?P<id>\d+)/history',)
# agent_bot_router.register(r'(?P<id>\d+)/faq',)
# agent_bot_router.register(r'(?P<id>\d+)/answer',)
# agent_bot_router.register(r'(?P<id>\d+)/question',)
# agent_bot_router.register(r'(?P<id>\d+)/confirm',)
# agent_bot_router.register(r'(?P<id>\d+)/upload',)
# agent_bot_router.register(r'(?P<id>\d+)/export',)
# agent_bot_router.register(r'(?P<id>\d+)/train',)

# Both used api
thirdparty_router = routers.DefaultRouter(trailing_slash=True)
thirdparty_router.register('',third_view.ThirdpartyViewset)

paidtype_router = routers.DefaultRouter(trailing_slash=True)
paidtype_router.register('', paid_view.PaidTypeViewset)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Common urls(Could use by both member and agent)
    path('chatbot/<int:pk>/upload/', faq_view.upload_faq_csv),
    path('chatbot/<int:pk>/export/', faq_view.export_faq_csv),
    path('chatbot/<int:pk>/train/', faq_view.train_bot_faq),
    path('chatbot/', include(chatbot_router.urls), name='chatbot'),
    path('thirdparty/', include(thirdparty_router.urls), name='thirdparty'),
    path('paidtype/', include(paidtype_router.urls), name='paidtype'),

    # Member related urls
    path('member/login/', acc_view.member_login),
    path('member/logout/', acc_view.member_logout),
    path('member/register/', acc_view.member_register),
    path('member/confirm/', acc_view.confirm_user),
    path('member/resend/', acc_view.resend_email),
    path('member/', include(member_router.urls)),

    # Agent related urls
    # path('agent/login/',),
    # path('agent/logout/',),
    path('agent/member/', include(agent_member_router.urls), name='agent_member'),
    # path('agent/<int:pk>/chatbot/', include(agent_bot_router.urls), name='agent_chatbot'),
    # path('agent/', include(agent_router.urls), name='agent_account'),
]
