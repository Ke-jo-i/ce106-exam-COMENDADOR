import StudentCard, { type Student } from '@/components/StudentCard';
import { API_BASE_URL } from '@/constants/api';
import { AuthContext } from '@/context/AuthContext';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const auth = useContext(AuthContext);

  const loadStudents = async () => {
    // 1. Set loading and clear previous errors.
    setLoading(true);
    setError('');

    try {
      // 2. Call GET /students using fetch() and async/await.
      // 3. Include Authorization: Bearer TOKEN from AuthContext if required.
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth?.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'GET',
        headers,
      });

      // 4. Check response.ok and handle 401 Unauthorized.
      if (response.status === 401) {
        setError('Session expired or unauthorized. Please login again.');
        if (auth?.logout) {
          await auth.logout();
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load students. Status: ${response.status}`);
      }

      // 5. Parse JSON and save the student array to state.
      const data = await response.json();
      const studentArray = Array.isArray(data) ? data : data.students || [];
      setStudents(studentArray);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err?.message || 'Unable to load students. Please try again.');
    } finally {
      // 6. Handle errors and stop loading inside finally.
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call loadStudents() when the screen loads.
    loadStudents();
  }, []);

  // Use filter() to return students whose name matches the search text.
const filteredStudents = useMemo(() => {
  if (!search.trim()) return students;
  const query = search.toLowerCase().trim();
  return students.filter((student) => {
    const s = student as any;
    const fullName = s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`;
    return fullName.toLowerCase().includes(query);
  });
}, [students, search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Students</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="Search students"
        placeholder="Search by name"
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator color="#245bb2" />
          <Text style={styles.text}>Loading students…</Text>
        </View>
      ) : error ? (
        <View style={styles.state} accessibilityLiveRegion="polite">
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={loadStudents}>
            <Text style={styles.link}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={({ item }) => <StudentCard student={item} />}
          ListEmptyComponent={
            <View style={styles.state}>
              <Text style={styles.text}>No students found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f2f5fa' },
  title: { fontSize: 28, fontWeight: '700', color: '#17324d', marginBottom: 20 },
  input: { padding: 14, borderWidth: 1, borderColor: '#c6d2e1', borderRadius: 8, backgroundColor: '#ffffff', color: '#17324d', marginBottom: 20 },
  state: { padding: 24, gap: 12, alignItems: 'center' },
  text: { color: '#536579' },
  error: { color: '#b42318' },
  link: { color: '#245bb2', padding: 12 },
});