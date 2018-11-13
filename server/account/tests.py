import json
from django.test import TestCase, Client

from django.contrib.auth.models import User
from account.models import AccountInfo
from acctype.models import PaidType
from thirdparty.models import ThirdParty

class MemberRegisterTest(TestCase):
    '''Unit test for member registering new account

    Only for testing member register apis
    '''

    def setUp(self):
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

    def test_key_amount_not_correct(self):
        '''Key amount not correct

        Check key amount is the same as requirement
        '''

        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'first_name':'nickname',
                                      'other':'other'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 400
        assert res_data.get('errors') == \
            'Lack or more then the required key amount'
        
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 400
        assert res_data.get('errors') == \
            'Lack or more then the required key amount'

        response = c.post('/member/register/',
                          json.dumps({}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 400
        assert res_data.get('errors') == \
            'Lack or more then the required key amount'
    
    def test_key_not_correct(self):
        '''Key name not correct

        When key amount is correct, check if the key name is correct.
        '''

        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'test@gmail.com',
                                      'password':'thisispassword',
                                      'other':'other'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 400
        assert res_data.get('errors') == 'Key missing: first_name'

    def test_email_not_valid(self):
        '''Email format not correct

        Check if email format is correct
        '''

        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'thisisemail123',
                                      'password':'thisispassword',
                                      'first_name':'nickname'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 400
        assert res_data.get('errors') == 'Invalid email address'

    def test_register_duplicated(self):
        '''Register the same username

        Already have the same username in db
        '''
        user_obj = {
            'username': 'cosmo.hu@lingtelli.com',
            'password': 'thisispassword',
            'first_name': 'cosmo'
        }
        User.objects.create(**user_obj)
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'cosmo.hu@lingtelli.com',
                                      'password':'anotherpassword',
                                      'first_name':'cosmoother'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        assert response.status_code == 403
        assert res_data.get('errors') == 'User name has existed'

    def test_register_successed(self):
        '''Register new account successed

        Successfully register and account
        '''
        
        c = Client()
        response = c.post('/member/register/',
                          json.dumps({'username':'cosmo.hu@lingtelli.com',
                                      'password':'thisispassword',
                                      'first_name':'cosmo'}),
                          content_type='application/json')
        res_data = json.loads(response.content)
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        assert response.status_code == 200
        assert res_data.get('success') == \
            'User has successfully created. ' +\
            'Please check email for account validation'
        assert user_obj.is_active == False

class ResendEmail(TestCase):
    '''Resend email function

    To test if resend function works
    '''

    def setUp(self):
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


    def test_cannot_find_user(self):
        '''Resend email with user not found

        Request for new email when user cannot be found
        '''

        c = Client()
        
        response = c.get('/member/resend/',
                          {'username': 'cosmo.hu@lingtelli.com'})
        res_data = json.loads(response.content)
        assert response.status_code == 404
        assert res_data.get('errors') == 'Please register an account first'

    def test_confirmed_resend(self):
        '''Confirmed and resend

        User has confirmed the email and still request for resending email
        '''

        c = Client()
        # Initial an member account first
        c.post('/member/register/', 
               json.dumps({'username': 'cosmo.hu@lingtelli.com',
                           'password': 'thistispassword',
                           'first_name': 'cosmo'}),
               content_type='application/json')

        # Set user is_active to true
        user_obj = User.objects.get(username='cosmo.hu@lingtelli.com')
        user_obj.is_active = True
        user_obj.save()

        # Requset sending email again
        response = \
            c.get('/member/resend/', {'username': 'cosmo.hu@lingtelli.com'})
        res_data = json.loads(response.content)
        assert response.status_code == 403
        assert res_data.get('errors') == \
            'Account has been confirmed. ' +\
            'No need to get confirmation email again'

    # def test_send_over_3_times(self):
    #     '''Resend email over 3 times

    #     Stop user after sending email over 3 times
    #     '''



        


    


    