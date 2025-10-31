import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      {/* 👇 Custom Header */}
      <Stack.Screen 
        options={{ 
          headerShown: false, // hide Expo Router default header
        }} 
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doc AI</Text>
      </View>

      {/* 👇 Page Content */}
      <View style={styles.container}>
        <Text style={styles.text}>Page Not Found 😢</Text>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.link}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingVertical: 20,
    backgroundColor: '#8089ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: { fontSize: 18, color: '#000' },
  link: { marginTop: 10, color: '#007AFF' },
});
