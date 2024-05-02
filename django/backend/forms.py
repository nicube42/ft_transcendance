from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = UserCreationForm.Meta.fields + ('fullname', 'profile_pic')

class ProfilePicUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['profile_pic']

class CustomUserForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'fullname', 'profile_pic']

class ProfilePicUpdateForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        fields = ['profile_pic']