import React, {  } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import BackIcon from "@/assets/Svgs/arrow-left.svg";

interface AllTestsHeaderProps {
    router: any;
}

export default function AllTestsHeader({ router }: AllTestsHeaderProps) {
    return (
        <View style={styles.AllTestsHeader}>
            <TouchableOpacity onPress={() => router.back()}>
                <BackIcon width={hp(3)} height={hp(3)} />
            </TouchableOpacity>
        </View>
    )
}

/* ---------------------------------------------------------- */
const styles = StyleSheet.create({
  AllTestsHeader: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: hp(1.7),
    height: hp(6),
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  }
});