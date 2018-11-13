from django.db import models
from django.contrib.auth.models import User
from acctype.models import PaidType

LANGUAGE_CHOICE = {
    ('en', 'en'),
    ('tw', 'tw'),
    ('cn', 'cn')
}

class AccountInfo(models.Model):
    '''Account infomation

    User account detail infomations

    Args:
        user: User object
        acc_type: PaidType object
        start_date: Activate account type date
        expire_date: Expire date for account
        free_package_used: To check if user has used the free chatbot
        confirmation_code: Auto generated confirmation code for confirmation
        code_reset_time: Expire the code after certain time
        code_send_times: Set upper limit for code sending
        language: User prefered language
    '''

    user = models.ForeignKey(User, related_name='acc_user', 
                             on_delete=models.CASCADE)
    acc_type = models.ForeignKey(PaidType, related_name='acc_type',
                                on_delete=models.CASCADE)
    start_date = models.DateTimeField(auto_now_add=False, auto_now=False,
                                      blank=True, null=True)
    expire_date = models.DateTimeField(auto_now_add=False, auto_now=False,
                                       blank=True, null=True)
    confirmation_code = models.CharField(max_length=255, blank=False,
                                         null=False)
    code_reset_time = models.DateTimeField(auto_now_add=False, auto_now=False,
                                           blank=False, null=False)
    code_send_times = models.IntegerField(default=0)
    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICE,
                                default='tw')
    
    class Meta:
        db_table='account_info'
    
    def __str__(self):
        return self.user.username
    
