package com.hendayan.audio;

import android.app.*;
import android.content.*;
import android.media.*;
import android.os.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
import java.util.concurrent.*;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import okhttp3.*;
import org.json.JSONObject;

public class AudioStreamService extends Service {
    public static final String START="com.hendayan.audio.START", STOP="com.hendayan.audio.STOP", CODE="code";
    private static final String CH="hen_audio_mic"; private static final int NID=7101, RATE=16000;
    private volatile boolean running=false; private AudioRecord recorder; private WebSocket ws; private OkHttpClient client; private ExecutorService io; private PowerManager.WakeLock wl; private SecretKeySpec key;

    @Override public void onCreate(){super.onCreate();createChannel();client=new OkHttpClient.Builder().pingInterval(20,TimeUnit.SECONDS).build();io=Executors.newSingleThreadExecutor();}
    @Override public int onStartCommand(Intent i,int flags,int id){if(i==null)return START_NOT_STICKY; if(STOP.equals(i.getAction())){stopStreaming();stopSelf();return START_NOT_STICKY;} if(START.equals(i.getAction())&&!running){String code=i.getStringExtra(CODE); if(code==null||code.isEmpty()){stopSelf();return START_NOT_STICKY;} startForeground(NID,notification("מתחבר לשידור…")); try{key=derive(code,BuildConfig.ROOM_SECRET); startSocket();}catch(Exception e){stopStreaming();stopSelf();}} return START_NOT_STICKY;}

    private void startSocket(){
        try{String channel="hen-audio-"+hex(MessageDigest.getInstance("SHA-256").digest(BuildConfig.ROOM_SECRET.getBytes(StandardCharsets.UTF_8))).substring(0,32); Request r=new Request.Builder().url("wss://itty.ws/c/"+channel+"?as=android&echo=false").build(); ws=client.newWebSocket(r,new WebSocketListener(){@Override public void onOpen(WebSocket w,Response res){beginRecording();} @Override public void onFailure(WebSocket w,Throwable t,Response res){if(running){stopRecording();getSharedPreferences("ha",MODE_PRIVATE).edit().putBoolean("streaming",false).apply();stopSelf();}}});}catch(Exception e){stopSelf();}
    }
    private void beginRecording(){ if(running)return; running=true; getSharedPreferences("ha",MODE_PRIVATE).edit().putBoolean("streaming",true).apply(); ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(NID,notification("המיקרופון משדר כעת")); PowerManager pm=(PowerManager)getSystemService(POWER_SERVICE); wl=pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"HenAudio:stream"); wl.acquire(); io.submit(this::recordLoop); }
    private void recordLoop(){
        int min=AudioRecord.getMinBufferSize(RATE,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT); int size=Math.max(min,3200);
        try{recorder=new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION,RATE,AudioFormat.CHANNEL_IN_MONO,AudioFormat.ENCODING_PCM_16BIT,size*2); recorder.startRecording(); byte[] buf=new byte[size]; SecureRandom sr=new SecureRandom();
            while(running){int n=recorder.read(buf,0,buf.length); if(n>0&&ws!=null){byte[] iv=new byte[12];sr.nextBytes(iv);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key,new GCMParameterSpec(128,iv));byte[] plain=Arrays.copyOf(buf,n);byte[] enc=c.doFinal(plain);JSONObject o=new JSONObject();o.put("iv",Base64.getEncoder().encodeToString(iv));o.put("ct",Base64.getEncoder().encodeToString(enc));ws.send(o.toString());}}
        }catch(Exception ignored){} finally{stopRecording();}
    }
    private SecretKeySpec derive(String password,String room)throws Exception{PBEKeySpec s=new PBEKeySpec(password.toCharArray(),("hen-audio-v1|"+room).getBytes(StandardCharsets.UTF_8),200000,256);SecretKeyFactory f=SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");return new SecretKeySpec(f.generateSecret(s).getEncoded(),"AES");}
    private String hex(byte[] b){StringBuilder s=new StringBuilder();for(byte x:b)s.append(String.format(Locale.US,"%02x",x));return s.toString();}
    private Notification notification(String txt){Intent stop=new Intent(this,AudioStreamService.class).setAction(STOP);PendingIntent pi=PendingIntent.getService(this,7,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Intent open=new Intent(this,MainActivity.class);PendingIntent oi=PendingIntent.getActivity(this,8,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);return new Notification.Builder(this,CH).setContentTitle("Hen Audio — מיקרופון פעיל").setContentText(txt).setSmallIcon(android.R.drawable.ic_btn_speak_now).setOngoing(true).setContentIntent(oi).addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause,"עצור שידור",pi).build()).build();}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CH,"שידור מיקרופון",NotificationManager.IMPORTANCE_LOW);c.setDescription("מוצגת בזמן שהמיקרופון משדר");c.setShowBadge(false);getSystemService(NotificationManager.class).createNotificationChannel(c);}}
    private void stopRecording(){if(recorder!=null){try{recorder.stop();}catch(Exception ignored){}try{recorder.release();}catch(Exception ignored){}recorder=null;}}
    private void stopStreaming(){running=false;getSharedPreferences("ha",MODE_PRIVATE).edit().putBoolean("streaming",false).apply();stopRecording();if(ws!=null){try{ws.close(1000,"stopped");}catch(Exception ignored){}ws=null;}if(wl!=null&&wl.isHeld())try{wl.release();}catch(Exception ignored){}wl=null;stopForeground(STOP_FOREGROUND_REMOVE);}
    @Override public void onDestroy(){stopStreaming();if(io!=null)io.shutdownNow();if(client!=null){client.dispatcher().executorService().shutdown();client.connectionPool().evictAll();}super.onDestroy();}
    @Override public IBinder onBind(Intent i){return null;}
}
