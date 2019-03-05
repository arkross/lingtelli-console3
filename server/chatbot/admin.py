from django.contrib import admin

from .models import Chatbot

class ChatbotAdmin(admin.ModelAdmin):
    empty_value_display = '--NULL--'
    list_display = ('robot_name', 'user', 'assign_user', 'get_third_parties')

admin.site.register(Chatbot, ChatbotAdmin)
