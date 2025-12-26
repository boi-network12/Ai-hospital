import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useMemo } from 'react';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import { BLUR_HASH_PLACEHOLDER } from '@/constants/BlurHash';
import ProfileAvatar from "@/assets/images/avatar.png";
import { User } from '@/types/auth.d';
import { calculateAge } from '@/helper/AgeCalculation';
import { getZodiacSign } from '@/helper/Zodiac';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ToastOptions } from '@/context/ToastContext';

const blurhash = BLUR_HASH_PLACEHOLDER;

interface HeaderSectionProps {
  user: User | null;
  updateAvatar: (formData: FormData, signal?: AbortSignal) => Promise<void>;
  showAlert: (opts: { title: string; message: string; type?: ToastOptions['type'] }) => void;
}

export default function HeaderSection({ user, updateAvatar, showAlert }: HeaderSectionProps) {
  const _AuxDetails = useMemo(() => {
    
    const age = calculateAge(user?.profile?.dateOfBirth);
    const zodiac = getZodiacSign(user?.profile?.dateOfBirth);
    const gender = user?.profile?.gender;

    const details: string[] = [];

    if (age) details.push(`${age} yrs`);
    if (zodiac) details.push(zodiac);
    if (gender) details.push(gender);

    return details;
  }, [user]);

  
  const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
      showAlert({
        title: 'Permission required', 
        message: 'Please allow access to your photo library.',
        type: 'error'
      });
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    // @ts-ignore Deprecated in SDK 51+, valid in SDK 49/50
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return;

  const asset = result.assets[0];

  // Create FormData
  const formData = new FormData();
  formData.append('avatar', {
    uri: asset.uri,
    name: asset.fileName || `avatar_${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  } as any);

  // Retry logic with timeout
  const uploadWithRetry = async (retries = 3): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        // Add timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        await updateAvatar(formData, controller.signal);

        clearTimeout(timeoutId);
        return; // Success
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`Upload attempt ${i + 1} timed out`);
        } else {
          console.warn(`Upload attempt ${i + 1} failed:`, err.message);
        }

        if (i === retries - 1) throw err; // Last attempt
        await new Promise(res => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
      }
    }
  };

  try {
    await uploadWithRetry();
  } catch (err: any) {
    console.error('All upload attempts failed:', err);
    showAlert({
      title: 'Upload Failed',
      message: 'Failed to upload avatar. Please try again later.',
    });

    // Optional: Force refresh to check if it actually uploaded
    setTimeout(() => {
      // You can expose refreshUser from context if needed
      // Or just tell user to refresh
    }, 2000);
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.topSideSection}>
        <View style={styles.imageContainer}>
          <TouchableOpacity 
                onPress={() => {
                if (user?.role === "nurse" || user?.role === "doctor") {
                 showAlert({
                    title: "Permission Denied",
                    message: "Nurses and doctors are not allowed to update profile images.",
                    type: "error"
                  });
                  return;
                }
                pickImage();
              }} 
                style={styles.imageContainer}
            >
            <Image
              source={user?.profile?.avatar || ProfileAvatar}
              placeholder={blurhash}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 100,
              }}
              contentFit="cover"
              transition={200}
            />
            {/* Optional: overlay icon */}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>Camera</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: hp(1.5) }}>
          <Text style={styles.textDetails}>{user?.name || "User"}</Text>
          <Text style={styles.textDetails}>{user?.email || "Not authorized"}</Text>
          <View style={{
            flexDirection: "row",
            gap: hp(1),
            marginTop: hp(1)
          }}>
            {_AuxDetails.map((item, index) => (
              <Text key={index} style={styles.mapText}>{item}</Text>
            ))}
          </View>
        </View>
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity style={styles.BtnContainer} onPress={() => router.push("/edit-profile")}>
        <Text style={styles.btnText}>edit profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: hp(2),
    padding: hp(2),
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: hp(3.5),
    flexDirection: "column",
  },
  topSideSection: {
    flexDirection: "row",
    marginBottom: hp(3),
    gap: hp(2),
    justifyContent: "flex-start",
    alignItems: "flex-start"
  },
  imageContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: hp(15),
    overflow: 'hidden',
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  cameraIcon: {
    color: '#fff',
    fontSize: hp(1.6),
    fontWeight: 'bold',
  },
  textDetails: {
    fontSize: hp(1.6),
    fontWeight: "400",
    color: "#444",
  },
  mapText: {
    color: "#8089FF",
    backgroundColor: "rgba(128, 137, 255, 0.15)",
    paddingVertical: hp(0.5),
    paddingHorizontal: hp(0.8),
    borderRadius: hp(0.8),
    fontSize: hp(1.5)
  },
  BtnContainer: {
    backgroundColor: "#8089FF",
    height: hp(5),
    borderRadius: hp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: hp(1.8),
    textTransform: 'capitalize'
  }
});