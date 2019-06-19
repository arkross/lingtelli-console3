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
from taskbot import views as task_view
from module import views as mod_view

from django.contrib.auth.models import User

# Member account related
member_router = routers.DefaultRouter(trailing_slash=True)
member_router.register('', acc_view.MemberProfileViewset)
#XXX /member/pk/delete_confirm/ for delete confirmation api(detail_route)

# Agent account related
agent_router = routers.DefaultRouter(trailing_slash=True)
agent_router.register('', acc_view.AgentProfileViewset)
#XXX /agent/pk/delete_confirm/ for delete confirmation api(detail_route)

# Agent member managment related
#XXX /agent/member/list_all_member/ for return all member data without pagination
agent_member_router = routers.DefaultRouter(trailing_slash=True)
agent_member_router.register('', acc_view.AgentMemberViewset)
# agent_member_router.register(r'(?P<pk>\d+)/report',) #Not sure what to provide yet

# Member page chatbot related. Not specifiy member cause agent can also use it.
chatbot_router = routers.DefaultRouter(trailing_slash=True)
chatbot_router.register('', bot_view.ChatbotViewset)
#XXX /chatbot/pk/delete_confirm/ for delete confirmation api(detail_route)
#XXX /chatbot/pk/history/export?start_date=2010-10-12&end_date=2019-10-12
# &platform=LINE&uid=userid for export history data
chatbot_router.register(r'(?P<id>\d+)/history', his_view.HistoryViewset)
chatbot_router.register(r'(?P<id>\d+)/report', rep_view.ReportViewset)
chatbot_router.register(r'(?P<id>\d+)/faq', faq_view.FAQGrouptViewset)
chatbot_router.register(r'(?P<id>\d+)/answer', faq_view.AnswerViewset)
chatbot_router.register(r'(?P<id>\d+)/question', faq_view.QuestionViewset)
chatbot_router.register(r'(?P<id>\d+)/matching', his_view.QuestionMatchHistoryViewset)
chatbot_router.register(r'(?P<id>\d+)/line/(?P<line_id>\d+)/ignore', bot_view.LineIgnoreViewset)
chatbot_router.register(r'(?P<id>\d+)/line', bot_view.LineViewset)
chatbot_router.register(r'(?P<id>\d+)/facebook/(?P<fb_id>\d+)/ignore', bot_view.FacebookIgnoreViewset)
chatbot_router.register(r'(?P<id>\d+)/facebook', bot_view.FacebookViewset)

# Agent page chatbot. Use for checking member analysis and creating task chatbot for member
#XXX /agent/taskbot/pk/delete_confirm/ for delete confirmation api(detail_route)
agent_bot_router = routers.DefaultRouter(trailing_slash=True)
agent_bot_router.register('', task_view.TaskbotViewset)
agent_bot_router.register(r'(?P<id>\d+)/history', his_view.HistoryViewset)
agent_bot_router.register(r'(?P<id>\d+)/faq', faq_view.FAQGrouptViewset)
agent_bot_router.register(r'(?P<id>\d+)/answer', faq_view.AnswerViewset)
agent_bot_router.register(r'(?P<id>\d+)/question', faq_view.QuestionViewset)
agent_bot_router.register(r'(?P<id>\d+)/matching', his_view.QuestionMatchHistoryViewset)
agent_bot_router.register(r'(?P<id>\d+)/line', bot_view.LineViewset)
agent_bot_router.register(r'(?P<id>\d+)/facebook', bot_view.FacebookViewset)

# Module related api. Only for agent.
module_router = routers.DefaultRouter(trailing_slash=True)
module_router.register('', mod_view.ModuleViewSet)
module_router.register(r'(?P<id>\d+)/faq', mod_view.ModuleFAQViewSet)
module_router.register(r'(?P<id>\d+)/answer', mod_view.ModuleAnswerViewSet)
module_router.register(r'(?P<id>\d+)/question', mod_view.ModuleQuestionViewSet)

# Member module related api.
member_module_router = routers.DefaultRouter(trailing_slash=True)
member_module_router.register('', mod_view.MemberModuleViewSet)

# Both used api
thirdparty_router = routers.DefaultRouter(trailing_slash=True)
thirdparty_router.register('', third_view.ThirdpartyViewset)

paidtype_router = routers.DefaultRouter(trailing_slash=True)
paidtype_router.register('', paid_view.PaidTypeViewset)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Common urls(Could use by both member and agent)
    path('chatbot/<int:pk>/upload/', faq_view.upload_faq_csv),
    path('chatbot/<int:pk>/export/', faq_view.export_faq_csv),
    path('chatbot/<int:pk>/train/', faq_view.train_bot_faq),
    path('chatbot/<int:pk>/field_faq/', faq_view.update_faq_field),
    path('chatbot/', include(chatbot_router.urls), name='chatbot'),
    path('thirdparty/', include(thirdparty_router.urls), name='thirdparty'),
    path('paidtype/', include(paidtype_router.urls), name='paidtype'),

    # Member related urls
    path('member/login/', acc_view.member_login),
    path('member/logout/', acc_view.member_logout),
    path('member/register/', acc_view.member_register),
    path('member/confirm/', acc_view.confirm_user),
    path('member/resend/', acc_view.resend_email),
    path('member/reset/', acc_view.reset_password),
    path('member/module/<int:pk>/get_fields/', mod_view.get_fields),
    path('member/module/', include(member_module_router.urls), name='member_module'),
    path('member/', include(member_router.urls), name='member_profile'),

    # Agent related urls
    path('agent/taskbot/<int:pk>/upload/', faq_view.upload_faq_csv),
    path('agent/taskbot/<int:pk>/export/', faq_view.export_faq_csv),
    path('agent/taskbot/<int:pk>/train/', faq_view.train_bot_faq),
    path('agent/module/<int:pk>/upload/', mod_view.upload_module_faq),
    path('agent/module/<int:pk>/export/', mod_view.export_module_faq),
    path('agent/login/', acc_view.agent_login),
    path('agent/logout/', acc_view.agent_logout),
    path('agent/member/', include(agent_member_router.urls), name='agent_member'),
    path('agent/taskbot/', include(agent_bot_router.urls), name='agent_taskbot'),
    path('agent/module/', include(module_router.urls), name='module'),
    path('agent/', include(agent_router.urls), name='agent_profile'),
]
