import { useEffect, useState } from 'react';
import { Text } from 'react-native';

function NetworkLatencyDisplay() {
  const [latency, setLatency] = useState<number | null>(null);

  const measureLatency = async () => {
    const start = Date.now();
    try {
      await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-store' });
      const end = Date.now();
      setLatency(end - start);
    } catch (error: any) {
      setLatency(null);
      throw new Error("Error: ", error)
    }
  };

  useEffect(() => {
    measureLatency();
    const interval = setInterval(measureLatency, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (latency === null) return <Text>Checking...</Text>;

  return (
    <Text style={{ color: latency < 100 ? 'green' : latency < 200 ? 'orange' : 'red' }}>
      {latency} ms
    </Text>
  );
}

export default NetworkLatencyDisplay