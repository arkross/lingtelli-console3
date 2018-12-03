import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class ThirdpartyTest(TestCase):
    '''Third party basic testing

    R
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
        staff_obj = PaidType.objects.create(**staff_data)
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

        # Create new agent account
        agent_data = {'username': 'superuser', 'password': 'agentpassword',
                      'is_staff': True}
        self.agent_obj = User.objects.create(**agent_data)

        # Create agent account info
        acc_data = {'user': self.agent_obj, 'paid_type': staff_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00'}
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

         # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'bearer ' + self.agent_token}

        # Initial uri
        self.thridparty_uri = '/thirdparty/'

    def test_no_auth(self):
        '''Third party action no authorization

        GET
        '''
        c = Client()

        response = c.get(self.thridparty_uri)
        self.assertEqual(response.status_code, 401)
    
    def test_not_existed(self):
        '''Third party is not existed

        GET
        '''
        c = Client()
        the_thirdparty = self.thridparty_uri + '999/'
        response = c.get(the_thirdparty, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read(self):
        c = Client()
        the_thirdparty = self.thridparty_uri + '4/'
        response = c.get(the_thirdparty, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('name', res_data)
