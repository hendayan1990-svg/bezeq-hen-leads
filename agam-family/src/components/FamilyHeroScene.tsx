import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

function Bob({ children, delay = 0, distance = 6 }: any) {
  const y = useSharedValue(0);
  useEffect(() => {
    const start = setTimeout(() => {
      y.value = withRepeat(withSequence(
        withTiming(-distance, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ), -1, false);
    }, delay);
    return () => clearTimeout(start);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

export default function FamilyHeroScene() {
  return (
    <View style={styles.wrap}>
      <Svg viewBox="0 0 400 300" width="100%" height="100%">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#ECFBFF"/><Stop offset="1" stopColor="#F4FFF9"/></LinearGradient>
          <LinearGradient id="road" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#DFF2F8"/><Stop offset="1" stopColor="#EAF5F1"/></LinearGradient>
          <LinearGradient id="shirtA" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#20BFFF"/><Stop offset="1" stopColor="#0A85FF"/></LinearGradient>
          <LinearGradient id="shirtB" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#2AD9B8"/><Stop offset="1" stopColor="#08AE9E"/></LinearGradient>
          <LinearGradient id="dress" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FF91AC"/><Stop offset="1" stopColor="#FF6E8F"/></LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="300" rx="34" fill="url(#sky)"/>
        <Path d="M-30 222 C70 175 120 248 205 215 C280 187 319 152 436 175" fill="none" stroke="url(#road)" strokeWidth="24" strokeLinecap="round"/>
        <Path d="M-20 112 C60 88 128 128 200 105 C286 77 330 103 430 74" fill="none" stroke="#E8F4F8" strokeWidth="18" strokeLinecap="round"/>
        <Circle cx="314" cy="74" r="48" fill="#DDF7EE" opacity=".85"/>
        <Circle cx="80" cy="224" r="42" fill="#DFF3FF" opacity=".8"/>
        <Circle cx="350" cy="229" r="26" fill="#E6E2FF" opacity=".65"/>
        <G opacity=".9"><Circle cx="83" cy="226" r="27" fill="#FFFFFF"/><Path d="M72 229 L80 237 L96 216" fill="none" stroke="#22C999" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></G>
        <G opacity=".95"><Circle cx="315" cy="74" r="32" fill="#FFFFFF"/><Path d="M315 52 C326 52 335 60 335 70 C335 84 315 96 315 96 C315 96 295 84 295 70 C295 60 304 52 315 52Z" fill="#FF7D8D"/></G>
      </Svg>

      <Bob delay={0} distance={7}>
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <G transform="translate(92 80)">
            <Circle cx="54" cy="38" r="31" fill="#FFD2B8"/>
            <Path d="M27 39 C31 8 75 4 82 36 C68 25 51 22 34 30Z" fill="#283B50"/>
            <Rect x="22" y="68" width="68" height="86" rx="32" fill="url(#shirtA)"/>
            <Circle cx="45" cy="38" r="3" fill="#2A4054"/><Circle cx="65" cy="38" r="3" fill="#2A4054"/>
            <Path d="M48 52 C53 57 60 57 66 51" fill="none" stroke="#C4736A" strokeWidth="3" strokeLinecap="round"/>
          </G>
        </Svg>
      </Bob>

      <Bob delay={160} distance={5}>
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <G transform="translate(180 108)">
            <Circle cx="52" cy="34" r="27" fill="#FFD4B9"/>
            <Path d="M28 35 C31 10 69 6 76 31 C61 20 48 19 33 25Z" fill="#252F42"/>
            <Rect x="22" y="60" width="60" height="76" rx="28" fill="url(#shirtB)"/>
            <Circle cx="43" cy="35" r="2.6" fill="#25394B"/><Circle cx="60" cy="35" r="2.6" fill="#25394B"/>
            <Path d="M44 47 C50 51 55 51 60 47" fill="none" stroke="#C4736A" strokeWidth="2.5" strokeLinecap="round"/>
          </G>
        </Svg>
      </Bob>

      <Bob delay={320} distance={6}>
        <Svg viewBox="0 0 400 300" width="100%" height="100%">
          <G transform="translate(244 113)">
            <Circle cx="48" cy="31" r="25" fill="#FFD6BF"/>
            <Path d="M24 32 C27 7 65 5 72 29 C60 18 46 18 29 24Z" fill="#2C3346"/>
            <Rect x="19" y="55" width="58" height="72" rx="27" fill="url(#dress)"/>
            <Circle cx="40" cy="32" r="2.5" fill="#28394A"/><Circle cx="56" cy="32" r="2.5" fill="#28394A"/>
            <Path d="M40 44 C45 48 51 48 56 44" fill="none" stroke="#C4736A" strokeWidth="2.4" strokeLinecap="round"/>
          </G>
        </Svg>
      </Bob>

      <Svg viewBox="0 0 400 300" width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Path d="M75 253 C144 219 157 233 207 203 C260 173 285 157 320 125" fill="none" stroke="#1AA9FF" strokeWidth="5" strokeDasharray="12 10" strokeLinecap="round" opacity=".9"/>
        <Circle cx="75" cy="253" r="8" fill="#1AA9FF" stroke="#FFF" strokeWidth="4"/>
        <Circle cx="320" cy="125" r="8" fill="#21CC9A" stroke="#FFF" strokeWidth="4"/>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width:'100%', aspectRatio: 1.34, borderRadius:32, overflow:'hidden' } });
