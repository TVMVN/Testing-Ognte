import axios from 'axios';
import Cookies from 'js-cookie';

// --- Token Utilities ---

export const setTokens = (accessToken, refreshToken) => {
  Cookies.set('accessToken', accessToken, {
    expires: 1,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });

  Cookies.set('refreshToken', refreshToken, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });
};

export const getAccessToken = () => Cookies.get('accessToken') || null;
export const getRefreshToken = () => Cookies.get('refreshToken') || null;

export const clearTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};

// --- Login Handler (calls your backend login route) ---

export const login = async (email, password) => {
  try {
    const res = await axios.post('/api/auth/login/', {
      email,
      password,
    });

    const { access, refresh } = res.data;
    setTokens(access, refresh);
    return { success: true };
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

// --- Refresh Token if Access Token Expired ---

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const res = await axios.post('/api/token/refresh/', {
      refresh: refreshToken,
    });

    const { access } = res.data;
    Cookies.set('accessToken', access, {
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    return access;
  } catch (err) {
    console.error('Token refresh failed:', err.response?.data || err.message);
    clearTokens();
    return null;
  }
};

// --- Authenticated Request Helper ---

export const authRequest = async (options) => {
  let accessToken = getAccessToken();

  try {
    const res = await axios({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res;
  } catch (err) {
    if (err.response?.status === 401) {
      accessToken = await refreshAccessToken();

      if (accessToken) {
        try {
          const retryRes = await axios({
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return retryRes;
        } catch (retryErr) {
          throw retryErr;
        }
      }
    }

    throw err;
  }
};
