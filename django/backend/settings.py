from django.core.management.utils import get_random_secret_key
from dotenv import load_dotenv
import os
load_dotenv()
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DATABASE_NAME'),
        'USER': os.getenv('DATABASE_USER'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD'),
        'HOST': os.getenv('DATABASE_HOST'),
        'PORT': os.getenv('DATABASE_PORT'),
    }
}

INSTALLED_APPS = [
    'backend',
    'django.contrib.staticfiles',
    'django.contrib.sessions',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'corsheaders',
    'channels',
    'channels_redis',
    'uvicorn',
    'aioredis',
    'django.contrib.admin',
    'django.contrib.messages'
]

MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

SECRET_KEY = get_random_secret_key()

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

ALLOWED_HOSTS = ['*']

ROOT_URLCONF = 'backend.urls'

AUTH_USER_MODEL = 'backend.CustomUser'

LOGOUT_REDIRECT_URL = 'firstpage'

LOGIN_REDIRECT_URL = 'homepage'

ASGI_APPLICATION = 'backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
            "capacity": 1500,
        },
    },
}

CORS_ALLOWED_ORIGINS = [
    'https://localhost:4242',
]

CORS_ALLOW_CREDENTIALS = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = 'media/'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = 'static/'

STATICFILES_DIRS = [
    #os.path.join(BASE_DIR, 'backend', 'static'),#todo check later
    os.path.join(BASE_DIR, 'static'),
]

# CSRF_COOKIE_NAME = 'csrftoken'

# CSRF_COOKIE_SECURE = True

# CSRF_COOKIE_DOMAIN = None

# CSRF_COOKIE_HTTPONLY = False
