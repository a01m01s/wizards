import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password
      }
      // withCredentials: true
      // headers: {
      //   'Content-Type': 'application/json;charset=UTF-8',
      //   // 'Access-Control-Allow-Origin': 'http://localhost:3000/'
      //   // 'Access-Control-Allow-Credentials': true
      // }
    });
    console.log(res);
    if (res.data.status === 'success') {
      console.log(`email and pass are ${email} ${password}`);
      // showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/posts');
      }, 1500);
    }
  } catch (err) {
    console.log('error', err.response.data.message);
  }
};
