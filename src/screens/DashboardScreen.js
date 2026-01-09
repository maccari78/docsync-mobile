import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { authService } from "../services/api";
import api from "../services/api";

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboard();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDashboard = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      // Cargar estadísticas básicas
      const response = await api.get("/appointments");
      setStats({
        totalAppointments: response.data.length,
        pending: response.data.filter((a) => a.status === "pending").length,
        confirmed: response.data.filter((a) => a.status === "confirmed").length,
        completed: response.data.filter((a) => a.status === "completed").length,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace("Login");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DocSync Dashboard</Text>
        <Text style={styles.subtitle}>Bienvenido, {user?.name}</Text>
        <Text style={styles.role}>{user?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalAppointments || 0}</Text>
          <Text style={styles.statLabel}>Total Turnos</Text>
        </View>

        <View style={[styles.statCard, styles.statCardYellow]}>
          <Text style={styles.statNumber}>{stats?.pending || 0}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGreen]}>
          <Text style={styles.statNumber}>{stats?.confirmed || 0}</Text>
          <Text style={styles.statLabel}>Confirmados</Text>
        </View>

        <View style={[styles.statCard, styles.statCardBlue]}>
          <Text style={styles.statNumber}>{stats?.completed || 0}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.newAppointmentButton]}
        onPress={() => navigation.navigate('NewAppointment')}
      >
        <Text style={styles.buttonText}>+ Solicitar Nuevo Turno</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Appointments")}
      >
        <Text style={styles.buttonText}>Ver Todos los Turnos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 5,
  },
  role: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 5,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  statCardYellow: {
    backgroundColor: "#FF9500",
  },
  statCardGreen: {
    backgroundColor: "#34C759",
  },
  statCardBlue: {
    backgroundColor: "#5856D6",
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  newAppointmentButton: {
    backgroundColor: '#34C759',
  },
});
