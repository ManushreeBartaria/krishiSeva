import axios from 'axios';

const api = axios.create({
  baseURL: '/auth',
  headers: { 'Content-Type': 'application/json' },
});

// Base URL for static assets served from the backend
export const UPLOADS_BASE = 'http://127.0.0.1:8000';

// ────────────────────────────────────────────────
// AUTH / REGISTER
// ────────────────────────────────────────────────
export const registerFarmer    = (data) => api.post('/register/farmer',    data);
export const registerBuyer     = (data) => api.post('/register/buyer',     data);
export const registerOrganizer = (data) => api.post('/register/organizer', data);
export const registerAdmin     = (data) => api.post('/register/admin',     data);

// ────────────────────────────────────────────────
// PRODUCTS (farmer adds)
// ────────────────────────────────────────────────
export const addFoodProduct = (farmerId, data) =>
  api.post(`/food/${farmerId}`, data);

export const addCraftProduct = (farmerId, formData) =>
  api.post(`/craft/${farmerId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ────────────────────────────────────────────────
// PRODUCT LISTING (buyer / admin)
// ────────────────────────────────────────────────
export const getAllFoodProducts  = () => api.get('/products/food');
export const getAllCraftProducts = () => api.get('/products/craft');

// ────────────────────────────────────────────────
// ORDERS
// ────────────────────────────────────────────────
export const createOrder      = (data)     => api.post('/orders/',           data);
export const getBuyerOrders   = (buyerId)  => api.get(`/buyer/${buyerId}`);
export const getFarmerOrders  = (farmerId) => api.get(`/farmer/${farmerId}`);

// ────────────────────────────────────────────────
// ORGANIZER REQUESTS
// ────────────────────────────────────────────────
export const createOrganizerRequest = (data)        => api.post('/organizer-requests', data);
export const getAllRequests          = ()            => api.get('/requests');
export const getOrganizerRequests   = (organizerId) => api.get(`/requests/${organizerId}`);

// ────────────────────────────────────────────────
// NEARBY FARMERS (buyer)
// ────────────────────────────────────────────────
export const getNearbyFarmers = (address, radius = 10) =>
  api.get('/nearby-farmers', { params: { address, radius } });

// ────────────────────────────────────────────────
// ADMIN
// ────────────────────────────────────────────────
export const adminGetAllEvents      = ()            => api.get('/admin/all-events');
export const adminGetNearbyFarmers  = (address, radius = 50) =>
  api.get('/admin/nearby-farmers', { params: { address, radius } });

export default api;
