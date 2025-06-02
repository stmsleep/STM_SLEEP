from django.urls import path
from . import views

urlpatterns = [
    path('set_active_user/', views.set_active_user, name='set_active_user'),
    path('display_users/', views.display_users, name='display_users'),
    path('upload_csv/', views.upload_csv, name='upload_csv'),
    path('process_eog/',views.process_eog,name='process_eog'),
    path('get_summary_pdf/',views.load_summary_pdf,name="get_summary_pdf"),
    path('process_ecg/',views.process_ecg,name='process_eog')
]
