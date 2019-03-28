from django.contrib import admin

from django.contrib.auth.models import User
from chatbot.models import Chatbot
from .models import History, QuestionMatchHistory

class HistoryAdmin(admin.ModelAdmin):
    list_display = ('chatbot', 'sender', 'content', 'username')

    def username(self, obj):
        bot = Chatbot.objects.filter(id=obj.chatbot_id).first()
        return User.objects.filter(id=bot.user_id).first().username

admin.site.register(History, HistoryAdmin)
admin.site.register(QuestionMatchHistory)
