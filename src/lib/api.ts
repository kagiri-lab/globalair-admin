import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('admin_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        
        if (isAuthError && typeof window !== 'undefined') {
            const isLoginPage = window.location.pathname.includes('/login');
            
            if (!isLoginPage) {
                // Clear all auth state
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                document.cookie = 'admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                
                // Hard redirect to login
                window.location.replace('/login?expired=true');
            }
        }
        return Promise.reject(error);
    }
);

export const logEvent = async (action: string, entity_type?: string, entity_id?: string, details?: any) => {
    try {
        await api.post('/logs', { action, entity_type, entity_id, details });
    } catch (e) {
        // Silent fail for logging
    }
};

export default api;
