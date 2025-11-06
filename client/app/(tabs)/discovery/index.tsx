import React, { useCallback, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Modalize } from 'react-native-modalize'
import { Portal } from 'react-native-portalize'
import { heightPercentageToDP as hp } from 'react-native-responsive-screen'

// 🧩 Components
import DiscoveryHeader from '@/components/Headers/DiscoveryHeader'
import FilterSections from '@/components/DiscoveryComponents/FilterSections'

export default function DiscoveryPage() {
  // Modal reference
  const modalizeRef = useRef<Modalize>(null)

  // Function to open modal
  const openFilterModal = useCallback(() => {
    modalizeRef.current?.open()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <DiscoveryHeader onFIlterPress={openFilterModal} />

      {/* 🔹 Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={styles.placeholderText}>
          Discovery content will appear here...
        </Text>
      </ScrollView>

      {/* 🔹 Filter Modal */}
      <Portal>
        <Modalize
          ref={modalizeRef}
          modalHeight={hp(70)} // 70% screen height
          handlePosition="inside"
          closeOnOverlayTap
          panGestureEnabled
          overlayStyle={styles.overlay}
          modalStyle={styles.modal}
        >
          <FilterSections />
        </Modalize>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollContainer: {
    padding: hp(2),
  },
  placeholderText: {
    fontSize: hp(2),
    color: '#666',
    textAlign: 'center',
    marginTop: hp(5),
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: hp(2),
    borderTopRightRadius: hp(2),
    paddingBottom: hp(2),
  },
})
