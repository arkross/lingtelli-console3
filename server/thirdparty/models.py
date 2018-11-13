from django.db import models

class ThirdParty(models.Model):
    '''Third party for chatbot

    The platform can be used connected to our chatbot

    Args:
        name: The name of the third party
    '''
    name = models.CharField(max_length=100, blank=False, null=False)

    class Meta:
        db_table='thrid_party'
    
    def __str__(self):
        return self.name
    


    
