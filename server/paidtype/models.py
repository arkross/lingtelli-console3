from django.db import models
from thirdparty.models import ThirdParty

class PaidType(models.Model):
    '''Paid type

    Giving user different paid type of the services. Each type has different 
    features opened.

    Args:
        name: The name of the type
        duration: Time last when paid
        bot_amount: Can be used bot amount
        faq_amount: Can be used faq amount
        thirdparty: Can be used third parties
    '''
    name = models.CharField(max_length=100, blank=False, null=False)
    duration = models.CharField(max_length=100, blank=False, null=False)
    bot_amount = models.CharField(max_length=100, blank=False, null=False)
    faq_amount = models.CharField(max_length=100, blank=False, null=False)
    thirdparty = models.ManyToManyField(ThirdParty , related_name='paid_party')

    class Meta:
        db_table='paid_type'

    def __str__(self):
        return self.name

    def get_third_parties(self):
        return ",\n".join([t.name for t in self.thirdparty.all()])
