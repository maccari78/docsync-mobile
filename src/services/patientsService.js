import api from './api';

export const patientsService = {
  getAll: async () => {
    const response = await api.get('/patients');
    return response.data;
  },
};
