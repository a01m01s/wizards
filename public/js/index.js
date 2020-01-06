import '@babel/polyfill';
import { login, logout } from './login';
import 'bootstrap';
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.logout');

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);
