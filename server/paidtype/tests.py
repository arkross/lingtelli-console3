import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from chatbot.models import Chatbot
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class PaidTypeTest(TestCase):
    '''Paid type basic testing
    
    RU
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        staff_data = {
            'pk': 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        self.trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        self.trial_obj.thirdparty.add(demo_obj)

        # Create new member account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': self.trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}

        # Initial uri
        self.paidtype_uri = '/paidtype/'

    def test_no_auth(self):
        '''Paid type action no authorization

        GET, PUT
        '''
        c = Client()

        # GET
        response = c.get(self.paidtype_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        the_paidtype_uri = '/paidtype/' + str(self.trial_obj.id) + '/'
        response = c.put(the_paidtype_uri, json.dumps({'name': 'Special'}),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        '''Paid type is not existed

        GET, PUT
        '''
        pass
    
    def test_read(self):
        pass

    def test_update_member_not_allowed(self):
        pass

    def test_update_only_agent(self):
        pass
