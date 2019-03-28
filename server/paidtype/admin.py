from django.contrib import admin

from .models import PaidType

class PaidTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'duration_days', 'bot_amount', 'faq_amount',
                    'get_third_parties')

    def duration_days(self, obj):
        durations = obj.duration
        amount, unit = durations.split('_')
        if unit == 'y':
            days = int(amount) * 365
        else:
            days = int(amount)
        if days == 0:
            days = 'Unlimited'
        return str(days) + ' days'

admin.site.register(PaidType, PaidTypeAdmin)
