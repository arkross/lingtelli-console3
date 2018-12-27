from django.contrib import admin

from .models import Chatbot

class ChatbotAdmin(admin.ModelAdmin):
    list_display = ('user', 'robot_name', 'get_third_parties',)

admin.site.register(Chatbot, ChatbotAdmin)
