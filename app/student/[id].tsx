import { type Student } from '@/components/StudentCard';
import { API_BASE_URL } from '@/constants/api';
import { AuthContext } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StudentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useContext(AuthContext);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudent = async () => {
    // 1. Validate the id read from useLocalSearchParams()
    if (!id) {
      setError('Invalid student ID.');
      setLoading(false);
      return;
    }

    // 2. Set loading and clear previous errors
    setLoading(true);
    setError('');

    try {
      // 3. GET /students/{id} with fetch(), async/await, and a Bearer token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth?.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'GET',
        headers,
      });

      // 4. Check response.ok; handle 401 Unauthorized and missing records
      if (response.status === 401) {
        setError('Session expired or unauthorized. Please login again.');
        if (auth?.logout) {
          await auth.logout();
        }
        return;
      }

      if (response.status === 404) {
        setError('Student record not found.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load student details. Status: ${response.status}`);
      }

      // 5. Parse JSON and update student state
      const data = await response.json();
      const studentData = data.student || data;
      setStudent(studentData);
    } catch (err: any) {
      console.error('Error fetching student details:', err);
      setError(err?.message || 'Unable to fetch student details.');
    } finally {
      // 6. Handle errors and stop loading in finally
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call loadStudent() when id changes
    loadStudent();
  }, [id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Student Details</Text>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#245bb2" />
          <Text style={styles.text}>Loading student…</Text>
        </View>
      ) : error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : !student ? (
        <Text style={styles.text}>No student record available.</Text>
      ) : null}

      {!loading && student ? (
        <View style={styles.card}>
          <Text style={styles.text}>ID: {id || 'Not available'}</Text>
          <Text style={styles.text}>Name: {(student as any).name || `${(student as any).firstName ?? ''} ${(student as any).lastName ?? ''}` || '—'}</Text>
          <Text style={styles.text}>Email: {student.email || '—'}</Text>
          <Text style={styles.text}>Course: {(student as any).course || (student as any).program || '—'}</Text>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: '#f2f5fa' },
  title: { color: '#17324d', fontSize: 28, fontWeight: '700' },
  state: { gap: 12, alignItems: 'center' },
  card: { backgroundColor: '#ffffff', padding: 20, gap: 16, borderRadius: 12 },
  text: { color: '#536579', fontSize: 16 },
  error: { color: '#b42318' },
  button: { backgroundColor: '#245bb2', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});