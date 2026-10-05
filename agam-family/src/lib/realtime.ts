import { useEffect, useMemo, useState } from 'react';
import { requireSupabase, supabaseConfigured } from './supabase';
import { getFamily } from './api';

export type LiveMember = {
  id: string;
  user_id: string;
  family_id: string;
  role: 'parent'|'guardian'|'child';
  display_name: string;
  active: boolean;
  latestLocation?: {
    latitude: number;
    longitude: number;
    accuracy_m?: number|null;
    speed_mps?: number|null;
    recorded_at: string;
    source: string;
  };
};

export type LiveSos = {
  id: string;
  family_id: string;
  member_id: string;
  status: 'active'|'acknowledged'|'resolved'|'cancelled';
  latitude?: number|null;
  longitude?: number|null;
  note?: string|null;
  created_at: string;
};

type State = {
  loading: boolean;
  connected: boolean;
  error: string|null;
  family: any|null;
  me: any|null;
  members: LiveMember[];
  sos: LiveSos[];
  lastEventAt: number|null;
};

const initial:State={loading:supabaseConfigured,connected:false,error:null,family:null,me:null,members:[],sos:[],lastEventAt:null};

export function useFamilyRealtime(){
  const [state,setState]=useState<State>(initial);

  useEffect(()=>{
    if(!supabaseConfigured){setState({...initial,loading:false});return;}
    let alive=true; let channel:any=null;
    const client=requireSupabase();

    async function load(){
      try{
        const ctx:any=await getFamily();
        if(!alive)return;
        const familyId=ctx.family.id;
        const memberRows:LiveMember[]=ctx.members||[];

        const {data:locations,error:locError}=await client
          .from('locations')
          .select('member_id,latitude,longitude,accuracy_m,speed_mps,recorded_at,source')
          .eq('family_id',familyId)
          .order('recorded_at',{ascending:false})
          .limit(250);
        if(locError)throw locError;
        const latest=new Map<string,any>();
        for(const row of locations||[]){if(!latest.has(row.member_id))latest.set(row.member_id,row)}

        const {data:sosRows,error:sosError}=await client
          .from('sos_alerts')
          .select('*')
          .eq('family_id',familyId)
          .in('status',['active','acknowledged'])
          .order('created_at',{ascending:false});
        if(sosError)throw sosError;

        setState({loading:false,connected:false,error:null,family:ctx.family,me:ctx.me,members:memberRows.map(m=>({...m,latestLocation:latest.get(m.id)})),sos:sosRows||[],lastEventAt:Date.now()});

        channel=client.channel(`family:${familyId}:dashboard`)
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'locations',filter:`family_id=eq.${familyId}`},(payload:any)=>{
            const row=payload.new;
            setState(prev=>({...prev,lastEventAt:Date.now(),members:prev.members.map(m=>m.id===row.member_id?{...m,latestLocation:row}:m)}));
          })
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'sos_alerts',filter:`family_id=eq.${familyId}`},(payload:any)=>{
            const row=payload.new as LiveSos;
            setState(prev=>({...prev,lastEventAt:Date.now(),sos:[row,...prev.sos.filter(x=>x.id!==row.id)]}));
          })
          .on('postgres_changes',{event:'UPDATE',schema:'public',table:'sos_alerts',filter:`family_id=eq.${familyId}`},(payload:any)=>{
            const row=payload.new as LiveSos;
            setState(prev=>({...prev,lastEventAt:Date.now(),sos:row.status==='active'||row.status==='acknowledged'?[row,...prev.sos.filter(x=>x.id!==row.id)]:prev.sos.filter(x=>x.id!==row.id)}));
          })
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'check_ins',filter:`family_id=eq.${familyId}`},()=>setState(prev=>({...prev,lastEventAt:Date.now()})))
          .subscribe((status:string)=>{
            if(!alive)return;
            setState(prev=>({...prev,connected:status==='SUBSCRIBED',error:status==='CHANNEL_ERROR'?'Realtime connection error':prev.error}));
          });
      }catch(e:any){if(alive)setState(prev=>({...prev,loading:false,error:String(e?.message||'Could not load family')}));}
    }
    load();
    return()=>{alive=false;if(channel)client.removeChannel(channel).catch(()=>{});};
  },[]);

  const activeSos=useMemo(()=>state.sos.filter(x=>x.status==='active'||x.status==='acknowledged'),[state.sos]);
  return {...state,activeSos};
}
