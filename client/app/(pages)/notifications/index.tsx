import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import ReturnBtn from "@/assets/Svgs/arrow-left.svg";
import SettingsIcon from '@/assets/Svgs/settings-2.svg';
import { heightPercentageToDP as hp  } from 'react-native-responsive-screen';
import { router } from 'expo-router';
import BellOffIcon from "@/assets/Svgs/bell-off.svg";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
}

export default function Notifications() {

    const _notifications: Notification[] = [];

    const _headerDisplay = () => (
        <View
          style={styles.HeaderContainer}
        >
            <TouchableOpacity
               onPress={() => router.back()}
            >
                <ReturnBtn width={hp(3)} height={hp(3)} color="#333" />
            </TouchableOpacity>
            <Text style={styles.HeaderText}>Notifications (0)</Text>
            <TouchableOpacity
               onPress={() => router.push("/settings/notification")}
            >
                <SettingsIcon width={hp(3)} height={hp(3)} color="#333" />
            </TouchableOpacity>
        </View>
    )

  return (
    <View style={styles.container}>
       <SafeAreaView style={{ flex: 1 }}>
        {_headerDisplay()}

        {_notifications && _notifications.length > 0 ? (
            <View>
                <Text>h</Text>
            </View>
        ) : (
            <View
               style={styles.noNotificationContainer}
            >
                <View
                   style={styles.bellOffContainer}
                >
                    <BellOffIcon width={hp(5)} height={hp(5)} color="#8089ff" />
                </View>
                <Text style={styles.BellOffTextBellow}>No notification yet</Text>
            </View>
        )}
       </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5"
    },
    HeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between',
        paddingHorizontal: hp(2),
        height: hp(6.5),
    },
    HeaderText: {
        fontSize: hp(1.8),
        fontWeight: '700',
        fontFamily: "Roboto-bold"
    },
    noNotificationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
    },
    bellOffContainer: {
        backgroundColor: "rgba(128, 137, 255, 0.07)",
        width: hp(15),
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: hp(7.5),
        marginBottom: hp(2)
    },
    BellOffTextBellow: {
        fontSize: hp(2.2),
        fontWeight: '600',
        fontFamily: "Roboto-bold",
        color: "#777"
    },
})