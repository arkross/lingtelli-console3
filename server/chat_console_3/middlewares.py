from rest_framework.authentication import TokenAuthentication

class BearerTokenAuthentication(TokenAuthentication):
    TokenAuthentication.keyword = 'Bearer'