import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Pressable
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import ReturnBtn from "@/assets/Svgs/arrow-left.svg";
import SettingsIcon from "@/assets/Svgs/settings-2.svg";
import BellOffIcon from "@/assets/Svgs/bell-off.svg";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { router } from "expo-router";
import { useNotification } from "@/Hooks/notificationHook.d";

export default function Notifications() {
    const {
        notifications,
        unreadCount,
        refreshing,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
    } = useNotification();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / (1000 * 60);

        if (diff < 60) return `${Math.floor(diff)}m`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return date.toLocaleDateString();
    };

    const renderNotificationItem = ({ item }: { item: any }) => (
        <Pressable
            style={styles.card}
            onPress={() => markAsRead(item.id)}
        >
            {/* Title + unread dot */}
            <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>

                {item.status === "unread" && <View style={styles.dot} />}
            </View>

            {/* Message */}
            <Text style={styles.message} numberOfLines={3}>
                {item.message}
            </Text>

            {/* Time */}
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </Pressable>
    );

    const _emptyComponent = () => (
        <View style={styles.emptyContainer}>
            <BellOffIcon width={hp(5)} height={hp(5)} color="#bbb" />

            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
                You’re up to date.
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ReturnBtn width={hp(3)} height={hp(3)} color="#111" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Notifications</Text>

                    <TouchableOpacity onPress={() => router.push("/settings/notification")}>
                        <SettingsIcon width={hp(3)} height={hp(3)} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Mark all as read */}
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                )}

                {/* List */}
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshNotifications}
                            tintColor="#000"
                        />
                    }
                    ListEmptyComponent={_emptyComponent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },

    /* HEADER */
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: hp(2),
        height: hp(6),
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    headerTitle: {
        fontSize: hp(2),
        fontWeight: "700",
        color: "#111",
    },

    /* MARK ALL */
    markAllBtn: {
        alignSelf: "flex-end",
        marginRight: hp(2),
        marginVertical: hp(1),
        paddingHorizontal: hp(1.5),
        paddingVertical: hp(0.7),
        borderRadius: 20,
        backgroundColor: "#f3f3f3",
    },
    markAllText: {
        fontSize: hp(1.5),
        fontWeight: "500",
        color: "#111",
    },

    /* CARD */
    card: {
        paddingHorizontal: hp(2),
        paddingVertical: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: hp(0.7),
    },
    title: {
        fontSize: hp(1.75),
        fontWeight: "700",
        color: "#111",
        flex: 1,
        marginRight: hp(1),
    },
    dot: {
        width: hp(1),
        height: hp(1),
        borderRadius: hp(1) / 2,
        backgroundColor: "#111",
    },
    message: {
        fontSize: hp(1.6),
        color: "#444",
        lineHeight: hp(2.2),
        marginBottom: hp(0.6),
    },
    time: {
        fontSize: hp(1.3),
        color: "#999",
    },

    /* EMPTY */
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: hp(10),
    },
    emptyTitle: {
        marginTop: hp(2),
        fontSize: hp(2),
        fontWeight: "600",
        color: "#333",
    },
    emptySubtitle: {
        fontSize: hp(1.6),
        color: "#777",
        marginTop: hp(0.8),
    },
});
