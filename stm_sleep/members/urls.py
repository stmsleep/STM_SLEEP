from django.urls import path
from . import views

urlpatterns = [
    path('upload_csv/', views.upload_csv, name='upload_csv'),
    path('process_eog/',views.process_eog,name='process_eog'),
    path('get_summary_pdf/',views.load_summary_pdf,name="get_summary_pdf")
]