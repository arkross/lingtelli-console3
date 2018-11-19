import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from account.models import AccountInfo
from paidtype.models import PaidType
from thirdparty.models import ThirdParty


class AgentRegisterTest(TestCase):
    '''Agent register new account function

    Only for agent to use
    '''

    def test_register_duplicated(self):
        agent_data = {'username': 'admin', 'password': 'adminpassword'}
        User.objects.create(**agent_data)

        c = Client()

        response = c.post('/agent/register/', json.dumps(agent_data),
                         content_type='application/json')
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)

    def test_register_successed(self):
        c = Client()
        response = c.post('/agent/register/', 
                          json.dumps({'username': 'admin',
                                      'password': 'adminpassword'}),
                          content_type='application/json')
        # res_data = json.loads(response.content)
        # user_obj = User.objects.get(username='admin')
        self.assertEqual(response.status_code, 201)
        # self.assertIn('success', res_data)
        # self.assertEqual(user_obj.is_staff, True)
        

class AgentAccessTest(TestCase):
    '''Agent access control to the website

    Contain login and logout features
    '''

    def setUp(self):
        # Initial an agent
        self.agent_data = {'username': 'admin', 'password': 'adminpassword'}
        user_obj = User.objects.create(**self.agent_data)
        user_obj.is_staff = True

    def test_login(self):
        c = Client()
        response = c.post('/agent/login/', json.dumps(self.agent_data),
                          content_type='application/json')
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # self.assertIn('accesstoken', res_data)
    
    def test_login_user_not_found(self):
        c = Client()
        not_regist_agent = {'username': 'newadmin',
                            'password': 'newadminpassword'}
        response = c.post('/agent/login/', json.dumps(not_regist_agent),
                          content_type='application/json')
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 404)
        # self.assertIn('errors', res_data)
    
    def test_login_wrong_password(self):
        c = Client()
        wrong_passwd_agent = {'username': 'admin', 'password': 'thisiswrong'}
        response = c.post('/agent/login/', json.dumps(wrong_passwd_agent),
                          content_type='application/json')
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
       # self.assertIn('errors', res_data)
    
    def test_logout(self):
        # Login to get token first
        user_obj = User.objects.get(username='admin')
        accesstoken = Token.objects.create(user=user_obj)

        # Logout
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + accesstoken.key}
        response = c.get('/agent/logout/', **header)
        # res_data = json.loads(response.content)
        # old_token = Token.objects.filter(key=accesstoken.key).first()
        self.assertEqual(response.status_code, 200)
        # self.assertIn('success', res_data)
        # self.assertIs(old_token, None)

    def test_logout_no_auth(self):
        c = Client()
        response = c.get('/agent/logout/')
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 401)

class AgentProfileTest(TestCase):
    '''Agent profile operations

    Features:
        Read user's own profile data
        Update username and password
        Delete account
    '''
    def setUp(self):
        # Initial package
        trail_obj = {
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_obj = {
            'pk': 4,
            'name': 'demo'
        }
        paidtype_obj = PaidType.objects.create(**trail_obj)
        thirdparty_obj = ThirdParty.objects.create(**demo_obj)
        paidtype_obj.thirdparty.add(thirdparty_obj)

        # Initial agent account
        self.agent_data = {'username': 'admin', 'password': 'adminpassword'}
        user_obj = User.objects.create(**self.agent_data)

        # Initial account info (only need language here but still create it)
        agent_acc_data = {'user': user_obj, 'paid_type': paidtype_obj,
                          'confirmation_code': 'no_need',
                          'code_reset_time': '2010-10-10 00:00:00'}
        AccountInfo.objects.create(**agent_acc_data)
        
        # Initial agent uri
        user_id = user_obj.id
        self.uri = '/agent/' + str(user_id) + '/'

        # Create token to fake login
        self.accesstoken = Token.objects.create(user=user_obj)

    def test_no_auth(self):
        '''Agent profile action no authorization

        GET, PUT, DELETE
        '''
        c = Client()
        # GET
        response = c.get(self.uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        new_agent_name = {'username': 'new_admin'}
        response = c.put(self.uri, json.dumps(new_agent_name),
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

        # Delete
        response = c.delete(self.uri)
        self.assertEqual(response.status_code, 401)

    def test_read(self):
        agent_profile_key = ['username', 'paid_type', 'language']
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        response = c.get(self.uri, **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # for k in agent_profile_key:
        #     self.assertIn(k, res_data)
    
    def test_update_username(self):
        new_agent_username = {'username': 'newadmin'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        response = c.put(self.uri, json.dumps(new_agent_username), 
                         content_type='application/json', **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # self.assertIn('success', res_data)

    def test_update_username_duplicated(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        response = c.put(self.uri, json.dumps(self.agent_data.get('username')),
                         content_type='application/json', **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        # self.assertEqual(res_data.get('errors'), 'Useranme has been used')
    
    def test_update_password(self):
        new_agent_passwd = {'old_password': 'adminpassword',
                            'new_password': 'newadminpassword'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        response = c.put(self.uri, json.dumps(new_agent_passwd),
                         content_type='application/json', **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # self.assertIn('success',res_data)
    
    def test_update_wrong_old_password(self):
        new_agent_passwd = {'old_password': 'thisiswrong',
                            'new_password': 'newagentpassword'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        response = c.put(self.uri, json.dumps(new_agent_passwd),
                         content_type='application/json', **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)

    def test_delete(self):
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        c = Client()
        response = c.delete(self.uri, **header)
        self.assertEqual(response.status_code, 204)
    
    def test_delete_no_confirm(self):
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken.key}
        c = Client()
        response = c.delete(self.uri, **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertIn('errors', res_data)


class DeleteAccountConfirmTest(TestCase):
    '''Deleting account confirm

    Asking user to input password before deleting account
    '''
    def setUp(self):
        # Initial thirdparty and paidtype
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

        # Initial an account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': user_obj, 'paid_type': paidtype_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Initial user id uri
        user_id = user_obj.id
        self.uri = '/agent/' + str(user_id) + '/'

        # Login User
        token_obj = Token.objects.create(user=user_obj)
        self.accesstoken = token_obj.key

    def test_update_confirm_no_auth(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_update_confirm_correct_password(self):
        c = Client()
        correct_password = {'password': 'thisispassword'}
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        acc_info = AccountInfo.objects.get(user=user_obj)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(acc_info.delete_confirm, True)
        # self.assertEqual(res_data.get('success'),
                        #  'Account deleting has confirmed')

    def test_update_confirm_wrong_password(self):
        c = Client()
        correct_password = {'password': 'wrongpassword'}
        header = {'HTTP_AUTHORIZATION': 'bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        # res_data = json.loads(response.content)
        self.assertEqual(response.status_code, 403)
        # self.assertEqual(res_data.get('errors'), 'Password is not correct')
        