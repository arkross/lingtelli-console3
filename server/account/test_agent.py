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
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_register_successed(self):
        c = Client()
        response = c.post('/agent/register/', 
                          json.dumps({'username': 'admin',
                                      'password': 'adminpassword'}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 201)
        res_data = json.loads(response.content)
        user_obj = User.objects.get(username='admin')
        self.assertIn('success', res_data)
        self.assertEqual(user_obj.is_staff, True)
        

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
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('accesstoken', res_data)
    
    def test_login_user_not_found(self):
        c = Client()
        not_regist_agent = {'username': 'newadmin',
                            'password': 'newadminpassword'}
        response = c.post('/agent/login/', json.dumps(not_regist_agent),
                          content_type='application/json')
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_login_wrong_password(self):
        c = Client()
        wrong_passwd_agent = {'username': 'admin', 'password': 'thisiswrong'}
        response = c.post('/agent/login/', json.dumps(wrong_passwd_agent),
                          content_type='application/json')
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_logout(self):
        # Login to get token first
        user_obj = User.objects.get(username='admin')
        accesstoken = Token.objects.create(user=user_obj)

        # Logout
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + accesstoken.key}
        response = c.get('/agent/logout/', **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        old_token = Token.objects.filter(key=accesstoken.key).first()
        self.assertIn('success', res_data)
        self.assertIs(old_token, None)

    def test_logout_no_auth(self):
        c = Client()
        response = c.get('/agent/logout/')
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
        trial_data = {
            'pk': 1,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.thirdparty.add(demo_obj)

        # Initial agent account
        self.agent_data = {'username': 'admin', 'password': 'adminpassword'}
        user_obj = User.objects.create(**self.agent_data)

        # Initial account info (only need language here but still create it)
        agent_acc_data = {'user': user_obj, 'paid_type': trial_obj,
                          'confirmation_code': 'no_need',
                          'code_reset_time': '2010-10-10 00:00:00'}
        AccountInfo.objects.create(**agent_acc_data)

        # Login agent
        token_obj = Token.objects.create(user=user_obj)
        self.accesstoken = token_obj.key
        
        # Initial agent uri
        user_id = user_obj.id
        self.uri = '/agent/' + str(user_id) + '/'

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
    
    def test_not_existed(self):
        '''Agent account not existed

        GET, PUT, DELETE
        '''
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        # GET
        response = c.get(self.uri, header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # PUT
        new_agent_name = {'username': 'new_admin'}
        response = c.put(self.uri, json.dumps(new_agent_name),
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

        # Delete
        response = c.delete(self.uri, **header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_read(self):
        agent_profile_key = ['username', 'paid_type', 'language']
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.get(self.uri, **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(res_data), len(agent_profile_key))
        for k in agent_profile_key:
            self.assertIn(k, res_data)
    
    def test_update_username(self):
        new_agent_username = {'username': 'newadmin'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(new_agent_username), 
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)

    def test_update_username_duplicated(self):
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(self.agent_data.get('username')),
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 400)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('errors'), 'Useranme has been used')
    
    def test_update_password(self):
        new_agent_passwd = {'old_password': 'adminpassword',
                            'new_password': 'newadminpassword'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(new_agent_passwd),
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success',res_data)
    
    def test_update_wrong_old_password(self):
        new_agent_passwd = {'old_password': 'thisiswrong',
                            'new_password': 'newagentpassword'}
        c = Client()
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(new_agent_passwd),
                         content_type='application/json', **header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)

    def test_delete(self):
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        c = Client()
        response = c.delete(self.uri, **header)
        self.assertEqual(response.status_code, 204)
    
    def test_delete_no_confirm(self):
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        c = Client()
        response = c.delete(self.uri, **header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)


class DeleteAccountConfirmTest(TestCase):
    '''Deleting account confirm

    Asking user to input password before deleting account
    '''
    def setUp(self):
        # Initial thirdparty and paidtype
        trial_data = {
            'pk': 1,
            'name': 'Trail',
            'duration': '0_0',
            'bot_amount': '1',
            'faq_amount': '50'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.thirdparty.add(demo_obj)

        # Initial an account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': user_obj, 'paid_type': trial_obj,
                    'confirmation_code': 'confirmationcode', 
                    'code_reset_time': '2019-12-12 00:00:00', }
        AccountInfo.objects.create(**acc_data)

        # Initial user id uri
        user_id = user_obj.id
        self.uri = '/agent/' + str(user_id) + '/confirm/'

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
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        acc_info = AccountInfo.objects.get(user=user_obj)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(acc_info.delete_confirm, True)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('success'),
                         'Account deleting has confirmed')

    def test_update_confirm_wrong_password(self):
        c = Client()
        correct_password = {'password': 'wrongpassword'}
        header = {'HTTP_AUTHORIZATION': 'Bearer ' + self.accesstoken}
        response = c.put(self.uri, json.dumps(correct_password), 
                          content_type='application/json', **header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertEqual(res_data.get('errors'), 'Password is not correct')


class AgentMemberTest(TestCase):
    '''Agent read member related data
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
            'pk' : 2,
            'name': 'Staff',
            'duration': '0_0',
            'bot_amount': '0',
            'faq_amount': '0'
        }

        demo_data = {
            'pk': 4,
            'name': 'demo'
        }
        trial_obj = PaidType.objects.create(**trial_data)
        staff_obj = PaidType.objects.create(**staff_data)
        demo_obj = ThirdParty.objects.create(**demo_data)
        trial_obj.thirdparty.add(demo_obj)

        # Create new member account
        user_data = {'username': 'cosmo.hu@lingtelli.com',
                     'password': 'thisispassword',
                     'first_name': 'cosmo'}
        self.user_obj = User.objects.create(**user_data)

        # Create account info
        acc_data = {'user': self.user_obj, 'paid_type': trial_obj,
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

        # Login Agent
        agent_token_obj = Token.objects.create(user=self.agent_obj)
        self.agent_token = agent_token_obj.key

        # Initial header
        self.agent_header =\
            {'HTTP_AUTHORIZATION': 'Bearer ' + self.agent_token}

        # Initial uri
        self.member_uri = '/agent/' + str(self.agent_obj.id) + '/member/'

        
    
    def test_no_auth(self):
        '''Agent read and update member data
        GET PUT
        '''
        c = Client()

        # GET
        response = c.get(self.member_uri)
        self.assertEqual(response.status_code, 401)

        # PUT
        the_member_uri = self.member_uri + '1/'
        response = c.put(the_member_uri,
                         json.dumps({'paidtype': 2}), 
                         content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_not_existed(self):
        '''Member does not exist
        '''
        c = Client()
        the_member_uri = self.member_uri + '100/'
        response = c.get(the_member_uri, **self.agent_header)
        self.assertEqual(response.status_code, 404)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)
    
    def test_read(self):
        c = Client()
        member_keys = ['username', 'first_name', 'paid_type', 'start_date',
                       'expire_date']
        the_member_uri = self.member_uri + '1/'
        response = c.get(the_member_uri, **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertEqual(len(member_keys), len(res_data))
        for k in member_keys:
            self.assertIn(k, res_data)

    def test_update_paidtype(self):
        c = Client()
        the_member_uri = self.member_uri + '1/'
        response = c.put(the_member_uri,
                         json.dumps({'paid_type': 2}),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.content)
        self.assertIn('success', res_data)
    
    def test_update_other_key_not_allowed(self):
        c = Client()
        the_member_uri = self.member_uri + '1/'
        response = c.put(the_member_uri, json.dumps({'username': 'new'}),
                         content_type='application/json', **self.agent_header)
        self.assertEqual(response.status_code, 403)
        res_data = json.loads(response.content)
        self.assertIn('errors', res_data)