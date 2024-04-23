from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = UserCreationForm.Meta.fields + ('fullname', 'date_of_birth')

class ProfilePicUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['profile_pic']
