import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { Accelerometer } from 'expo-sensors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { fetchWithCache } from '@/Utils/api'

import Accessibility from '@/assets/Svgs/accessibility.svg'
import Cloud from '@/assets/Svgs/cloud.svg'
import CloudRain from '@/assets/Svgs/cloud-rain.svg'
import Sun from '@/assets/Svgs/sun.svg'
import CloudSnow from '@/assets/Svgs/cloud-snow.svg'
import CloudLightning from '@/assets/Svgs/cloud-lightning.svg'
import CloudFog from '@/assets/Svgs/cloud-fog.svg'
import CloudSun  from '@/assets/Svgs/cloud-sun.svg'
import Water from '@/assets/Svgs/glass-water.svg'
import Bed from '@/assets/Svgs/bed.svg'
import { User } from '@/types/auth'

const Weather_Key = Constants.expoConfig?.extra?.WEATHER_API_KEY;
// const GOAL = Constants.expoConfig?.extra?.GOAL;


// ✅ Reusable widget component
const Widget = ({ icon: Icon, title, value, subtitle, onPress }: any) => (
  <TouchableOpacity 
      style={styles.widgetContainer}
      onPress={onPress}
      activeOpacity={0.4}
  >
    <View style={styles.svgContainer}>
      <Icon width={hp(4)} height={hp(3.5)} color="#8089ff" />
    </View>
    <Text style={styles.widgetText}>{title}</Text>
    <Text style={styles.placeholderValue}>{value}</Text>
    <Text style={styles.placeholderSubtext}>{subtitle}</Text>
  </TouchableOpacity>
)

const getWeatherIcon = (desc: string) => {
  const description = desc.toLowerCase()

  if (description.includes('sun') && !description.includes('cloud')) return Sun
  if (description.includes('partly')) return CloudSun
  if (description.includes('cloud') && !description.includes('rain')) return Cloud
  if (description.includes('rain')) return CloudRain
  if (description.includes('thunder')) return CloudLightning
  if (description.includes('snow')) return CloudSnow
  if (description.includes('fog') || description.includes('mist')) return CloudFog

  return Sun // default
}

interface HomeWidgetProps {
  user: User | null;
  hydration: any;
}

export default function HomeWidget({ user, hydration }: HomeWidgetProps) {
  const [steps, setSteps] = useState(0)
  const [temp, setTemp] = useState('—')
  const [desc, setDesc] = useState('Loading…')
  const [time, setTime] = useState('—');
  const [weatherCity, setCityForSubtitle] = useState<string>('');

  const handleHydrationPress = () => {
    router.push('/hydration')
  }

  // Format hydration data
  const hydrationValue = `${(hydration.currentIntake / 1000).toFixed(1)} L`
  const hydrationSubtitle = hydration.isGoalMet 
    ? 'Goal achieved! 🎉' 
    : `${hydration.remaining}ml remaining`

  /** ----------------------------
   * STEP TRACKER LOGIC
   * ---------------------------- */
  useEffect(() => {
    const initSteps = async () => {
      try {
        const today = new Date().toDateString()
        const storedSteps = await AsyncStorage.getItem('dailySteps')
        const storedDate = await AsyncStorage.getItem('stepsDate')

        if (storedSteps && storedDate === today) {
          setSteps(Number(storedSteps))
        } else {
          await AsyncStorage.multiSet([
            ['dailySteps', '0'],
            ['stepsDate', today],
          ])
          setSteps(0)
        }
      } catch (err) {
        console.log('Error loading steps:', err)
      }
    }

    initSteps()
  }, [])

  /** -------------------------- 
   * WAETHER FETCH LOGIC
   * ---------------------------*/

  useEffect(() => {
  let isMounted = true;

  (async () => {
    try {
      // 1. Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) {
          setTemp('—');
          setDesc('Location permission denied');
          setCityForSubtitle('');
        }
        return;
      }

      setDesc('Getting location…'); // Better UX

      // Increased timeout to 20–25 seconds (realistic for cold GPS)
      const getLocationWithTimeout = async (opts: Location.LocationOptions, ms: number) => {
        return Promise.race([
          Location.getCurrentPositionAsync(opts),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Location request timed out')), ms)
          ),
        ]);
      };

      const location = await getLocationWithTimeout(
        {
          accuracy: Location.Accuracy.Balanced,
          // You can also try High here if needed
          // accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 0,
        },
        25000 // 25 seconds — much more reliable
      );

      if (!isMounted) return;

      const { latitude, longitude } = location.coords;

      // Reverse geocode
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cityName = address.city || address.region || address.country || 'Unknown';

      // Fetch weather
      const url = `https://api.weatherapi.com/v1/current.json?key=${Weather_Key}&q=${latitude},${longitude}&aqi=no`;
      const data = await fetchWithCache<any>('weather', url);

      if (!isMounted) return;

      if (data?.current) {
        setTemp(`${Math.round(data.current.temp_c)}°C`);
        setDesc(data.current.condition.text);
        setCityForSubtitle(cityName);
      } else {
        throw new Error('Invalid weather data');
      }
    } catch (err: any) {
      if (!isMounted) return;

      console.error('Location/Weather error:', err);

      // More user-friendly messages
      if (err.message?.includes('timed out')) {
        setDesc('Location taking too long…');
      } else if (err.message?.includes('denied')) {
        setDesc('Location access denied');
      } else {
        setDesc('Weather unavailable');
      }

      setTemp('—');
      setCityForSubtitle('');
    }
  })();

  return () => {
    isMounted = false;
  };
}, []); // Keep empty dependency array

  // Accelerometer listener
  useEffect(() => {
    let lastTrigger = Date.now()
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const totalForce = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
      if (totalForce > 1.2 && Date.now() - lastTrigger > 400) {
        lastTrigger = Date.now()
        setSteps(prev => prev + 1)
      }
    })

    Accelerometer.setUpdateInterval(200)
    return () => subscription.remove()
  }, [])

  // Save step count
  useEffect(() => {
    const saveSteps = async () => {
      const today = new Date().toDateString()
      await AsyncStorage.multiSet([
        ['dailySteps', steps.toString()],
        ['stepsDate', today],
      ])
    }
    saveSteps()
  }, [steps])

  // Reset at midnight
  useEffect(() => {
    const now = new Date()
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime()

    const timer = setTimeout(async () => {
      await AsyncStorage.multiSet([
        ['dailySteps', '0'],
        ['stepsDate', new Date().toDateString()],
      ])
      setSteps(0)
    }, msUntilMidnight)

    return () => clearTimeout(timer)
  }, [])

  /** ----------------------------
   * WEATHER FETCH
   * ---------------------------- */
  useEffect(() => {
    const userCity = user?.profile?.location?.city?.trim();

    // If no city → show placeholder text, do NOT call the API
    if (!userCity) {
      setTemp('—');
      setDesc('Please update your city');
      return;
    }

    (async () => {
      try {
        const url = `https://api.weatherapi.com/v1/current.json?key=${Weather_Key}&q=${encodeURIComponent(userCity)}&aqi=no`
        const data = await fetchWithCache<any>('weather', url)

        if (!data?.current) {
          setTemp('—')
          setDesc('Unavailable')
          return
        }

        setTemp(`${Math.round(data.current.temp_c)}°C`)
        setDesc(data.current.condition.text)
      } catch (err) {
        console.error('Weather fetch failed:', err)
        setTemp('—')
        setDesc('Error')
      }
    })()
  }, [user])

 
  /** ----------------------------
   * BEDTIME TRACKER
   * ---------------------------- */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('bedtime')
      if (saved) setTime(saved)
    })()
  }, [])

  // const openPicker = () => router.push('/set-bedtime')

  /** ----------------------------
   * RENDER UI
   * ---------------------------- */
  return (
    <View style={styles.HomeWidgetContainer}>
      <Widget
        icon={Accessibility}
        title="Steps"
        value={steps.toString()}
        subtitle="Daily Movement"
      />

      <Widget
          icon={getWeatherIcon(desc)}
          title="Weather"
          value={temp}
          subtitle={weatherCity ? `${desc} • ${weatherCity}` : desc}
      />

      <Widget
        icon={Water}
        title="Hydration"
        value={hydrationValue}
        subtitle={hydrationSubtitle}
        onPress={handleHydrationPress}
      />

      <Widget
        icon={Bed}
        title="Bedtime"
        value={time}
        subtitle="Set Alarm"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  HomeWidgetContainer: {
    marginTop: hp(3),
    marginBottom: hp(2),
    width: '100%',
    flexWrap: 'wrap',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: hp(2),
    flexDirection: 'row',
  },
  widgetContainer: {
    backgroundColor: '#fff',
    width: "47%",
    borderWidth: 0.5,
    borderColor: '#eee',
    borderRadius: hp(1),
    padding: hp(1.5),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  svgContainer: {
    backgroundColor: 'rgba(128, 137, 255, 0.08)',
    width: hp(6),
    aspectRatio: 1,
    borderRadius: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetText: {
    fontFamily: 'Roboto-bold',
    marginTop: hp(1.6),
    fontWeight: '600',
    fontSize: hp(1.8),
    color: '#333',
  },
  placeholderValue: {
    fontSize: hp(2.6),
    fontWeight: '700',
    color: '#8089ff',
    marginTop: hp(0.8),
  },
  placeholderSubtext: {
    fontSize: hp(1.5),
    color: '#888',
    marginTop: hp(0.3),
  },
})
