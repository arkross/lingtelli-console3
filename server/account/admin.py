from django.contrib import admin

from .models import AccountInfo

class AccountInfoAdmin(admin.ModelAdmin):
    empty_value_display = '--Unlimited--'
    list_display = ('user', 'paid_type', 'e_date', 'd_date')

    def e_date(self, obj):
        d_obj = obj.expire_date
        if d_obj:
            d_date = d_obj.date()
            return d_date.strftime('%Y-%m-%d')
        return None

    def d_date(self, obj):
        d_obj = obj.delete_date
        if d_obj:
            d_date = d_obj.date()
            return d_date.strftime('%Y-%m-%d')
        return None

admin.site.register(AccountInfo, AccountInfoAdmin)
