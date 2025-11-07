import { View, Text, StyleSheet } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { Accelerometer } from 'expo-sensors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
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


const Weather_Key = '3f4dd97dd74e4e11a49222554231905'
const CITY = 'Lagos'
const GOAL = 2.5

// ✅ Reusable widget component
const Widget = ({ icon: Icon, title, value, subtitle }: any) => (
  <View style={styles.widgetContainer}>
    <View style={styles.svgContainer}>
      <Icon width={hp(4)} height={hp(3.5)} color="#8089ff" />
    </View>
    <Text style={styles.widgetText}>{title}</Text>
    <Text style={styles.placeholderValue}>{value}</Text>
    <Text style={styles.placeholderSubtext}>{subtitle}</Text>
  </View>
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


export default function HomeWidget() {
  const [steps, setSteps] = useState(0)
  const [temp, setTemp] = useState('—')
  const [desc, setDesc] = useState('Loading…')
  const [liters, setLiters] = useState(0)
  const [time, setTime] = useState('—')

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
    (async () => {
      try {
        const url = `https://api.weatherapi.com/v1/current.json?key=${Weather_Key}&q=${CITY}&aqi=no`
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
  }, [])

  /** ----------------------------
   * HYDRATION TRACKER
   * ---------------------------- */
  const loadHydration = useCallback(async () => {
    const saved = await AsyncStorage.getItem('hydration_today')
    const today = new Date().toISOString().slice(0, 10)
    if (saved) {
      const { value, date } = JSON.parse(saved)
      if (date === today) setLiters(value)
    }
  }, [])

  const addGlass = async () => {
    const newVal = Math.min(liters + 0.25, GOAL)
    const payload = JSON.stringify({
      value: newVal,
      date: new Date().toISOString().slice(0, 10),
    })
    await AsyncStorage.setItem('hydration_today', payload)
    setLiters(newVal)
  }

  useEffect(() => { loadHydration() }, [loadHydration])

  /** ----------------------------
   * BEDTIME TRACKER
   * ---------------------------- */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('bedtime')
      if (saved) setTime(saved)
    })()
  }, [])

  const openPicker = () => router.push('/set-bedtime')

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
        subtitle={desc}
      />

      <Widget
        icon={Water}
        title="Hydration"
        value={`${liters.toFixed(2)} L`}
        subtitle={`of ${GOAL} L goal`}
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
    width: wp(42),
    borderWidth: 0.5,
    borderColor: '#eee',
    height: hp(20),
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
