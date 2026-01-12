import api from './api';

export const appointmentsService = {
  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  confirm: async (id) => {
    const response = await api.post(`/appointments/${id}/confirm`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/appointments/${id}/cancel`);
    return response.data;
  },

  complete: async (id) => {
    const response = await api.post(`/appointments/${id}/complete`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/appointments/${id}`, { appointment: data });
    return response.data;
  },

  create: async (appointmentData) => {
    const response = await api.post('/appointments', { appointment: appointmentData });
    return response.data;
  },

  getAvailability: async (professionalId, date) => {
    const response = await api.get('/appointments/availability', {
      params: {
        professional_id: professionalId,
        date: date
      }
    });
    return response.data;
  },

  initiatePayment: async (id) => {
    const response = await api.post(`/appointments/${id}/initiate_payment`);
    return response.data;
  },
};