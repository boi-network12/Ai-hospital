import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { router, usePathname } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

import HomeIcon from '../../assets/Svgs/HomeIcon.svg';
import CalendarIcon from '../../assets/Svgs/calendar.svg';
import ProfileIcon from '../../assets/Svgs/user.svg';
import ChatIcon from '../../assets/Svgs/message-square.svg';
import DiscoveryIcon from '../../assets/Svgs/binoculars.svg';

// 👇 Add proper typing for props
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const CustomTabs: React.FC<BottomTabBarProps> = (props) => {
  const pathname = usePathname();

  const hiddenRoutes: string[] = ['']; // add routes you want to hide tabs from here
  const shouldHideTabs = hiddenRoutes.some(route => pathname === route);

  if (shouldHideTabs) return null;

  const tabs = [
    { name: 'home', icon: HomeIcon },
    { name: 'calendar', icon: CalendarIcon },
    { name: 'chat', icon: ChatIcon },
    { name: 'discovery', icon: DiscoveryIcon },
    { name: 'profile', icon: ProfileIcon },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = pathname === `/${tab.name}`;
        const Icon = tab.icon;

        return (
          <TouchableOpacity
            key={index}
            style={styles.tab}
            onPress={() => router.push(`/${tab.name}`)}
            activeOpacity={0.7}
          >
            <Icon
              width={hp(2.9)}
              height={hp(2.8)}
              fill={isActive ? '#8089ff' : 'none'}
              color={isActive ? '#8089ff' : '#222'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp(2),
    paddingBottom: hp(4.5),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabs;
