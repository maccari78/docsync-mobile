import api from './api';

export const clinicsService = {
  getAll: async () => {
    const response = await api.get('/clinics');
    return response.data;
  },
};