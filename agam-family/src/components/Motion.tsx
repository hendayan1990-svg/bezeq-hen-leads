import React, { useEffect } from 'react';
import { Image, Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFeedback } from '../lib/feedback';

const APressable = Animated.createAnimatedComponent(Pressable);
const APath = Animated.createAnimatedComponent(Path);

export function Reveal({ children, delay = 0, from = 'down', style }: { children: React.ReactNode; delay?: number; from?: 'down'|'right'; style?: StyleProp<ViewStyle> }) {
  const entering = (from === 'right' ? FadeInRight : FadeInDown).delay(delay).duration(520).easing(Easing.out(Easing.cubic));
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}

export function MotionPressable({ children, onPress, style, disabled = false, feedback = true }: any) {
  const scale = useSharedValue(1);
  const { tap } = useFeedback();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <APressable disabled={disabled} onPressIn={() => { scale.value = withSpring(.965, { damping: 17, stiffness: 280 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 240 }); }} onPress={() => { if (feedback) tap(); onPress?.(); }} style={[style, animated, disabled && { opacity: .45 }]}>{children}</APressable>;
}

export function Floating({ children, distance = 7, duration = 1500, style }: any) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withSequence(withTiming(-distance, { duration, easing: Easing.inOut(Easing.sin) }),withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })),-1,false); }, [distance, duration]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

export function PulseRing({ color = '#16B6FF', size = 72, style }: any) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withRepeat(withTiming(1, { duration: 1650, easing: Easing.out(Easing.quad) }), -1, false); }, []);
  const ring = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, .55, 1], [.5, .22, 0]), transform: [{ scale: interpolate(p.value, [0, 1], [.72, 1.42]) }] }));
  return <Animated.View pointerEvents="none" style={[{ position:'absolute', width:size, height:size, borderRadius:size, borderWidth:2, borderColor:color }, style, ring]} />;
}

export function AnimatedRoute({ color='#1AA8FF' }: { color?: string }) {
  const offset=useSharedValue(90);
  useEffect(()=>{offset.value=withRepeat(withTiming(0,{duration:2200,easing:Easing.linear}),-1,false);},[]);
  const animatedProps=useAnimatedProps(()=>({strokeDashoffset:offset.value} as any));
  return <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox="0 0 400 320"><APath d="M68 234 C116 208 113 161 172 174 C226 187 221 101 284 95 C323 91 336 125 358 151" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray="14 10" animatedProps={animatedProps}/></Svg>;
}

export function AnimatedBrandMark({ size = 104 }: { size?: number }) {
  const scale = useSharedValue(.72); const rotate = useSharedValue(-8); const glow = useSharedValue(.25);
  useEffect(() => { scale.value = withSpring(1, { damping: 13, stiffness: 130 }); rotate.value = withSpring(0, { damping: 13, stiffness: 120 }); glow.value = withRepeat(withSequence(withTiming(.65,{duration:1100}),withTiming(.22,{duration:1100})), -1, false); }, []);
  const icon = useAnimatedStyle(() => ({ transform:[{scale:scale.value},{rotate:`${rotate.value}deg`}] }));
  const halo = useAnimatedStyle(() => ({ opacity:glow.value, transform:[{scale:1.18}] }));
  return <Animated.View style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}><Animated.View style={[{ position:'absolute', width:size*.86, height:size*.86, borderRadius:size, backgroundColor:'#18B8FF', shadowColor:'#18B8FF', shadowOpacity:.75, shadowRadius:28 }, halo]} /><Animated.View style={icon}><Image source={require('../../assets/icon.png')} style={{ width:size*.86, height:size*.86, borderRadius:size*.23 }} /></Animated.View></Animated.View>;
}
