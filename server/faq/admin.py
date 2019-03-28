from django.contrib import admin

from .models import FAQStatus

class FAQStatusAdmin(admin.ModelAdmin):
    list_display = ('chatbot', 'qa_pair', 'success')

admin.site.register(FAQStatus, FAQStatusAdmin)