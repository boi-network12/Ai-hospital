// helper/cookie.ts
import Cookies from 'js-cookie';

const isProduction = process.env.NODE_ENV === 'production';

export const setCookie = (name: string, value: string, days: number) => {
  Cookies.set(name, value, {
    expires: days,
    secure: isProduction,        
    sameSite: 'strict',
    path: '/',
  });
};

export const getCookie = (name: string) => Cookies.get(name);
export const deleteCookie = (name: string) => Cookies.remove(name);