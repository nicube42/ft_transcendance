from django.core.management.utils import get_random_secret_key

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',
        'PORT': '5432',
    }
}

INSTALLED_APPS = [
    'backend',
    'django.contrib.staticfiles',
    'django.contrib.auth',
    'django.contrib.contenttypes',
]

STATIC_URL = '/static/'

SECRET_KEY = get_random_secret_key()

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

ALLOWED_HOSTS = ['*']

ROOT_URLCONF = 'backend.urls'

AUTH_USER_MODEL = 'backend.CustomUser'

LOGOUT_REDIRECT_URL = 'homepage'

LOGIN_REDIRECT_URL = 'homepage'