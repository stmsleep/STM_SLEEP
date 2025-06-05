from django.utils import timezone
from datetime import timedelta
from ..models import DropboxToken


# Save the token after initial dropbox 

def save_tokens(access_token, refresh_token, expires_in_seconds):
    expires_at = timezone.now() + timedelta(seconds=expires_in_seconds)

    token_obj, created = DropboxToken.objects.get_or_create(id=1)
    token_obj.access_token = access_token
    token_obj.refresh_token = refresh_token
    token_obj.expires_at = expires_at
    token_obj.save()


import requests
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from ..models import DropboxToken

# Implementing refresh token 

def refresh_dropbox_token():
    token_obj = DropboxToken.objects.first()
    if not token_obj:
        raise Exception("Dropbox tokens not found in database")

    if token_obj.expires_at > timezone.now():
        return token_obj.access_token

    url = "https://api.dropbox.com/oauth2/token"
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': token_obj.refresh_token,
        'client_id': settings.DROPBOX_APP_KEY,
        'client_secret': settings.DROPBOX_APP_SECRET,
    }

    response = requests.post(url, data=data)
    if response.status_code == 200:
        tokens = response.json()
        token_obj.access_token = tokens['access_token']
        expires_in = tokens.get('expires_in', 14400)  # 4 hours 
        token_obj.expires_at = timezone.now() + timedelta(seconds=expires_in)
        token_obj.save()
        return token_obj.access_token
    else:
        raise Exception(f"Failed to refresh Dropbox token: {response.content}")


# helper function for getting dropbox client
import dropbox

def get_dropbox_client():
    access_token = refresh_dropbox_token()
    return dropbox.Dropbox(access_token)