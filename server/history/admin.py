from django.contrib import admin

from django.contrib.auth.models import User
from .models import History, QuestionMatchHistory

class HistoryAdmin(admin.ModelAdmin):
    list_display = ('chatbot', 'sender', 'content', 'username')

    def username(self, obj):
        return User.objects.filter(id=obj.user_id).first().username

admin.site.register(History, HistoryAdmin)
admin.site.register(QuestionMatchHistory)
