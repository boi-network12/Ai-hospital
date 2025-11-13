import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { apiFetch } from '@/Utils/api'; 

function NetworkLatencyDisplay() {
  const [latency, setLatency] = useState<number | null>(null);

  const measureLatency = async () => {
    const start = Date.now();

    try {
      // ✅ Use your centralized fetch function
      await apiFetch('/health', { method: 'GET' });
      const end = Date.now();
      setLatency(end - start);
    } catch (error) {
      console.error('Network latency check failed:', error);
      setLatency(null);
    }
  };

  useEffect(() => {
    measureLatency();
    const interval = setInterval(measureLatency, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (latency === null) return <Text>Checking...</Text>;

  return (
    <Text
      style={{
        color: latency < 100 ? 'green' : latency < 200 ? 'orange' : 'red',
      }}
    >
      {latency} ms
    </Text>
  );
}

export default NetworkLatencyDisplay;
