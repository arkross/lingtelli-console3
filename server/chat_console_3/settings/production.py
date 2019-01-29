from chat_console_3.settings.common import *

# Remember to modify wsgi and manage file to use production settings

DEBUG = False

SECRET_KEY = os.environ.get('SECRET_KEY')