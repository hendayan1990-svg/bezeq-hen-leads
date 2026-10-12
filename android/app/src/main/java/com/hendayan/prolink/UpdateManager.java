package com.hendayan.prolink;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.content.pm.PackageInfo;
import android.content.Context;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class UpdateManager {
  public static final String MANIFEST="https://prolink-wifi-pro-live.onrender.com/api/version";
  private UpdateManager(){}
  public static void check(Activity activity,boolean manual){
    if(!manual){
      long last=activity.getPreferences(Context.MODE_PRIVATE).getLong("last_update_check",0);
      if(System.currentTimeMillis()-last<24*60*60*1000L)return;
      activity.getPreferences(Context.MODE_PRIVATE).edit().putLong("last_update_check",System.currentTimeMillis()).apply();
    }
    new Thread(()->{
      HttpURLConnection conn=null;
      try{
        conn=(HttpURLConnection)new URL(MANIFEST).openConnection();
        conn.setConnectTimeout(8000);conn.setReadTimeout(9000);conn.setRequestProperty("Cache-Control","no-cache");
        if(conn.getResponseCode()!=200)throw new Exception("שרת עדכונים לא זמין");
        byte[] b=new byte[8192];int n;
        try(InputStream in=conn.getInputStream()){n=in.read(b);}
        if(n<=0)throw new Exception("תשובת שרת ריקה");
        JSONObject response=new JSONObject(new String(b,0,n,StandardCharsets.UTF_8));
        int available=response.optInt("versionCode",0);
        String name=response.optString("versionName","");
        String url=response.optString("downloadUrl","");
        if(!url.startsWith("https://prolink-wifi-pro-live.onrender.com/download/"))throw new Exception("כתובת עדכון לא מאושרת");
        long current;
        PackageInfo info=activity.getPackageManager().getPackageInfo(activity.getPackageName(),0);
        current=android.os.Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
        boolean newer=available>current;
        Handler ui=new Handler(Looper.getMainLooper());
        ui.post(()->{
          if(activity.isFinishing()||activity.isDestroyed())return;
          if(newer){
            new AlertDialog.Builder(activity).setTitle("עדכון חדש ל־ProLink WiFi PRO")
              .setMessage("זמינה גרסה "+name+".\nניתן להתקין ללא חיבור למחשב. אנדרואיד יבקש אישור להתקנה.")
              .setPositiveButton("הורד והתקן",(d,w)->activity.startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url))))
              .setNegativeButton("מאוחר יותר",null).show();
          }else if(manual){
            new AlertDialog.Builder(activity).setTitle("האפליקציה מעודכנת")
              .setMessage("גרסה "+info.versionName+" היא הגרסה העדכנית.").setPositiveButton("סגור",null).show();
          }
        });
      }catch(Exception e){
        if(manual)new Handler(Looper.getMainLooper()).post(()->new AlertDialog.Builder(activity)
          .setTitle("לא ניתן לבדוק עדכונים").setMessage(e.getMessage())
          .setPositiveButton("סגור",null).show());
      }finally{if(conn!=null)conn.disconnect();}
    },"prolink-update-check").start();
  }
}
