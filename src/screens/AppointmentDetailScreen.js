import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { appointmentsService } from '../services/appointmentsService';

export default function AppointmentDetailScreen({ route, navigation }) {
  const [appointment, setAppointment] = useState(route.params.appointment);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    Alert.alert(
      'Confirmar Turno',
      '¿Estás seguro que deseas confirmar este turno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await appointmentsService.confirm(appointment.id);
              setAppointment(updated);
              Alert.alert('Éxito', 'Turno confirmado correctamente');
            } catch (error) {
              console.error('Error confirming appointment:', error);
              Alert.alert('Error', 'No se pudo confirmar el turno');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancelar Turno',
      '¿Estás seguro que deseas cancelar este turno?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await appointmentsService.cancel(appointment.id);
              setAppointment(updated);
              Alert.alert('Turno Cancelado', 'El turno ha sido cancelado');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'No se pudo cancelar el turno');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Completar Turno',
      '¿Marcar este turno como completado?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, completar',
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await appointmentsService.complete(appointment.id);
              setAppointment(updated);
              Alert.alert('Éxito', 'Turno marcado como completado');
            } catch (error) {
              console.error('Error completing appointment:', error);
              Alert.alert('Error', 'No se pudo completar el turno');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Detalle del Turno</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(appointment.status)}</Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>
          <View style={styles.card}>
            <Text style={styles.dateText}>{formatDate(appointment.date)}</Text>
            <Text style={styles.timeText}>{appointment.time} hs</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paciente</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{appointment.patient.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{appointment.patient.email}</Text>
            </View>
          </View>
        </View>

        {/* Professional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profesional</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{appointment.professional.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{appointment.professional.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Especialidad:</Text>
              <Text style={styles.value}>{appointment.professional.specialty}</Text>
            </View>
          </View>
        </View>

        {/* Clinic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clínica</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{appointment.clinic.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{appointment.clinic.address}</Text>
            </View>
          </View>
        </View>

        {/* Treatment Details */}
        {appointment.treatment_details && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Tratamiento</Text>
            <View style={styles.card}>
              <Text style={styles.detailsText}>{appointment.treatment_details}</Text>
            </View>
          </View>
        )}

        {/* Prescription */}
        {appointment.prescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescripción</Text>
            <View style={styles.card}>
              <Text style={styles.detailsText}>{appointment.prescription}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {appointment.status === 'pending' && (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Confirmar Turno</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancelar Turno</Text>
              </TouchableOpacity>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.completeButton]}
                onPress={handleComplete}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Marcar como Completado</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancelar Turno</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  detailsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});