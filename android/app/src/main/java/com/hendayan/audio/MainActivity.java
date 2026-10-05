package com.hendayan.audio;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import android.graphics.drawable.GradientDrawable;

public class MainActivity extends Activity {
    private static final int REQ = 1001;
    private EditText code;
    private TextView status;
    private Button start, stop;
    private String pending;

    @Override public void onCreate(Bundle b){ super.onCreate(b); setContentView(ui()); refresh(); }
    @Override public void onResume(){ super.onResume(); refresh(); }

    private View ui(){
        ScrollView sc=new ScrollView(this); sc.setFillViewport(true); sc.setBackgroundColor(Color.rgb(9,13,24));
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER_HORIZONTAL); root.setPadding(dp(24),dp(46),dp(24),dp(30)); sc.addView(root,new ScrollView.LayoutParams(-1,-1));
        TextView badge=t("●  HEN AUDIO",14,Color.rgb(132,150,255),Typeface.BOLD); root.addView(badge,lp(0,0,0,14));
        TextView title=t("שידור מהמיקרופון",30,Color.WHITE,Typeface.BOLD); title.setGravity(Gravity.END); root.addView(title,lp(0,0,0,8));
        TextView sub=t("שידור מוצפן מקצה לקצה לאייפון שלך. בזמן השידור תופיע התראה קבועה באנדרואיד.",15,Color.rgb(169,179,204),Typeface.NORMAL); sub.setGravity(Gravity.END); sub.setLineSpacing(0,1.25f); root.addView(sub,lp(0,0,0,28));
        TextView lab=t("קוד כניסה",14,Color.rgb(220,226,242),Typeface.NORMAL); lab.setGravity(Gravity.END); root.addView(lab,lp(0,0,0,8));
        code=new EditText(this); code.setSingleLine(true); code.setTextColor(Color.WHITE); code.setHintTextColor(Color.rgb(108,119,145)); code.setHint("הזן קוד"); code.setTextSize(17); code.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD); code.setPadding(dp(16),dp(14),dp(16),dp(14)); code.setBackground(round(Color.rgb(16,23,42),Color.rgb(55,65,95),16)); root.addView(code,lp(0,0,0,12));
        start=new Button(this); start.setText("התחל שידור"); start.setAllCaps(false); start.setTextSize(16); start.setTypeface(Typeface.DEFAULT,Typeface.BOLD); start.setTextColor(Color.WHITE); start.setBackground(round(Color.rgb(105,124,255),Color.TRANSPARENT,16)); start.setOnClickListener(v->begin()); root.addView(start,lh(54,0,0,0,10));
        stop=new Button(this); stop.setText("עצור שידור"); stop.setAllCaps(false); stop.setTextSize(16); stop.setTypeface(Typeface.DEFAULT,Typeface.BOLD); stop.setTextColor(Color.rgb(255,186,197)); stop.setBackground(round(Color.rgb(57,29,39),Color.TRANSPARENT,16)); stop.setOnClickListener(v->stopNow()); root.addView(stop,lh(54,0,0,0,18));
        status=t("לא משדר",14,Color.rgb(169,179,204),Typeface.BOLD); status.setGravity(Gravity.CENTER); status.setPadding(dp(14),dp(12),dp(14),dp(12)); root.addView(status,lp(0,0,0,0));
        return sc;
    }

    private void begin(){
        String c=code.getText().toString(); if(c.trim().isEmpty()){Toast.makeText(this,"יש להזין קוד כניסה",Toast.LENGTH_SHORT).show(); return;} pending=c;
        boolean mic=checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED;
        boolean notif=Build.VERSION.SDK_INT<33||checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED;
        if(!mic||!notif){ if(Build.VERSION.SDK_INT>=33) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO,Manifest.permission.POST_NOTIFICATIONS},REQ); else requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},REQ); return; }
        startSvc(c);
    }
    @Override public void onRequestPermissionsResult(int r,String[] p,int[] g){super.onRequestPermissionsResult(r,p,g); if(r!=REQ)return; for(int x:g)if(x!=PackageManager.PERMISSION_GRANTED){Toast.makeText(this,"נדרשות הרשאות מיקרופון והתראות כדי לשדר באופן גלוי",Toast.LENGTH_LONG).show();return;} if(pending!=null)startSvc(pending);}
    private void startSvc(String c){ Intent i=new Intent(this,AudioStreamService.class); i.setAction(AudioStreamService.START); i.putExtra(AudioStreamService.CODE,c); if(Build.VERSION.SDK_INT>=26)startForegroundService(i); else startService(i); code.setText(""); pending=null; refresh(); }
    private void stopNow(){ Intent i=new Intent(this,AudioStreamService.class); i.setAction(AudioStreamService.STOP); startService(i); refresh(); }
    private void refresh(){ boolean on=getSharedPreferences("ha",MODE_PRIVATE).getBoolean("streaming",false); if(status==null)return; status.setText(on?"● שידור פעיל":"לא משדר"); status.setTextColor(on?Color.rgb(78,220,151):Color.rgb(169,179,204)); if(start!=null)start.setEnabled(!on); if(stop!=null)stop.setEnabled(on); if(code!=null)code.setEnabled(!on); }
    private TextView t(String s,int z,int c,int style){TextView v=new TextView(this);v.setText(s);v.setTextSize(z);v.setTextColor(c);v.setTypeface(Typeface.DEFAULT,style);return v;}
    private GradientDrawable round(int fill,int stroke,int rad){GradientDrawable g=new GradientDrawable();g.setColor(fill);g.setCornerRadius(dp(rad));if(stroke!=Color.TRANSPARENT)g.setStroke(dp(1),stroke);return g;}
    private LinearLayout.LayoutParams lp(int l,int t,int r,int b){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(dp(l),dp(t),dp(r),dp(b));return p;}
    private LinearLayout.LayoutParams lh(int h,int l,int t,int r,int b){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(h));p.setMargins(dp(l),dp(t),dp(r),dp(b));return p;}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}
}
