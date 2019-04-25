import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from chatbot.models import Chatbot, Line, Facebook, LineIgnore, FacebookIgnore
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class ChatbotTest(TestCase):
    '''Chatbot basic testing

    CRUD
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '2',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
                    'failed_msg': 'Cannot understand', 'language': 'en',
                    'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial uri
        self.bot_uri = '/chatbot/' + str(self.bot_obj.id) + '/'

    def test_no_auth(self):
        ''' Not authorize actions

        POST, GET, PUT, DELETE
        '''
        c = Client()
        # POST
        response = c.post('/chatbot/', json.dumps({'robot_name': 'thebot'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(self.bot_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        response = c.put(self.bot_uri, json.dumps({'robot_name': 'newbot'}),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Delete
        response = c.delete(self.bot_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        ''' Bot not existed

        GET, PUT, DELETE
        '''
        # Init not existed bot url
        bot_uri = '/chatbot/9999/'

        c = Client()

        # GET
        response = c.get(bot_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        response = c.put(bot_uri, json.dumps({'robot_name': 'newbot'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # Delete
        response = c.delete(bot_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    # def test_create(self):
    #     bot_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
    #                 'failed_msg': 'Cannot understand', 'language': 'en',
    #                 'postback_title': 'postback'}
    #     bot_return_key = ['id', 'robot_name']
    #     c = Client()
    #     response = c.post('/chatbot/', json.dumps(bot_data),
    #                       content_type='application/json', **self.header)
    #     self.assertEqual(response.status_code, 201)
    #     res_data = json.loads(response.content)
    #     bot_obj = Chatbot.objects.get(id=res_data.get('id'))
    #     self.assertEqual(bot_obj.bot_type, 'NORMAL')
    #     for k in bot_return_key:
    #         self.assertIn(k, res_data)

    def test_create_no_bot_name(self):
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        c = Client()
        response = c.post('/chatbot/', json.dumps({}),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    # def test_create_over_limited_amount(self):
    #     bot_1_data = {'robot_name': 'testbot', 'greeting_msg': 'Hi',
    #                   'failed_msg': 'Cannot understand'}
    #     bot_2_data = {'robot_name': 'testbot2', 'greeting_msg': 'Hi',
    #                   'failed_msg': 'Cannot understand'}
    #     c = Client()
    #     # Create 2 bots. Only allow 1 bot to be created.
    #     c.post('/chatbot/', json.dumps(bot_1_data),
    #            content_type='application/json', **self.header)
    #     response = c.post('/chatbot/', json.dumps(bot_2_data),
    #                       content_type='application/json', **self.header)
    #     self.assertEqual(response.status_code, 403)
    #     res_data = json.loads(response.content)
    #     self.assertIn('errors', res_data)

    def test_read_list(self):
        bot_data = ['id', 'robot_name']
        c = Client()
        response = c.get('/chatbot/', **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in bot_data:
            self.assertIn(k, res_data[0])

    def test_read_retrieve(self):
        bot_data = ['robot_name', 'greeting_msg', 'failed_msg',
                    'postback_title', 'created_at', 'updated_at', 'vendor_id',
                    'postback_activate', 'delete_confirm', 'bot_type',
                    'assign_user', 'activate', 'language', 'third_party',
                    'user']
        c = Client()
        response = c.get(self.bot_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k in bot_data:
            self.assertIn(k, res_data)

    def test_update(self):
        bot_update_data = {'robot_name': 'newnamebot', 'greeting_msg': 'LOL',
                           'failed_msg': 'bye', 'postback_title': 'similar',
                           'postback_activate': True, 'choose_answer': '1',
                           'domain': 'abc.com'}

        c = Client()
        response = c.put(self.bot_uri, json.dumps(bot_update_data),
                         content_type='application/json', **self.header)
        updated_bot_obj = Chatbot.objects.get(id=self.bot_obj.id,
                                              user=self.user_obj)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        for k, v in bot_update_data.items():
            self.assertEqual(getattr(updated_bot_obj, k), v)

    def test_update_bot_name_blank(self):
        c = Client()
        response = c.put(self.bot_uri, json.dumps({}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_update_to_type_taskbot(self):
        c = Client()
        response = c.put(self.bot_uri, json.dumps({'bot_type': 'TASKBOT'}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_update_assign_user_not_allowed(self):
        c = Client()
        response = c.put(self.bot_uri,
                         json.dumps({'assign_user': self.user_obj.id}),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_delete(self):
        # Pretend the confirm has passed
        self.bot_obj.delete_confirm = True
        self.bot_obj.save()

        c = Client()
        response = c.delete(self.bot_uri, **self.header)
        self.assertEqual(response.status_code, 204)

    def test_delete_no_confirm(self):
        c = Client()
        response = c.delete(self.bot_uri, **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)


class DeleteBotConfirmTest(TestCase):
    '''Delete chatbot confirm

    Asking for user's password before deleting chatbot
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create_user(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'language': 'en',
                    'user': self.user_obj}
        self.bot_obj = Chatbot.objects.create(**bot_data)

        # Initial bot uri
        self.uri = '/chatbot/' + str(self.bot_obj.id) + '/delete_confirm/'

    def test_update_confirm_no_auth(self):
        ''' Delete bot confirm

        PUT
        '''
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_update_confirm_correct_password(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password),
                         content_type='application/json', **self.header)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        pk = self.bot_obj.id
        updated_bot_obj = Chatbot.objects.filter(id=pk, user=user_obj).first()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(updated_bot_obj.delete_confirm, True)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_update_confirm_wrong_password(self):
        c = Client()
        correct_password = {'password': 'wrongpassword'}
        response = c.put(self.uri, json.dumps(correct_password),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('errors'), 'Password is not correct')


class LineTest(TestCase):
    '''Line basic testing

    RU
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'language': 'en',
                    'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        # Initial line
        line_data = {'secret': 'thisisthesecret', 'token': 'thisisthetoken',
                     'chatbot': bot_obj}
        self.line_obj = Line.objects.create(**line_data)

        # Initial uri
        self.uri = '/chatbot/' + str(bot_obj.id) + '/line/'\
                   + str(self.line_obj.id) + '/'

    def test_no_auth(self):
        '''Line no authorization

        GET, PUT
        '''
        c = Client()

        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        line_data = {'secret': 'newsecret'}
        response = c.put(self.uri, json.dumps(line_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_read(self):
        c = Client()
        line_keys = ['id', 'secret', 'token']
        response = c.get(self.uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(res_data), len(line_keys))
        for k in line_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        c = Client()
        line_data = {'secret': 'newsecret'}
        response = c.put(self.uri, json.dumps(line_data), **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)


class FacebookTest(TestCase):
    '''Facebook basic testing

    RU
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'language': 'en',
                    'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        # Initial facebook
        fb_data = {'verify_str': 'thisisverifystr', 'token': 'thisisthetoken',
                   'chatbot': bot_obj}
        self.fb_obj = Facebook.objects.create(**fb_data)

        # Initial uri
        self.uri = '/chatbot/' + str(bot_obj.id) + '/facebook/'\
                   + str(self.fb_obj.id) + '/'

    def test_no_auth(self):
        '''Line no authorization

        GET, PUT
        '''
        c = Client()

        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        fb_data = {'verify_str': 'newverifystr'}
        response = c.put(self.uri, json.dumps(fb_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_read(self):
        c = Client()
        fb_keys = ['id', 'verify_str', 'token']
        response = c.get(self.uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(res_data), len(fb_keys))
        for k in fb_keys:
            self.assertIn(k, res_data)

    def test_update(self):
        c = Client()
        fb_data = {'verify_str': 'newverifystr'}
        response = c.put(self.uri, json.dumps(fb_data), **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)


class LineIgnoreTest(TestCase):
    '''Line ignore user messages

    CRUD
    '''
    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'language': 'en',
                    'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        # Initial line
        line_data = {'secret': 'thisisthesecret', 'token': 'thisisthetoken',
                     'chatbot': bot_obj}
        self.line_obj = Line.objects.create(**line_data)

        # Initial line ignore data
        line_ignore = {'line': self.line_obj, 'display_name': 'Jack',
                       'line_uid': None}
        self.line_ignore_obj = LineIgnore.objects.create(**line_ignore)

        # Initial uri
        self.uri = '/chatbot/' + str(bot_obj.id) + '/line/'\
                   + str(self.line_obj.id) + '/ignore/'

    def test_no_auth(self):
        '''Line ignore no authorization

        POST, GET, PUT, DELETE
        '''
        c = Client()

        # POST
        ignore_data = {'line': self.line_obj.id, 'display_name': 'Jack',
                       'line_uid': None}
        response = c.post(self.uri, json.dumps(ignore_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        ignore_obj_uri = self.uri + str(self.line_ignore_obj.id) + '/'
        response = c.get(ignore_obj_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        ignore_data = {'display_name': 'Nick', 'line_uid': 'aabbcc'}
        response = c.put(ignore_obj_uri, json.dumps(ignore_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(ignore_obj_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''Line ignore object is not existed

        GET, PUT, DELETE
        '''
        c = Client()
        ignore_uri = self.uri + '1000/'

        # GET
        response = c.get(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        update_data = {'line': self.line_obj.id, 'display_name': 'Jack',
                       'line_uid': 'ddddfffff'}
        response = c.put(ignore_uri, json.dumps(update_data),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # DELETE
        response = c.delete(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_create(self):
        '''Create line ignore
        '''
        c = Client()
        ignore_data = {'line': self.line_obj.id, 'display_name': 'Jack',
                       'line_uid': None}

        response = c.post(self.uri, json.dumps(ignore_data),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertIn('id', res_data)
        self.assertIn('line', res_data)
        self.assertIn('display_name', res_data)
        self.assertIn('line_uid', res_data)

    def test_get(self):
        '''Get line ignore
        '''
        c = Client()
        ignore_uri = self.uri + str(self.line_ignore_obj.id) + '/'

        response = c.get(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('id', res_data)
        self.assertIn('line', res_data)
        self.assertIn('display_name', res_data)
        self.assertIn('line_uid', res_data)

    def test_list(self):
        '''List all line ignore
        '''
        c = Client()

        response = c.get(self.uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIsInstance(res_data, list)

    def test_put(self):
        '''Update line ignore
        '''
        c = Client()
        ignore_data = {'line': self.line_obj.id, 'display_name': 'Nick',
                       'line_uid': 'aabbabc'}
        ignore_uri = self.uri + str(self.line_ignore_obj.id) + '/'

        response = c.put(ignore_uri, json.dumps(ignore_data),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        '''Delete line ignore
        '''
        c = Client()
        ignore_uri = self.uri + str(self.line_ignore_obj.id) + '/'

        response = c.delete(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 204)


class FacebookIgnoreTest(TestCase):
    '''Facebook ignore user messsage

    CRUD
    '''

    def setUp(self):
        # Initial paid type an third party
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50',
            'user_type': 'M'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }

        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.third_party.add(demo_obj)

        # Create new account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode',
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Login User
        token_obj = Token.objects.create(user=self.user_obj)
        self.accesstoken = token_obj.key

        # Initial header
        self.header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}

        # Initial bot
        bot_data = {'robot_name': 'test', 'language': 'en',
                    'user': self.user_obj}
        bot_obj = Chatbot.objects.create(**bot_data)

        # Initial facebook
        fb_data = {'verify_str': 'thisisverifystr', 'token': 'thisisthetoken',
                   'chatbot': bot_obj}
        self.fb_obj = Facebook.objects.create(**fb_data)

        # Initial facebook ignore
        facebook_ignore = {'facebook': self.fb_obj, 'display_name': 'Jack',
                           'facebook_uid': None}
        self.fb_ignore_obj = FacebookIgnore.objects.create(**facebook_ignore)

        # Initial uri
        self.uri = '/chatbot/' + str(bot_obj.id) + '/facebook/'\
                   + str(self.fb_obj.id) + '/ignore/'

    def test_no_auth(self):
        '''Facebook ignore no authorization

        POST, GET, PUT, DELETE
        '''
        c = Client()
        ignore_data = {'facebook': self.fb_obj.id, 'display_name': 'Nick',
                       'facebook_uid': None}
        ignore_uri = self.uri + str(self.fb_ignore_obj.id) + '/'

        # POST
        response = c.post(self.uri, json.dumps(ignore_data),
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # GET
        response = c.get(ignore_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        ignore_data['facebook_uid'] = 'aabbccdd'
        response = c.put(ignore_uri, json.dumps(ignore_data),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # DELETE
        response = c.delete(ignore_uri)
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''Facebook ignore not existed

        GET, PUT, DELETE
        '''
        c = Client()
        ignore_uri = self.uri + '10000/'
        ignore_data = {'facebook': self.fb_obj.id, 'display_name': 'Nick',
                       'facebook_uid': None}

        # GET
        response = c.get(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 404)

        # PUT
        response = c.put(ignore_uri, json.dumps(ignore_data),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 404)

        # DELETE
        response = c.delete(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 404)

    def test_create(self):
        '''Create facebook ignore
        '''
        c = Client()
        ignore_data = {'facebook': self.fb_obj.id, 'display_name': 'Jason',
                       'facebook_uid': None}

        response = c.post(self.uri, json.dumps(ignore_data),
                          content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        self.assertIn('id', res_data)
        self.assertIn('facebook', res_data)
        self.assertIn('display_name', res_data)
        self.assertIn('facebook_uid', res_data)

    def test_get(self):
        '''Get facebook ignore
        '''
        c = Client()
        ignore_uri = self.uri + str(self.fb_ignore_obj.id) + '/'

        response = c.get(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('id', res_data)
        self.assertIn('facebook', res_data)
        self.assertIn('display_name', res_data)
        self.assertIn('facebook_uid', res_data)

    def test_list(self):
        '''List all facebook ignore
        '''
        c = Client()

        response = c.get(self.uri, **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIsInstance(res_data, list)

    def test_put(self):
        '''Update facebook ignore
        '''
        c = Client()
        ignore_data = {'facebook': self.fb_obj.id, 'display_name': 'Jason',
                       'facebook_uid': 'aabbabc'}
        ignore_uri = self.uri + str(self.fb_ignore_obj.id) + '/'

        response = c.put(ignore_uri, json.dumps(ignore_data),
                         content_type='application/json', **self.header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_delete(self):
        '''Delete facebook ignore
        '''
        c = Client()
        ignore_uri = self.uri + str(self.fb_ignore_obj.id) + '/'

        response = c.delete(ignore_uri, **self.header)
        self.assertEqual(response.status_code, 204)
