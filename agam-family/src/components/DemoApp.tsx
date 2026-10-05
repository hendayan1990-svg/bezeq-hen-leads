import React, { useMemo, useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AgamLogo } from './AgamLogo';
import NativeFamilyMap from './NativeFamilyMap';
import Svg, { Circle, Path } from 'react-native-svg';

type Screen = 'home' | 'child' | 'sos' | 'places' | 'history' | 'audio' | 'more' | 'plans' | 'language';
type Lang = 'en' | 'he';

const C = {
  bg: '#F7FBFF', panel: '#FFFFFF', panel2: '#F2F8FC', line: '#DCEAF3',
  text: '#0B2A4A', muted: '#71869A', blue: '#0A8CFF', cyan: '#23BFD8',
  green: '#18C98F', red: '#FF5A6B', orange: '#FFA544', purple: '#8A6CFF',
};

const family = [
  { id: 'liam', name: 'Liam', place: 'At school', detail: 'Now', color: '#35D69B', initials: 'L' },
  { id: 'noa', name: 'Noa', place: 'Home', detail: '2 min ago', color: '#7B6DFF', initials: 'N' },
  { id: 'emma', name: 'Emma', place: 'On the way', detail: '5 min ago', color: '#FF9E4A', initials: 'E' },
];

const copy = {
  en: { allSafe: 'Everyone is safe', liveMap: 'Live family map', home: 'Home', map: 'Map', chat: 'Chat', more: 'More', plus: 'AGAM Plus', safety: 'Safety status', safePlaces: 'Safe Places', history: 'History', audio: 'Safety Audio', checkin: 'Check-in' },
  he: { allSafe: 'כולם בטוחים', liveMap: 'מפת המשפחה', home: 'בית', map: 'מפה', chat: 'צ׳אט', more: 'עוד', plus: 'AGAM Plus', safety: 'מצב בטיחות', safePlaces: 'אזורים בטוחים', history: 'היסטוריה', audio: 'שמע בטיחותי', checkin: 'צ׳ק-אין' },
};

function GlassCard({ children, style }: any) {
  return <BlurView intensity={28} tint="light" style={[styles.glass, style]}>{children}</BlurView>;
}

function Header({ lang, onPlans }: { lang: Lang; onPlans: () => void }) {
  return (
    <View style={styles.header}>
      <AgamLogo compact />
      <Pressable onPress={onPlans} style={styles.plusPill}><Ionicons name="diamond" size={14} color="#7B5BFF"/><Text style={styles.plusText}>PLUS</Text></Pressable>
    </View>
  );
}

function Avatar({ item, active = false, size = 54 }: any) {
  return (
    <View style={{ alignItems: 'center', gap: 7 }}>
      <View style={[styles.avatarRing, { width: size + 6, height: size + 6, borderRadius: 999, borderColor: active ? C.cyan : '#24415D' }]}> 
        <LinearGradient colors={[item.color, '#12324A']} style={[styles.avatar, { width: size, height: size, borderRadius: 999 }]}>
          <Text style={[styles.avatarInitial, { fontSize: size * .36 }]}>{item.initials}</Text>
        </LinearGradient>
      </View>
      <Text style={styles.avatarName}>{item.name}</Text>
    </View>
  );
}

function FamilyStrip({ selected, setSelected }: any) {
  return (
    <ScrollView horizontal style={styles.familyScroller} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyStrip}>
      <View style={{ alignItems: 'center', gap: 7 }}><View style={styles.meAvatar}><Ionicons name="person" size={21} color="#CFEAFF"/></View><Text style={styles.avatarName}>Me</Text></View>
      {family.map(f => <Pressable key={f.id} onPress={() => setSelected(f.id)}><Avatar item={f} active={selected === f.id}/></Pressable>)}
      <View style={{ alignItems: 'center', gap: 7 }}><View style={styles.addAvatar}><Ionicons name="add" size={24} color={C.cyan}/></View><Text style={styles.avatarName}>Add</Text></View>
    </ScrollView>
  );
}

function MiniMap({ selected, onChild }: { selected: string; onChild: () => void }) {
  const current = family.find(x => x.id === selected) || family[0];
  return (
    <View style={styles.mapWrap}>
      <Svg width="100%" height="100%" viewBox="0 0 400 320" style={StyleSheet.absoluteFill}>
        <Path d="M-20 55 C70 25 95 90 185 62 S315 18 430 60" stroke="#DDEBED" strokeWidth="18" fill="none" />
        <Path d="M-10 210 C85 160 140 260 220 215 S320 140 430 180" stroke="#D6E7E9" strokeWidth="14" fill="none" />
        <Path d="M85 -10 C115 90 70 165 135 335" stroke="#E3EFF1" strokeWidth="12" fill="none" />
        <Path d="M285 -20 C255 75 300 170 255 335" stroke="#DCEBED" strokeWidth="10" fill="none" />
        <Path d="M-20 125 L430 125" stroke="#E8F1F3" strokeWidth="4" />
        <Path d="M-20 275 L430 245" stroke="#E8F1F3" strokeWidth="5" />
        <Circle cx="215" cy="165" r="64" fill="#0A8CFF" opacity="0.10" />
        <Circle cx="215" cy="165" r="42" fill="#0A8CFF" opacity="0.08" />
      </Svg>
      <LinearGradient colors={['rgba(255,255,255,.02)', 'rgba(238,248,247,.20)']} style={StyleSheet.absoluteFill}/>
      <View style={styles.mapTopRow}>
        <GlassCard style={styles.safeChip}><View style={styles.greenDot}/><Text style={styles.safeChipText}>All family protected</Text></GlassCard>
        <View style={styles.mapButtons}><View style={styles.mapCircle}><Ionicons name="layers" size={19} color="#DFF4FF"/></View><View style={styles.mapCircle}><Ionicons name="navigate" size={19} color="#DFF4FF"/></View></View>
      </View>
      <Pressable onPress={onChild} style={[styles.marker, { left: '47%', top: '40%' }]}>
        <LinearGradient colors={[current.color, C.blue]} style={styles.markerAvatar}><Text style={styles.markerInitial}>{current.initials}</Text></LinearGradient>
        <View style={styles.markerLabel}><Text style={styles.markerName}>{current.name}</Text><Text style={styles.markerPlace}>{current.place}</Text></View>
      </Pressable>
      <View style={[styles.smallMarker, { left: '18%', top: '58%' }]}><Text style={styles.smallMarkerText}>N</Text></View>
      <View style={[styles.smallMarker, { right: '12%', top: '66%', backgroundColor: C.orange }]}><Text style={styles.smallMarkerText}>E</Text></View>
      <View style={styles.mapFooter}><Ionicons name="shield-checkmark" size={16} color={C.green}/><Text style={styles.mapFooterText}>Live • encrypted • last refresh 8 sec ago</Text></View>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: any) {
  return <Pressable onPress={onPress} style={styles.quickItem}><LinearGradient colors={[color, '#12304B']} style={styles.quickIcon}><Ionicons name={icon} size={21} color="white"/></LinearGradient><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

function Home({ lang, nav }: { lang: Lang; nav: (s: Screen) => void }) {
  const [selected, setSelected] = useState('liam');
  const t = copy[lang];
  const person = family.find(x => x.id === selected) || family[0];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
      <View style={styles.sectionHead}><View><Text style={styles.kicker}>{t.allSafe}</Text><Text style={styles.pageTitle}>{t.liveMap}</Text></View><View style={styles.statusBadge}><Ionicons name="shield-checkmark" size={15} color={C.green}/><Text style={styles.statusBadgeText}>Protected</Text></View></View>
      <FamilyStrip selected={selected} setSelected={setSelected}/>
      <Pressable onPress={() => nav('child')}><NativeFamilyMap members={family.map((f:any)=>({id:f.id,display_name:f.name,role:'child'}))}/></Pressable>
      <Pressable onPress={() => nav('child')}><GlassCard style={styles.personCard}><View style={styles.personLeft}><Avatar item={person} active size={46}/><View><Text style={styles.personName}>{person.name}</Text><Text style={styles.personPlace}>{person.place} • {person.detail}</Text></View></View><View style={styles.batteryWrap}><Ionicons name="battery-full" size={20} color={C.green}/><Text style={styles.batteryText}>85%</Text><Ionicons name="chevron-forward" size={20} color={C.muted}/></View></GlassCard></Pressable>
      <View style={styles.quickRow}>
        <QuickAction icon="location" label={t.safePlaces} color="#1595FF" onPress={() => nav('places')}/>
        <QuickAction icon="time" label={t.history} color="#7768FF" onPress={() => nav('history')}/>
        <QuickAction icon="mic" label={t.audio} color="#06B4C9" onPress={() => nav('audio')}/>
        <QuickAction icon="checkmark-circle" label={t.checkin} color="#1FC989" onPress={() => {}}/>
      </View>
      <Text style={styles.sectionTitle}>{t.safety}</Text>
      <View style={styles.twoCol}>
        <GlassCard style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: 'rgba(45,227,154,.12)' }]}><Ionicons name="home" size={20} color={C.green}/></View><Text style={styles.metricLabel}>Safe zone</Text><Text style={styles.metricValue}>Home</Text><Text style={styles.metricGood}>Inside</Text></GlassCard>
        <GlassCard style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: 'rgba(10,140,255,.14)' }]}><Ionicons name="battery-half" size={20} color={C.cyan}/></View><Text style={styles.metricLabel}>Device health</Text><Text style={styles.metricValue}>Excellent</Text><Text style={styles.metricMuted}>85% battery</Text></GlassCard>
      </View>
      <Pressable onPress={() => nav('plans')}><LinearGradient colors={['#F1ECFF','#E7F7FF']} style={styles.upgradeCard}><View><Text style={styles.upgradeEyebrow}>AGAM PLUS</Text><Text style={styles.upgradeTitle}>More protection for everyone</Text><Text style={styles.upgradeSub}>30-day history • unlimited places • priority alerts</Text></View><View style={styles.upArrow}><Ionicons name="arrow-forward" size={20} color="white"/></View></LinearGradient></Pressable>
    </ScrollView>
  );
}

function Child({ nav }: { nav: (s: Screen) => void }) {
  const p = family[1];
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPad}>
    <Pressable onPress={() => nav('home')} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={C.text}/></Pressable>
    <View style={styles.profileHero}><Avatar item={p} active size={88}/><Text style={styles.profileName}>{p.name}</Text><View style={styles.onlineRow}><View style={styles.greenDot}/><Text style={styles.onlineText}>Online • 85% battery</Text></View></View>
    <View style={styles.actionRow}>
      <QuickAction icon="call" label="Call" color="#0A8CFF" onPress={() => {}}/><QuickAction icon="chatbubble" label="Message" color="#536C92" onPress={() => {}}/><QuickAction icon="mic" label="Listen" color="#07A3C2" onPress={() => nav('audio')}/><QuickAction icon="ellipsis-horizontal" label="More" color="#4B5D7D" onPress={() => {}}/>
    </View>
    <GlassCard style={styles.locationCard}><View style={styles.locationIcon}><Ionicons name="home" size={22} color={C.green}/></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>At Home</Text><Text style={styles.cardSub}>Since 14:20</Text></View><Text style={styles.insidePill}>INSIDE</Text></GlassCard>
    <Text style={styles.sectionTitle}>Safety</Text>
    {[
      ['shield-checkmark','Safe zone','Home',C.green],['battery-half','Device battery','85%',C.cyan],['time','Last seen','2 minutes ago','#9EABBF'],['wifi','Connection','Wi-Fi','#9EABBF']
    ].map(([icon,label,value,color]: any) => <GlassCard key={label} style={styles.listRow}><View style={[styles.smallIcon,{backgroundColor:color+'18'}]}><Ionicons name={icon} size={18} color={color}/></View><Text style={styles.listLabel}>{label}</Text><Text style={styles.listValue}>{value}</Text></GlassCard>)}
    <Text style={styles.sectionTitle}>Today</Text>
    <GlassCard style={styles.timelineCard}><View style={styles.timelineLine}/>{[['08:12','Left home'],['08:27','Arrived at school'],['13:52','Left school'],['14:20','Arrived home']].map((x,i)=><View key={x[0]} style={styles.timelineRow}><View style={[styles.timelineDot,{backgroundColor:i===3?C.green:C.blue}]}/><Text style={styles.timelineTime}>{x[0]}</Text><Text style={styles.timelineText}>{x[1]}</Text></View>)}</GlassCard>
  </ScrollView>;
}

function SOS({ nav }: { nav: (s: Screen) => void }) {
  const [armed, setArmed] = useState(false);
  return <ScrollView contentContainerStyle={[styles.scrollPad,{alignItems:'center'}]}>
    <Pressable onPress={() => nav('home')} style={[styles.backBtn,{alignSelf:'flex-start'}]}><Ionicons name="chevron-back" size={22} color={C.text}/></Pressable>
    <Text style={styles.pageTitle}>Emergency SOS</Text><Text style={styles.centerSub}>One action alerts your family and shares your live location.</Text>
    <Pressable onPress={() => setArmed(!armed)} style={styles.sosOuter}><LinearGradient colors={armed?['#FF243F','#A90820']:['#FF5266','#D01834']} style={styles.sosButton}><Text style={styles.sosText}>SOS</Text><Text style={styles.sosSub}>{armed?'Alert ready':'Tap to prepare alert'}</Text></LinearGradient></Pressable>
    <View style={styles.sosActions}><QuickAction icon="call" label="Call now" color="#18BD72"/><QuickAction icon="people" label="Share location" color="#0A8CFF"/><QuickAction icon="mic" label="Live audio" color="#FF8C2E" onPress={() => nav('audio')}/></View>
    <GlassCard style={styles.warningCard}><Ionicons name="lock-closed" size={19} color="#FF7888"/><Text style={styles.warningText}>Emergency contacts receive location, battery and connection status. Safety Audio remains visibly indicated on the family member device.</Text></GlassCard>
  </ScrollView>;
}

function Places({ nav }: { nav: (s: Screen) => void }) {
  const places=[['home','Home','123 Main St',C.green],['school','School','High School',C.blue],['heart','Grandparents','45 Oak St','#BC62FF'],['barbell','Gym','Fitness Center',C.orange]];
  return <ScrollView contentContainerStyle={styles.scrollPad}><PageBack title="Safe Places" nav={nav}/>{places.map(([icon,name,sub,color]:any)=><GlassCard key={name} style={styles.placeRow}><View style={[styles.placeIcon,{backgroundColor:color}]}><Ionicons name={icon} size={21} color="white"/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{name}</Text><Text style={styles.cardSub}>{sub}</Text></View><Ionicons name="chevron-forward" size={20} color={C.muted}/></GlassCard>)}<Pressable style={styles.addPlace}><Ionicons name="add-circle" size={24} color={C.cyan}/><Text style={styles.addPlaceText}>Add safe place</Text></Pressable><Text style={styles.sectionTitle}>Notifications</Text>{['Notify on arrival','Notify on departure','Alert outside allowed area'].map(x=><GlassCard key={x} style={styles.switchRow}><Text style={styles.listLabel}>{x}</Text><View style={styles.switchOn}><View style={styles.switchKnob}/></View></GlassCard>)}</ScrollView>;
}

function History({ nav }: { nav: (s: Screen) => void }) {
  return <ScrollView contentContainerStyle={styles.scrollPad}><PageBack title="Location History" nav={nav}/><View style={styles.segment}><Text style={styles.segmentActive}>Day</Text><Text style={styles.segmentText}>Week</Text><Text style={styles.segmentText}>Month</Text></View><MiniMap selected="emma" onChild={() => {}}/><GlassCard style={styles.timelineCard}><View style={styles.timelineLine}/>{[['08:12','Home — Left home'],['08:25','School — Arrived'],['12:30','School — Left school'],['12:48','Park — Arrived'],['14:20','Home — Arrived']].map((x,i)=><View key={x[0]} style={styles.timelineRow}><View style={[styles.timelineDot,{backgroundColor:i===4?C.green:C.blue}]}/><Text style={styles.timelineTime}>{x[0]}</Text><Text style={styles.timelineText}>{x[1]}</Text></View>)}</GlassCard></ScrollView>;
}

function AudioSafety({ nav }: { nav: (s: Screen) => void }) {
  const [active,setActive]=useState(false);
  const bars=useMemo(()=>Array.from({length:34},(_,i)=>10+((i*17)%44)),[]);
  return <ScrollView contentContainerStyle={styles.scrollPad}><PageBack title="Safety Audio" nav={nav}/><GlassCard style={styles.transparencyCard}><Ionicons name="eye" size={20} color={C.cyan}/><View style={{flex:1}}><Text style={styles.cardTitle}>Transparent by design</Text><Text style={styles.cardSub}>The family member device always shows when its microphone is active.</Text></View></GlassCard><View style={styles.audioHero}><View style={[styles.liveDot,{backgroundColor:active?C.red:'#53677E'}]}/><Text style={styles.audioState}>{active?'Live safety audio':'Ready to request audio'}</Text><Text style={styles.audioTimer}>{active?'00:12':'—'}</Text><View style={styles.wave}>{bars.map((h,i)=><View key={i} style={[styles.waveBar,{height:active?h:8,opacity:active?1:.25}]}/>)}</View><Pressable onPress={()=>setActive(!active)}><LinearGradient colors={active?['#FF4B62','#C71431']:['#12B7FF','#0875FF']} style={styles.audioButton}><Ionicons name={active?'stop':'mic'} size={34} color="white"/></LinearGradient></Pressable><Text style={styles.centerSub}>{active?'Tap to end session':'Send a visible listening request'}</Text></View><GlassCard style={styles.warningCard}><Ionicons name="shield-checkmark" size={20} color={C.green}/><Text style={styles.warningText}>End-to-end encrypted. No audio is stored by default. Parent access is logged in the family privacy history.</Text></GlassCard></ScrollView>;
}

function More({ lang, setLang, nav }: { lang: Lang; setLang:(l:Lang)=>void; nav:(s:Screen)=>void }) {
  const rows=[['people','Family members','child'],['location','Safe Places','places'],['time','Location History','history'],['alert-circle','SOS settings','sos'],['mic','Safety Audio','audio'],['language','Language','language'],['diamond','AGAM Plus','plans'],['settings','Settings','home']];
  return <ScrollView contentContainerStyle={styles.scrollPad}><Text style={styles.pageTitle}>Menu</Text>{rows.map(([icon,label,target])=><Pressable key={label} onPress={()=>nav(target as Screen)}><GlassCard style={styles.menuRow}><Ionicons name={icon as any} size={20} color={label==='AGAM Plus'?C.cyan:'#C7D7E8'}/><Text style={[styles.menuText,label==='AGAM Plus'&&{color:C.cyan}]}>{label}</Text><Ionicons name="chevron-forward" size={18} color={C.muted}/></GlassCard></Pressable>)}<Text style={styles.privacyFooter}>AGAM Family • Privacy-first family safety</Text></ScrollView>;
}

function Language({ lang, setLang, nav }: { lang:Lang; setLang:(l:Lang)=>void; nav:(s:Screen)=>void }) {
  const langs=[['English','🇬🇧','en'],['עברית','🇮🇱','he'],['العربية','🇦🇪','ar'],['Español','🇪🇸','es'],['Français','🇫🇷','fr'],['Deutsch','🇩🇪','de'],['Italiano','🇮🇹','it'],['Português','🇧🇷','pt'],['Türkçe','🇹🇷','tr'],['हिन्दी','🇮🇳','hi'],['日本語','🇯🇵','ja'],['한국어','🇰🇷','ko']];
  return <ScrollView contentContainerStyle={styles.scrollPad}><PageBack title="Select Language" nav={nav}/>{langs.map(([name,flag,code])=><Pressable key={name} onPress={()=>{if(code==='en'||code==='he')setLang(code as Lang)}}><GlassCard style={[styles.languageRow,lang===code&&styles.languageSelected]}><Text style={styles.flag}>{flag}</Text><Text style={styles.menuText}>{name}</Text>{lang===code&&<Ionicons name="checkmark-circle" size={21} color={C.cyan}/>}</GlassCard></Pressable>)}</ScrollView>;
}

function Plans({ nav }: { nav:(s:Screen)=>void }) {
  return <ScrollView contentContainerStyle={styles.scrollPad}><PageBack title="AGAM Plus" nav={nav}/><LinearGradient colors={['#F1ECFF','#E8F7FF']} style={styles.planHero}><Ionicons name="sparkles" size={28} color="#BFE8FF"/><Text style={styles.planTitle}>Protect more. Worry less.</Text><Text style={styles.planSub}>Unlock deeper history, unlimited places and smarter safety alerts.</Text></LinearGradient><GlassCard style={styles.planCard}><View style={styles.planTop}><Text style={styles.planName}>Free</Text><Text style={styles.planPrice}>$0</Text></View>{['2 family members','2 Safe Places','24h location history','SOS & check-in'].map(x=><Feature key={x} text={x}/>)}</GlassCard><LinearGradient colors={['#0C73E8','#0755BC']} style={styles.planCard}><View style={styles.planTop}><View><Text style={styles.planName}>Family Plus</Text><Text style={styles.bestValue}>BEST VALUE</Text></View><Text style={styles.planPrice}>$5.99<Text style={styles.month}>/mo</Text></Text></View>{['Up to 6 family members','Unlimited Safe Places','30-day location history','Safety Audio','Safe Walk','Priority alerts'].map(x=><Feature key={x} text={x}/>) }<Pressable style={styles.startTrial}><Text style={styles.startTrialText}>Start 7-day free trial</Text></Pressable></LinearGradient><Text style={styles.billingNote}>Subscriptions renew automatically until cancelled. Final pricing may vary by store and region.</Text></ScrollView>;
}

function Feature({text}:{text:string}){return <View style={styles.featureRow}><Ionicons name="checkmark-circle" size={18} color={C.green}/><Text style={styles.featureText}>{text}</Text></View>}
function PageBack({title,nav}:{title:string;nav:(s:Screen)=>void}){return <View style={styles.pageBack}><Pressable onPress={()=>nav('home')} style={styles.backBtn}><Ionicons name="chevron-back" size={22} color={C.text}/></Pressable><Text style={styles.pageTitle}>{title}</Text><View style={{width:42}}/></View>}

function BottomNav({ screen, nav, lang }:{screen:Screen;nav:(s:Screen)=>void;lang:Lang}){
  const t=copy[lang];
  const items=[['home','home',t.home],['map','location',t.map],['sos','shield', 'SOS'],['audio','chatbubble',t.chat],['more','menu',t.more]] as any[];
  return <View style={styles.bottomNav}>{items.map(([target,icon,label])=><Pressable key={target} onPress={()=>nav(target)} style={styles.navItem}>{target==='sos'?<LinearGradient colors={['#10B7FF','#0871FF']} style={styles.sosNav}><Text style={styles.sosNavText}>SOS</Text></LinearGradient>:<><Ionicons name={icon} size={22} color={screen===target?C.cyan:'#73879F'}/><Text style={[styles.navLabel,screen===target&&{color:C.cyan}]}>{label}</Text></>}</Pressable>)}</View>;
}

export default function App(){
  const [screen,setScreen]=useState<Screen>('home'); const [lang,setLang]=useState<Lang>('en');
  const noBottom=['child','places','history','audio','plans','language'].includes(screen);
  return <SafeAreaProvider><LinearGradient colors={['#FBFEFF','#F2FAFF','#F7FFFC']} style={styles.app}><StatusBar style="dark"/><SafeAreaView style={styles.safe}><Header lang={lang} onPlans={()=>setScreen('plans')}/><View style={styles.content}>{screen==='home'&&<Home lang={lang} nav={setScreen}/>} {screen==='child'&&<Child nav={setScreen}/>} {screen==='sos'&&<SOS nav={setScreen}/>} {screen==='places'&&<Places nav={setScreen}/>} {screen==='history'&&<History nav={setScreen}/>} {screen==='audio'&&<AudioSafety nav={setScreen}/>} {screen==='more'&&<More lang={lang} setLang={setLang} nav={setScreen}/>} {screen==='language'&&<Language lang={lang} setLang={setLang} nav={setScreen}/>} {screen==='plans'&&<Plans nav={setScreen}/>}</View>{!noBottom&&<BottomNav screen={screen} nav={setScreen} lang={lang}/>}</SafeAreaView></LinearGradient></SafeAreaProvider>
}

const styles=StyleSheet.create({
  app:{flex:1,width:'100%',maxWidth:'100%'},safe:{flex:1,width:'100%',maxWidth:'100%',overflow:'hidden'},content:{flex:1,width:'100%',maxWidth:'100%',overflow:'hidden'},scrollPad:{paddingHorizontal:18,paddingBottom:120,gap:14,alignSelf:'stretch'},
  header:{height:78,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',...(Platform.OS==='web'?({boxSizing:'border-box'} as any):{}),borderBottomWidth:1,borderColor:'#E2EDF4'},brandRow:{flexDirection:'row',alignItems:'center',gap:11},brandIcon:{width:42,height:42,borderRadius:14,alignItems:'center',justifyContent:'center',shadowColor:C.blue,shadowOpacity:.45,shadowRadius:14,shadowOffset:{width:0,height:4}},brand:{color:C.text,fontSize:20,fontWeight:'800',letterSpacing:.2},brandSub:{color:C.muted,fontSize:10,marginTop:2},plusPill:{flexDirection:'row',gap:5,alignItems:'center',paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:'#F1ECFF',borderWidth:1,borderColor:'#DFD5FF'},plusText:{color:'#7556DD',fontSize:10,fontWeight:'800',letterSpacing:1},
  glass:{backgroundColor:'rgba(255,255,255,.94)',borderRadius:20,borderWidth:1,borderColor:'#DCEAF3',overflow:'hidden'},sectionHead:{marginTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'},kicker:{color:C.green,fontSize:12,fontWeight:'700',textTransform:'uppercase',letterSpacing:.7},pageTitle:{color:C.text,fontSize:27,fontWeight:'800',marginTop:3},statusBadge:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(45,227,154,.10)',borderWidth:1,borderColor:'rgba(45,227,154,.25)',paddingHorizontal:10,paddingVertical:7,borderRadius:999},statusBadgeText:{color:'#188864',fontSize:11,fontWeight:'700'},familyScroller:{width:'100%',alignSelf:'stretch'},familyStrip:{gap:18,paddingVertical:6,paddingHorizontal:2},avatarRing:{borderWidth:2,alignItems:'center',justifyContent:'center'},avatar:{alignItems:'center',justifyContent:'center'},avatarInitial:{color:'white',fontWeight:'800'},avatarName:{color:'#5E7489',fontSize:11,fontWeight:'600'},meAvatar:{width:60,height:60,borderRadius:999,backgroundColor:'#EDF6FF',borderWidth:2,borderColor:'#CDE2F0',alignItems:'center',justifyContent:'center'},addAvatar:{width:60,height:60,borderRadius:999,borderWidth:1,borderColor:'#CDE2F0',alignItems:'center',justifyContent:'center',backgroundColor:'#FFFFFF'},
  mapWrap:{height:330,borderRadius:28,overflow:'hidden',backgroundColor:'#EEF8F7',borderWidth:1,borderColor:'#D4E8ED'},mapTopRow:{position:'absolute',top:14,left:14,right:14,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},safeChip:{paddingHorizontal:11,paddingVertical:8,borderRadius:999,flexDirection:'row',gap:7,alignItems:'center'},greenDot:{width:8,height:8,borderRadius:99,backgroundColor:C.green,shadowColor:C.green,shadowOpacity:.7,shadowRadius:7},safeChipText:{color:'#236B56',fontSize:11,fontWeight:'700'},mapButtons:{gap:8},mapCircle:{width:38,height:38,borderRadius:14,backgroundColor:'rgba(255,255,255,.94)',borderWidth:1,borderColor:'#D5E5EE',alignItems:'center',justifyContent:'center'},marker:{position:'absolute',flexDirection:'row',alignItems:'center',gap:8},markerAvatar:{width:48,height:48,borderRadius:999,borderWidth:3,borderColor:'white',alignItems:'center',justifyContent:'center',shadowColor:C.blue,shadowOpacity:.6,shadowRadius:10},markerInitial:{color:'white',fontWeight:'900',fontSize:18},markerLabel:{backgroundColor:'rgba(255,255,255,.96)',paddingHorizontal:10,paddingVertical:7,borderRadius:12,borderWidth:1,borderColor:'#D5E5EE'},markerName:{color:'#0B315E',fontWeight:'800',fontSize:12},markerPlace:{color:C.muted,fontSize:10,marginTop:1},smallMarker:{position:'absolute',width:34,height:34,borderRadius:999,backgroundColor:C.purple,borderWidth:2,borderColor:'white',alignItems:'center',justifyContent:'center'},smallMarkerText:{color:'white',fontWeight:'800'},mapFooter:{position:'absolute',bottom:12,left:14,right:14,backgroundColor:'rgba(255,255,255,.92)',paddingHorizontal:11,paddingVertical:8,borderRadius:13,flexDirection:'row',gap:7,alignItems:'center'},mapFooterText:{color:'#71869A',fontSize:10},
  personCard:{padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},personLeft:{flex:1,flexDirection:'row',alignItems:'center',gap:10,minWidth:0},personName:{color:C.text,fontSize:16,fontWeight:'800'},personPlace:{color:C.muted,fontSize:11,marginTop:3},batteryWrap:{flexDirection:'row',gap:5,alignItems:'center'},batteryText:{color:'#2B8967',fontSize:11,fontWeight:'700'},quickRow:{flexDirection:'row',justifyContent:'space-between',gap:6,marginVertical:2},quickItem:{alignItems:'center',gap:7,flex:1,minWidth:0},quickIcon:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(90,163,212,.25)'},quickLabel:{color:'#536D84',fontSize:10,fontWeight:'600',textAlign:'center'},sectionTitle:{color:C.text,fontSize:16,fontWeight:'800',marginTop:6},twoCol:{flexDirection:'row',gap:10},metric:{flex:1,padding:14,minHeight:142},metricIcon:{width:38,height:38,borderRadius:13,alignItems:'center',justifyContent:'center'},metricLabel:{color:C.muted,fontSize:10,marginTop:12},metricValue:{color:C.text,fontSize:17,fontWeight:'800',marginTop:2},metricGood:{color:C.green,fontSize:11,fontWeight:'700',marginTop:6},metricMuted:{color:C.muted,fontSize:11,marginTop:6},upgradeCard:{borderRadius:22,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'rgba(74,169,255,.35)'},upgradeEyebrow:{color:'#7457D9',fontSize:10,fontWeight:'900',letterSpacing:1},upgradeTitle:{color:'#0B2A4A',fontSize:16,fontWeight:'800',marginTop:5},upgradeSub:{color:'#6F7890',fontSize:10,marginTop:4,maxWidth:260},upArrow:{width:38,height:38,borderRadius:999,backgroundColor:'rgba(138,108,255,.15)',alignItems:'center',justifyContent:'center'},
  backBtn:{width:42,height:42,borderRadius:14,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#D6E6EF'},profileHero:{alignItems:'center',paddingVertical:12},profileName:{color:C.text,fontSize:28,fontWeight:'900',marginTop:8},onlineRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:5},onlineText:{color:C.muted,fontSize:12},actionRow:{flexDirection:'row',justifyContent:'space-between'},locationCard:{padding:14,flexDirection:'row',alignItems:'center',gap:12},locationIcon:{width:44,height:44,borderRadius:14,backgroundColor:'rgba(45,227,154,.14)',alignItems:'center',justifyContent:'center'},cardTitle:{color:C.text,fontSize:14,fontWeight:'800'},cardSub:{color:C.muted,fontSize:11,marginTop:3,lineHeight:16},insidePill:{color:C.green,fontSize:10,fontWeight:'800',borderWidth:1,borderColor:'rgba(45,227,154,.28)',paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:'rgba(45,227,154,.08)'},listRow:{padding:12,flexDirection:'row',alignItems:'center',gap:10},smallIcon:{width:34,height:34,borderRadius:11,alignItems:'center',justifyContent:'center'},listLabel:{color:'#334E68',fontSize:12,flex:1},listValue:{color:C.text,fontSize:12,fontWeight:'700'},timelineCard:{padding:15,position:'relative'},timelineLine:{position:'absolute',left:25,top:22,bottom:22,width:2,backgroundColor:'#1A4568'},timelineRow:{flexDirection:'row',alignItems:'center',minHeight:45,gap:11},timelineDot:{width:10,height:10,borderRadius:99,zIndex:2},timelineTime:{color:C.muted,fontSize:11,width:42},timelineText:{color:C.text,fontSize:12,fontWeight:'600'},
  centerSub:{color:C.muted,textAlign:'center',fontSize:12,lineHeight:18,maxWidth:310},sosOuter:{width:240,height:240,borderRadius:999,borderWidth:1,borderColor:'rgba(255,68,91,.36)',padding:18,marginVertical:22,shadowColor:C.red,shadowOpacity:.4,shadowRadius:35},sosButton:{flex:1,borderRadius:999,alignItems:'center',justifyContent:'center',borderWidth:7,borderColor:'rgba(255,255,255,.10)'},sosText:{color:'white',fontSize:47,fontWeight:'900',letterSpacing:1},sosSub:{color:'#FFD6DB',fontSize:11,marginTop:4,fontWeight:'600'},sosActions:{flexDirection:'row',justifyContent:'center',gap:18,width:'100%'},warningCard:{padding:14,flexDirection:'row',gap:10,alignItems:'flex-start'},warningText:{color:'#60788E',fontSize:11,lineHeight:17,flex:1},
  pageBack:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10},placeRow:{padding:13,flexDirection:'row',alignItems:'center',gap:12},placeIcon:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},addPlace:{height:52,borderRadius:16,borderWidth:1,borderStyle:'dashed',borderColor:'#2C668E',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},addPlaceText:{color:C.cyan,fontWeight:'700',fontSize:12},switchRow:{padding:14,flexDirection:'row',alignItems:'center'},switchOn:{width:43,height:24,borderRadius:999,backgroundColor:C.blue,padding:3,alignItems:'flex-end'},switchKnob:{width:18,height:18,borderRadius:99,backgroundColor:'white'},segment:{height:42,borderRadius:14,backgroundColor:'#EEF4F8',flexDirection:'row',alignItems:'center',padding:4},segmentActive:{flex:1,textAlign:'center',color:'white',fontSize:11,fontWeight:'800',paddingVertical:9,borderRadius:11,backgroundColor:C.blue},segmentText:{flex:1,textAlign:'center',color:C.muted,fontSize:11,fontWeight:'700'},
  transparencyCard:{padding:14,flexDirection:'row',gap:11,alignItems:'flex-start',borderColor:'rgba(54,197,255,.28)'},audioHero:{alignItems:'center',paddingVertical:12,gap:10},liveDot:{width:9,height:9,borderRadius:99},audioState:{color:C.text,fontSize:16,fontWeight:'800'},audioTimer:{color:'#71869A',fontSize:28,fontWeight:'300',letterSpacing:2},wave:{height:90,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3,width:'100%',marginVertical:4},waveBar:{width:3,borderRadius:99,backgroundColor:C.cyan},audioButton:{width:92,height:92,borderRadius:999,alignItems:'center',justifyContent:'center',shadowColor:C.blue,shadowOpacity:.5,shadowRadius:20},menuRow:{padding:15,flexDirection:'row',alignItems:'center',gap:12},menuText:{flex:1,color:C.text,fontSize:13,fontWeight:'600'},privacyFooter:{textAlign:'center',color:'#8BA0B2',fontSize:10,marginTop:10},languageRow:{padding:14,flexDirection:'row',alignItems:'center',gap:12},languageSelected:{borderColor:'rgba(54,197,255,.55)',backgroundColor:'rgba(10,140,255,.10)'},flag:{fontSize:23},
  planHero:{padding:22,borderRadius:24,alignItems:'center',gap:8,borderWidth:1,borderColor:'rgba(70,161,255,.35)'},planTitle:{color:'#0B2A4A',fontSize:24,fontWeight:'900'},planSub:{color:'#6F7890',fontSize:12,textAlign:'center',lineHeight:18,maxWidth:310},planCard:{padding:18,gap:10},planTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5},planName:{color:'#0B2A4A',fontSize:20,fontWeight:'900'},planPrice:{color:'#0B2A4A',fontSize:24,fontWeight:'900'},month:{fontSize:11,color:'#71869A'},bestValue:{color:'#7657D8',fontSize:9,fontWeight:'900',letterSpacing:1,marginTop:4},featureRow:{flexDirection:'row',gap:8,alignItems:'center'},featureText:{color:'#39566F',fontSize:12},startTrial:{height:50,borderRadius:15,backgroundColor:'white',alignItems:'center',justifyContent:'center',marginTop:8},startTrialText:{color:'#0755BC',fontWeight:'900',fontSize:13},billingNote:{color:'#879BAC',fontSize:9,textAlign:'center',lineHeight:14,paddingHorizontal:18},
  bottomNav:{height:76,borderTopWidth:1,borderColor:'#DCEAF3',backgroundColor:'rgba(255,255,255,.97)',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingBottom:6},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:4},navLabel:{fontSize:9,color:'#8AA0B4',fontWeight:'600'},sosNav:{width:58,height:58,borderRadius:999,alignItems:'center',justifyContent:'center',marginTop:-24,borderWidth:4,borderColor:'#FFFFFF',shadowColor:C.blue,shadowOpacity:.7,shadowRadius:16},sosNavText:{color:'white',fontWeight:'900',fontSize:13}
});
