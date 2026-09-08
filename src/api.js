export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('pos_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        alert("Your session has expired. Please log in again to continue.");
        localStorage.removeItem('pos_token');
        window.location.href = '/'; 
        throw new Error("Session expired"); 
    }

    return response;
};