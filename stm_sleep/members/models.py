from django.db import models


class DropboxToken(models.Model):
    class Meta:
        app_label = 'members'
    access_token = models.TextField()
    refresh_token = models.TextField()
    expires_at = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)
