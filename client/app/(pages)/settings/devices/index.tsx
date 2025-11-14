import { StyleSheet, ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GeneralSettingsHeader from '@/components/Headers/GeneralSettingsHeader';
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/Hooks/userHooks.d';
import { ISession } from '@/types/auth.d';

export default function DevicesPage() {
  const { getDevices, revokeDevice } = useUser();

  const [devices, setDevices] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

   // -------------------------------------------------
  // Load devices (initial + pull-to-refresh)
  // -------------------------------------------------
  const loadDevices = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getDevices();          // <-- real API call
      setDevices(data);
    } catch (e) {
      console.error("error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDevices]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // -------------------------------------------------
  // Revoke a single session
  // -------------------------------------------------
  const handleRevoke = async (token: string) => {
    try {
      await revokeDevice(token);
      // Optimistic UI – remove locally
      setDevices((prev) => prev.filter((d) => d.token !== token));
    } catch (e: any) {
      console.error('Revoke error:', e);
    }
  };

  // -------------------------------------------------
  // Helper: pick icon based on device string
  // -------------------------------------------------
  const getIconName = (device: string | undefined): keyof typeof Ionicons.glyphMap => {
    const lower = (device ?? '').toLowerCase().trim();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return 'phone-portrait-outline';
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return 'tablet-landscape-outline';
    }
    return 'laptop-outline';
  };

   // -------------------------------------------------
  // Helper: format ISO → readable
  // -------------------------------------------------
  const formatLastActive = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // -------------------------------------------------
  // Pull-to-refresh
  // -------------------------------------------------
  const onRefresh = () => {
    setRefreshing(true);
    loadDevices(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GeneralSettingsHeader title="Connected Devices" returnBtn={() => router.back()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {devices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No active sessions</Text>
            </View>
          ) : (
            devices.map((device, index) => (
              <View
                style={styles.deviceCard}
                key={device.token ?? `fallback-${index}`} // <-- Safe + unique key
              >
                <View style={styles.deviceInfo}>
                  <Ionicons
                    name={getIconName(device.device)}
                    size={hp(3.5)}
                    color="#6e6e6e"
                  />
                  <View style={styles.textContainer}>
                    <Text style={styles.deviceName}>
                      {device.device || 'Unknown device'}
                    </Text>
                    <Text style={styles.deviceMeta}>
                      {device.ipAddress ? `${device.ipAddress} • ` : ''}
                      {formatLastActive(device.lastActive)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.logoutBtn,
                    !device.active && styles.logoutBtnInactive,
                  ]}
                  disabled={!device.active}
                  onPress={() => device.token && handleRevoke(device.token)}
                >
                  <Text style={styles.logoutText}>
                    {device.active ? 'Revoke' : 'Revoked'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: hp(2),
  },
  empty: {
    alignItems: 'center',
    marginTop: hp(4),
  },
  emptyText: {
    fontSize: hp(2),
    color: '#999',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: hp(2),
    padding: hp(2),
    marginBottom: hp(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#eee',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 3,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: hp(1.5),
    flexShrink: 1,
  },
  deviceName: {
    fontSize: hp(2.1),
    fontWeight: '600',
    color: '#222',
  },
  deviceMeta: {
    fontSize: hp(1.6),
    color: '#999',
    marginTop: hp(0.3),
  },
  logoutBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: hp(0.8),
    paddingHorizontal: hp(2),
    borderRadius: hp(1.5),
  },
  logoutBtnInactive: {
    backgroundColor: '#bbb',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp(1.7),
  },
});
