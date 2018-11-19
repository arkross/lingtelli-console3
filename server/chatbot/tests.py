import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from chatbot.models import Chatbot
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class ChatbotTest(TestCase):
    '''Chatbot basic testing

    CRUD
    '''

    def setUp(self):
        # Initial paid type an third party
        trail_obj = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }
        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': paidtype_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}

    def test_no_auth(self):
        ''' Not authorize actions
        
        POST, GET, PUT, DELETE
        '''
        # Initial bot
        bot_data = {'robot_name': 'test', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        c = Client()
        # POST
        response = c.post('/chatbot/', json.dumps({'robot_name': 'thebot'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(bot_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(bot_uri, json.dumps({'robot_name': 'newbot'}), 
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Delete
        response = c.delete(bot_uri)
        self.assertEqual(response.status_code, 401)

    
    def test_not_existed(self):
        ''' Bot not existed

        GET, PUT, DELETE
        '''
        # Init not existed bot url
        bot_uri = '/chatbot/5/'

        c = Client()

        # GET
        response = c.get(bot_uri, **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        # self.assertIn('errors', res_data)

        # PUT
        response = c.put(bot_uri, json.dumps({'robot_name': 'newbot'}),
                         content_type='application/json', **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        # self.assertIn('errors', res_data)

        # Delete
        response = c.delete(bot_uri, **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        # self.assertIn('errors', res_data)


    def test_create(self):
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand'}
        bot_return_key = ['id', 'robot_name']
        c = Client()
        response = c.post('/chatbot/', json.dumps(bot_data),
                          content_type='application/json', **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 201)
        # for k in bot_return_key:
        #     self.assertIn(k, res_data)

    
    def test_create_no_bot_name(self):
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        c = Client()
        response = c.post('/chatbot/', json.dumps({}),
                          content_type='application/json', **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)
    
    def test_create_over_limited_amount(self):
        bot_1_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                      'failed_msg': 'Cannot understand'}
        bot_2_data = {'robot_name': 'testbot2', 'greeting_msg': 'Hi',
                      'failed_msg': 'Cannot understand'}
        c = Client()
        # Create 2 bots. Only allow 1 bot to be created.
        c.post('/chatbot/', json.dumps(bot_1_data),
               content_type='application/json', **self.header)
        response = c.post('/chatbot/', json.dumps(bot_2_data),
                          content_type='application/json', **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)
    
    def test_read(self):
        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        c = Client()
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        response = c.get(bot_uri, **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # for k, v in bot_obj:
        #     self.assertIn(k, res_data)
    
    def test_update(self):
        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)
        bot_update_data = {'robot_name': 'newnamebot', 'greeting_msg': 'LOL'}

        c = Client()
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        response = c.put(bot_uri, json.dumps(bot_update_data),
                         content_type='application/json', **self.header)
        updated_bot_obj = Chatbot.objects.get(id=bot_obj.id,
                                              user=self.user_obj)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # for k, v in updated_bot_obj:
        #     self.assertIn(k, res_data)
        #     self.assertIn(v, in res_data)
        
    
    def test_update_bot_name_blank(self):
        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        c = Client()
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        response = c.put(bot_uri, json.dumps({}),
                         content_type='application/json', **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)
    
    def test_delete(self):
        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)
        # Pretend the confirm has passed
        bot_obj.delete_confirm = True
        bot_obj.save()

        c = Client()
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        response = c.delete(bot_uri, **self.header)
        self.assertEqual(response.status_code, 204)
    
    def test_delete_no_confirm(self):
        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        c = Client()
        bot_uri = '/chatbot/' + str(bot_obj.id) + '/'
        response = c.delete(bot_uri, **self.header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)


class DeleteBotConfirmTest(TestCase):
    '''Delete chatbot confirm

    Asking for user's password before deleting chatbot
    '''
    def test_update_confirm_no_auth(self):
        ''' Delete bot confirm 

        PUT
        '''
        pass

    def test_update_confirm_correct_password(self):
        pass
    
    def test_update_confirm_wrong_password(self):
        pass


class LineTest(TestCase):
    '''Line basic testing

    RU
    '''
    def test_no_auth(self):
        ''' Line no authorization

        GET, PUT
        '''
        pass

    def test_read(self):
        pass
 
    def test_update(self):
        pass


class FacebookTest(TestCase):
    '''Facebook basic testing

    RU
    '''

    def test_no_auth(self):
        ''' Facebook no authorization

        GET, PUT
        '''
        pass

    def test_read(self):
        pass
 
    def test_update(self):
        pass