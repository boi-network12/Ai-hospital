import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      {/* 👇 Hide default header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 👇 Custom Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Neuromed</Text>
      </View> */}

      {/* 👇 Page Content */}
      <View style={styles.container}>
        {/* Illustration */}
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png' }} // 404/Confused icon
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>Oops! Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    paddingVertical: 25,
    backgroundColor: '#8089FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 22,
  },
  button: {
    marginTop: 25,
    backgroundColor: '#8089FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
