from django.test import TestCase, Client


class AgentRegisterTest(TestCase):
    '''Agent register new account function

    Only for agent to use
    '''

    def test_register_duplicated(self):
        pass

    def test_register_successed(self):
        pass

class AgentAccessTest(TestCase):
    '''Agent access control to the website

    Contain login and logout features
    '''

    def test_login(self):
        pass
    
    def test_login_user_not_found(self):
        pass
    
    def test_login_wrong_password(self):
        pass
    
    def test_logout(self):
        pass

    def test_logout_no_token(self):
        pass

class AgentProfileTest(TestCase):
    '''Agent profile operations

    Features:
        Read user's own profile data
        Update username and password
        Delete account
    '''

    def test_read_profile(self):
        pass
    
    def test_not_login_read_profile(self):
        pass
    
    def test_update_username(self):
        pass

    def test_update_username_duplicated(self):
        pass
    
    def test_no_login_update_username(self):
        pass
    
    def test_update_password(self):
        pass
    
    def test_no_login_update_password(self):
        pass

    def test_update_nickname(self):
        pass
    
    def test_no_login_update_nickname(self):
        pass

    def test_delete_account(self):
        pass

    def test_no_login_delete_account(self):
        pass