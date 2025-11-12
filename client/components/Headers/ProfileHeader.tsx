import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import SettingsIcon from '@/assets/Svgs/settings-2.svg';
import { router } from 'expo-router';
import { User } from '@/types/auth';

interface ProfileHeaderProps {
    user: User | null;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <View
        style={styles.HeaderContainer}
    >
        <Text style={styles.HeaderText}>{firstName} </Text>
        <TouchableOpacity
            onPress={() => router.push("/settings")}
        >
            <SettingsIcon width={hp(3)} height={hp(3)} color="#333" />
        </TouchableOpacity>
    </View>
  )
}


const styles = StyleSheet.create({
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
})