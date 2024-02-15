DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',  # Name of the service in docker-compose
        'PORT': '5432',
    }
}

ALLOWED_HOSTS = ['*']