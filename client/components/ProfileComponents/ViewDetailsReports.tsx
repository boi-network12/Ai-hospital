import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native'
import React, { useState, useRef } from 'react'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'
import DetailsView from './DetailsReportComponents/DetailsView';
import UserReports from './DetailsReportComponents/UserReports';

const { width } = Dimensions.get('window');

export default function ViewDetailsReports() {
    const [activeTab, setActiveTab] = useState("view-details");
    const scrollRef = useRef<ScrollView>(null);

    const _tabSelectItem = [
        { title: "view Details", key: "view-details" },
        { title: "reports", key: "reports" }
    ];

    const handleTabPress = (key: string, index: number) => {
        setActiveTab(key);
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
    }

    const handleScrollEnd = (e: any) => {
        const pageIndex = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveTab(pageIndex === 0 ? "view-details" : "reports");
    }

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabSelectContainer}>
                {_tabSelectItem.map((item, index) => {
                    const isActive = activeTab === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => handleTabPress(item.key, index)}
                            style={[styles.tabSelectBox, isActive && styles.activeTabSelect]}
                        >
                            <Text style={[styles.tabSelectText, isActive && styles.activeTextSelectTabs]}>
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </View>

            {/* Swipeable content */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
                style={{ flex: 1 }}
            >
                <View style={{ width }}>
                    <DetailsView />
                </View>
                <View style={{ width }}>
                    <UserReports />
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FCFCFC",
        width: "100%"
    },
    tabSelectContainer: {
        flexDirection: "row",
        justifyContent: 'space-around',
        alignItems: 'center',
        height: hp(6),
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    tabSelectBox: {
        width: "50%",
        height: "100%",
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTabSelect: {
        borderBottomWidth: 2,
        borderBottomColor: "#8089ff"
    },
    tabSelectText: {
        color: "#555",
        textTransform: 'capitalize',
        fontWeight: "500",
        fontSize: hp(1.7)
    },
    activeTextSelectTabs: {
        color: "#8089ff"
    }
});
