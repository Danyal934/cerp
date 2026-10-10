import router from '../router/index.js'


export function auth(to, from, next) {
  const token = localStorage.getItem('token');
  if (token) {
    next();
  } else {
    next('/');
  }
}

export function Guest(to, from, next) {
  const token = localStorage.getItem('token');
  console.log(token);
  if (token) {
    next('/dashboard');
  } else {
    next();
  }
}



