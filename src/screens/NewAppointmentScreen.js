import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { appointmentsService } from '../services/appointmentsService';
import { professionalsService } from '../services/professionalsService';
import { clinicsService } from '../services/clinicsService';
import { patientsService } from '../services/patientsService';
import { authService } from '../services/api';

export default function NewAppointmentScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allProfessionals, setAllProfessionals] = useState([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isNonPatient, setIsNonPatient] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const user = await authService.getCurrentUser();
      setIsNonPatient(user?.role !== 'patient');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsNonPatient(false); // Default a comportamiento de paciente
    }
  };

  useEffect(() => {
    if (selectedClinic) {
      // Filtrar profesionales por clínica seleccionada
      const filtered = allProfessionals.filter(
        prof => prof.clinic.id === selectedClinic.id
      );
      setFilteredProfessionals(filtered);
      
      // Si el profesional seleccionado no pertenece a la nueva clínica, deseleccionar
      if (selectedProfessional && selectedProfessional.clinic.id !== selectedClinic.id) {
        setSelectedProfessional(null);
      }
    } else {
      setFilteredProfessionals([]);
      setSelectedProfessional(null);
    }
  }, [selectedClinic, allProfessionals]);

  useEffect(() => {
    loadAvailability();
    // Resetear selectedTime porque los slots disponibles cambiaron
    setSelectedTime('');
  }, [selectedProfessional, selectedDate]);

  const loadAvailability = async () => {
    // Reset si no hay professional o date
    if (!selectedProfessional || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingAvailability(true);
    try {
      const data = await appointmentsService.getAvailability(
        selectedProfessional.id,
        selectedDate
      );
      setAvailableSlots(data.available);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'No se pudo verificar disponibilidad. Mostrando todos los horarios.');
      // Fallback: mostrar todos los horarios si falla
      setAvailableSlots(timeSlots);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      const fetchPatients = user?.role !== 'patient';

      const promises = [
        professionalsService.getAll(),
        clinicsService.getAll(),
      ];

      if (fetchPatients) {
        promises.push(patientsService.getAll());
      }

      const results = await Promise.all(promises);
      setAllProfessionals(results[0]);
      setClinics(results[1]);

      if (fetchPatients && results[2]) {
        setPatients(results[2]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (isNonPatient && !selectedPatient) {
      Alert.alert('Error', 'Por favor selecciona un paciente');
      return;
    }
    if (!selectedClinic) {
      Alert.alert('Error', 'Por favor selecciona una clínica');
      return;
    }
    if (!selectedProfessional) {
      Alert.alert('Error', 'Por favor selecciona un profesional');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Error', 'Por favor ingresa una fecha');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Por favor ingresa una hora');
      return;
    }

    setSubmitting(true);
    try {
      const appointmentData = {
        professional_id: selectedProfessional.id,
        clinic_id: selectedClinic.id,
        date: selectedDate,
        time: selectedTime,
      };

      // Agregar patient_id si es no-paciente
      if (isNonPatient && selectedPatient) {
        appointmentData.patient_id = selectedPatient.id;
      }

      await appointmentsService.create(appointmentData);

      Alert.alert(
        'Éxito',
        'Turno solicitado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Appointments with Dashboard in stack
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Dashboard' },
                  { name: 'Appointments' }
                ],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      console.error('Error response:', error.response?.data); // AGREGÁ ESTA LÍNEA
      Alert.alert('Error', 'No se pudo crear el turno');
    } finally {
      setSubmitting(false);
    }
  };

  // Sugerencias de horarios
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  // Próximos 30 días
  const getNextDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Use local date components to avoid timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      days.push(dateString);
    }
    return days;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Solicitar Turno</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Paciente - STEP 0 (solo para admin/secretary/professional) */}
        {isNonPatient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              1. Paciente * ({patients.length} disponibles)
            </Text>
            {patients.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {patients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={[
                      styles.chip,
                      selectedPatient?.id === patient.id && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedPatient(patient)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedPatient?.id === patient.id && styles.chipTextSelected,
                      ]}
                    >
                      {patient.name}
                    </Text>
                    {patient.email && (
                      <Text
                        style={[
                          styles.chipSubtext,
                          selectedPatient?.id === patient.id && styles.chipTextSelected,
                        ]}
                      >
                        {patient.email}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No hay pacientes disponibles
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Clínica - PRIMERO para pacientes, SEGUNDO para no-pacientes */}
        {(!isNonPatient || selectedPatient) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isNonPatient ? '2' : '1'}. Clínica *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {clinics.map((clinic) => (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    styles.chip,
                    selectedClinic?.id === clinic.id && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedClinic(clinic)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedClinic?.id === clinic.id && styles.chipTextSelected,
                    ]}
                  >
                    {clinic.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Profesional - SEGUNDO para pacientes, TERCERO para no-pacientes (solo si hay clínica seleccionada) */}
        {selectedClinic && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isNonPatient ? '3' : '2'}. Profesional * ({filteredProfessionals.length} disponibles)
            </Text>
            {filteredProfessionals.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filteredProfessionals.map((prof) => (
                  <TouchableOpacity
                    key={prof.id}
                    style={[
                      styles.chip,
                      selectedProfessional?.id === prof.id && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedProfessional(prof)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedProfessional?.id === prof.id && styles.chipTextSelected,
                      ]}
                    >
                      {prof.name}
                    </Text>
                    <Text
                      style={[
                        styles.chipSubtext,
                        selectedProfessional?.id === prof.id && styles.chipTextSelected,
                      ]}
                    >
                      {prof.specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No hay profesionales disponibles en esta clínica
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Fecha */}
        {selectedProfessional && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{isNonPatient ? '4' : '3'}. Fecha *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getNextDays().slice(0, 10).map((date) => {
                // Parse date string directly to avoid timezone issues
                const [year, month, day] = date.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const monthName = monthNames[parseInt(month, 10) - 1];

                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateChip,
                      selectedDate === date && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        selectedDate === date && styles.chipTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        selectedDate === date && styles.chipTextSelected,
                      ]}
                    >
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Hora */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isNonPatient ? '5' : '4'}. Hora * ({availableSlots.length} disponibles)
            </Text>
            {loadingAvailability ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color="#007AFF" />
                <Text style={styles.emptyText}>Verificando disponibilidad...</Text>
              </View>
            ) : availableSlots.length > 0 ? (
              <View style={styles.timeGrid}>
                {availableSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeChip,
                      selectedTime === time && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedTime === time && styles.chipTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No hay horarios disponibles para esta fecha
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Resumen */}
        {selectedProfessional && selectedClinic && selectedDate && selectedTime &&
         (!isNonPatient || selectedPatient) && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>✓ Resumen del Turno</Text>
            <View style={styles.summaryCard}>
              {isNonPatient && selectedPatient && (
                <Text style={styles.summaryText}>
                  👤 {selectedPatient.name}
                </Text>
              )}
              <Text style={styles.summaryText}>
                🏥 {selectedClinic.name}
              </Text>
              <Text style={styles.summaryText}>
                👨‍⚕️ {selectedProfessional.name}
              </Text>
              <Text style={styles.summaryText}>
                📅 {(() => {
                  // Parse date string directly to avoid timezone issues
                  const [year, month, day] = selectedDate.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  return date.toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  });
                })()}
              </Text>
              <Text style={styles.summaryText}>
                🕐 {selectedTime} hs
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Solicitar Turno</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  chipSubtext: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  chipTextSelected: {
    color: '#fff',
  },
  dateChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    minWidth: 60,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  summarySection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});