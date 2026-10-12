package com.hendayan.prolink;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public final class CloudSync {
  public static final String SERVER="https://prolink-wifi-pro-live.onrender.com";
  private static final String ALIAS="prolink_wifi_pro_tech_key";
  private static final String PREF="prolink_cloud";
  private CloudSync(){}
  private static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREF,Context.MODE_PRIVATE);}
  public static boolean connected(Context c){return !prefs(c).getString("session","").isEmpty();}
  public static String session(Context c){return prefs(c).getString("session","");}
  public static boolean hasSavedCode(Context c){return !prefs(c).getString("secret","").isEmpty();}
  public static String technician(Context c){return prefs(c).getString("technician","");}
  public static String viewer(Context c){return prefs(c).getString("viewer","");}
  public static String lastError(Context c){return prefs(c).getString("error","");}
  public static void setError(Context c,String value){prefs(c).edit().putString("error",value).apply();}
  private static SecretKey key() throws Exception {
    KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);
    if(ks.containsAlias(ALIAS))return (SecretKey)ks.getKey(ALIAS,null);
    KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
    gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256).build());
    return gen.generateKey();
  }
  public static void saveCode(Context c,String code)throws Exception{
    if(code==null||code.trim().length()<24)throw new IllegalArgumentException("קוד טכנאי קצר או חסר");
    Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
    byte[] encrypted=cipher.doFinal(code.trim().getBytes(StandardCharsets.UTF_8));
    prefs(c).edit().putString("secret",Base64.encodeToString(encrypted,Base64.NO_WRAP))
      .putString("iv",Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)).apply();
  }
  private static String readCode(Context c)throws Exception{
    String encrypted=prefs(c).getString("secret",""),iv=prefs(c).getString("iv","");
    if(encrypted.isEmpty())throw new IllegalStateException("לא הוגדר קוד טכנאי בכניסת ענן");
    Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(iv,Base64.NO_WRAP)));
    return new String(cipher.doFinal(Base64.decode(encrypted,Base64.NO_WRAP)),StandardCharsets.UTF_8);
  }
  private static JSONObject call(Context c,String method,String path,JSONObject payload,boolean auth)throws Exception {
    HttpURLConnection conn=(HttpURLConnection)new URL(SERVER+path).openConnection();
    conn.setRequestMethod(method);conn.setConnectTimeout(25000);conn.setReadTimeout(55000);
    conn.setRequestProperty("Accept","application/json");
    if(auth)conn.setRequestProperty("Authorization","Bearer "+readCode(c));
    if(payload!=null){conn.setDoOutput(true);conn.setRequestProperty("Content-Type","application/json; charset=utf-8");
      try(OutputStream out=conn.getOutputStream()){out.write(payload.toString().getBytes(StandardCharsets.UTF_8));}}
    int status=conn.getResponseCode();
    try(InputStream in=status<400?conn.getInputStream():conn.getErrorStream()){
      if(in==null)throw new IllegalStateException("שרת לא החזיר תשובה");
      byte[] raw=new byte[65536];int used=0,read;
      while((read=in.read(raw,used,raw.length-used))!=-1){used+=read;if(used==raw.length)break;}
      JSONObject result=new JSONObject(new String(raw,0,used,StandardCharsets.UTF_8));
      if(status>=400)throw new IllegalStateException("HTTP "+status+": "+result.optString("error","שגיאת שרת"));
      return result;
    }finally{conn.disconnect();}
  }
  public static JSONObject create(Context c,String code,String technician,String customer)throws Exception {
    if(code!=null&&!code.trim().isEmpty())saveCode(c,code);
    else if(!hasSavedCode(c))throw new IllegalStateException("יש להזין קוד טכנאי פעם אחת");
    JSONObject args=new JSONObject();
    args.put("technician",technician.trim());args.put("customerLabel",customer.trim().isEmpty()?"לקוח":customer.trim());
    JSONObject response=call(c,"POST","/api/sessions",args,true);
    prefs(c).edit().putString("session",response.getJSONObject("session").getString("id"))
      .putString("viewer",response.getString("viewerUrl"))
      .putString("viewer_token",response.optString("viewerToken")).putString("technician",technician.trim())
      .putString("customer",customer.trim()).putString("error","").apply();
    return response;
  }
  public static synchronized int sendPending(Context c)throws Exception {
    String session=session(c);if(session.isEmpty())throw new IllegalStateException("יש ליצור ביקור בענן תחילה");
    SharedPreferences field=c.getSharedPreferences("prolink_field",Context.MODE_PRIVATE);
    JSONArray points=new JSONArray(field.getString("points","[]"));
    boolean recovered=false;
    try{call(c,"GET","/api/sessions/"+session,null,true);}
    catch(Exception e){
      if(!e.getMessage().contains("HTTP 404"))throw e;
      JSONObject recovery=new JSONObject();
      recovery.put("id",session);
      recovery.put("viewerToken",prefs(c).getString("viewer_token",""));
      recovery.put("technician",prefs(c).getString("technician",""));
      recovery.put("customerLabel",prefs(c).getString("customer","לקוח"));
      JSONObject recoveryResult=call(c,"POST","/api/sessions/recover",recovery,true);
      recovered=recoveryResult.optBoolean("recovered",false);
    }
    if(recovered){
      for(int i=0;i<points.length();i++){
        JSONObject p=points.optJSONObject(i);
        if(p!=null&&session.equals(p.optString("cloud_session")))p.put("cloud_synced",false);
      }
      field.edit().putString("points",points.toString()).commit();
    }
    int sent=0,failed=0;
    for(int i=0;i<points.length();i++){
      JSONObject p=points.optJSONObject(i);if(p==null)continue;
      if(!session.equals(p.optString("cloud_session")))continue;
      if(p.optBoolean("cloud_synced"))continue;
      if(p.optString("cloud_id").isEmpty())p.put("cloud_id",UUID.randomUUID().toString());
      // Save durable idempotency key before the request (safe on retries).
      field.edit().putString("points",points.toString()).commit();
      JSONObject data=new JSONObject();
      data.put("id",p.optString("cloud_id"));data.put("room",p.optString("room"));
      data.put("stage",p.optBoolean("after")?"after":"before");
      data.put("transport",p.optString("transport").contains("Ethernet")?"Ethernet":"Wi-Fi");
      boolean signalOnly="signal".equals(p.optString("kind"));
      data.put("kind",signalOnly?"signal":"speed");
      if(signalOnly){
        data.put("download",JSONObject.NULL);data.put("upload",JSONObject.NULL);
        data.put("ping",JSONObject.NULL);data.put("jitter",JSONObject.NULL);
        data.put("distance_m",p.optDouble("distance_m",0));
      }else{
        data.put("download",p.optDouble("downloadPeak"));
        data.put("upload",p.optDouble("uploadPeak"));
        data.put("ping",p.optDouble("latency"));data.put("jitter",p.optDouble("jitter"));
      }
      data.put("rssi",p.optInt("rssi"));data.put("quality",SignalQuality.name(p.optInt("rssi")));
      data.put("timestamp",new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX",java.util.Locale.US).format(new java.util.Date(p.optLong("timestamp",System.currentTimeMillis()))));
      try{call(c,"POST","/api/sessions/"+session+"/measurements",data,true);p.put("cloud_synced",true);sent++;}
      catch(Exception e){failed++;setError(c,e.getMessage());break;}
      field.edit().putString("points",points.toString()).commit();
    }
    if(failed>0)throw new IllegalStateException("חלק מהמדידות ממתינות לסנכרון: "+lastError(c));
    setError(c,"");return sent;
  }
  public static JSONObject health(Context c)throws Exception{return call(c,"GET","/api/health",null,false);}
  public static void clearSession(Context c){prefs(c).edit().remove("session").remove("viewer").remove("viewer_token").apply();}
}
