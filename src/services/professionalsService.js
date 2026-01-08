import api from './api';

export const professionalsService = {
  getAll: async () => {
    const response = await api.get('/professionals');
    return response.data;
  },
};