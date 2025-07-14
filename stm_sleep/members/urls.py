from django.urls import path
from . import views
from .views import LoginView

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('list_user_folders/', views.list_user_folders, name='list_user_folders'),
    path('upload_folder/', views.upload_folder),
    path('set_active_user/', views.set_active_user, name='set_active_user'),
    path('upload_csv/', views.heart_rate, name='upload_csv'),
    path('process_eog/', views.process_eog, name='process_eog'),
    path('get_summary_pdf/', views.load_summary_pdf, name="get_summary_pdf"),
    path('process_ecg/', views.process_ecg, name='process_eog'),
    path('process_eeg/<str:channel_name>/', views.process_eeg),
    path('fetch_files/',views.fetch_file_name),
    path("delete_file/",views.delete_file),

    path("upload_file/",views.upload_file),

    path('jarvis/', views.jarvis, name='process_eog'),
    # dropbox token
    path('', views.dropbox_oauth_callback, name='dropbox_callback'),
    # path('', views.unauthorized_root),  # root path

]
