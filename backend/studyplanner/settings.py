
"""
Django settings for studyplanner project.
"""

import os
from pathlib import Path
from importlib.util import find_spec
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_csv(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [part.strip() for part in raw.split(",") if part.strip()]


def _safe_hostname(url: str) -> str | None:
    if not url:
        return None
    try:
        return urlparse(url).hostname
    except ValueError:
        return None


PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "").strip().rstrip("/")
FRONTEND_APP_URL = os.getenv("FRONTEND_APP_URL", "").strip().rstrip("/")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "replace-this-in-deployment")
DEBUG = _env_bool("DJANGO_DEBUG", False)

# Allow local dev plus any explicitly configured public hosts.
default_hosts = ["127.0.0.1", "localhost", "192.168.8.167"]
allowed_hosts = set(_env_csv("DJANGO_ALLOWED_HOSTS", ",".join(default_hosts)))
for candidate in [PUBLIC_APP_URL, FRONTEND_APP_URL]:
    host = _safe_hostname(candidate)
    if host:
        allowed_hosts.add(host)
ALLOWED_HOSTS = sorted(allowed_hosts)

# Exact origins only. Include both frontend and backend public URLs when set.
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://192.168.8.167:8080",
]
allowed_origins = set(_env_csv("DJANGO_CORS_ALLOWED_ORIGINS", ",".join(default_origins)))
for candidate in [PUBLIC_APP_URL, FRONTEND_APP_URL]:
    if candidate:
        allowed_origins.add(candidate)
CORS_ALLOWED_ORIGINS = sorted(allowed_origins)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = sorted(set(_env_csv("DJANGO_CSRF_TRUSTED_ORIGINS", ",".join(CORS_ALLOWED_ORIGINS))) | set(CORS_ALLOWED_ORIGINS))

is_https_public = PUBLIC_APP_URL.startswith("https://") or FRONTEND_APP_URL.startswith("https://")
secure_by_default = (not DEBUG) and is_https_public
SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", secure_by_default)
SESSION_COOKIE_SECURE = _env_bool("DJANGO_SESSION_COOKIE_SECURE", secure_by_default)
CSRF_COOKIE_SECURE = _env_bool("DJANGO_CSRF_COOKIE_SECURE", secure_by_default)
SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000" if secure_by_default else "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", secure_by_default)
SECURE_HSTS_PRELOAD = _env_bool("DJANGO_SECURE_HSTS_PRELOAD", secure_by_default)

# Cross-site cookies are required when the frontend is on Vercel and the backend is on another domain.
default_samesite = "None" if FRONTEND_APP_URL and PUBLIC_APP_URL and _safe_hostname(FRONTEND_APP_URL) != _safe_hostname(PUBLIC_APP_URL) else "Lax"
SESSION_COOKIE_SAMESITE = os.getenv("DJANGO_SESSION_COOKIE_SAMESITE", default_samesite)
CSRF_COOKIE_SAMESITE = os.getenv("DJANGO_CSRF_COOKIE_SAMESITE", default_samesite)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
APPEND_SLASH = True

HAS_CORSHEADERS = find_spec("corsheaders") is not None
HAS_DJ_DATABASE_URL = find_spec("dj_database_url") is not None
HAS_WHITENOISE = find_spec("whitenoise") is not None

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'planner',
]

if HAS_CORSHEADERS:
    INSTALLED_APPS.append('corsheaders')

MIDDLEWARE = [
    'studyplanner.cors.SimpleCorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

if HAS_CORSHEADERS:
    MIDDLEWARE.insert(1, 'corsheaders.middleware.CorsMiddleware')
if HAS_WHITENOISE:
    MIDDLEWARE.insert(2, 'whitenoise.middleware.WhiteNoiseMiddleware')

ROOT_URLCONF = 'studyplanner.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'studyplanner.wsgi.application'

DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
if DATABASE_URL and HAS_DJ_DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=int(os.getenv('DJANGO_DB_CONN_MAX_AGE', '600')),
            ssl_require=DATABASE_URL.startswith('postgres://') or DATABASE_URL.startswith('postgresql://'),
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/London'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' if HAS_WHITENOISE else 'django.contrib.staticfiles.storage.StaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
