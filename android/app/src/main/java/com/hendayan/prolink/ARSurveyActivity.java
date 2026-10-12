package com.hendayan.prolink;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.RectF;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.GradientDrawable;
import android.net.wifi.WifiManager;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.app.AlertDialog;
import java.util.LinkedHashSet;
import android.widget.Toast;
import com.google.ar.core.Anchor;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.Coordinates2d;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.json.JSONObject;
import org.json.JSONArray;
import android.content.SharedPreferences;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public final class ARSurveyActivity extends Activity implements GLSurfaceView.Renderer {
  private Session ar;
  private final Object sessionLock=new Object();
  private GLSurfaceView gl;
  private MarkerOverlay overlay;
  private TextView info,summary,customerQuality,needExtender,pointCounter,trend;
  private ProgressBar signalMeter;
  private volatile String captureRoom="";
  private volatile int routerRssi=0;
  private boolean selfScan=false;
  private int claimedArea=0,floorCount=1,currentFloor=1;
  private volatile String currentRoom="סלון";
  private volatile long lastAutoAt=0;
  private Pose lastAutoPose=null;
  private Button roomButton,floorButton;
  private final Handler handler=new Handler(Looper.getMainLooper());
  private volatile boolean markRouter=false, capture=false;
  private volatile String sceneStatus="מתחבר למנוע ARCore";
  private final ArrayList<Measure> marks=new ArrayList<>();
  private Anchor router;
  private int camTexture,program,positionLoc,texLoc,textureLoc;
  private FloatBuffer positions,uvs;
  private float[] projection=new float[16],view=new float[16];
  private int width,height;
  private final float[] quad={-1f,-1f,1f,-1f,-1f,1f,1f,1f};
  private final float[] tex=new float[8];
  private final float[] vector=new float[4],clip=new float[4],eye=new float[4];
  private final Runnable update=new Runnable(){@Override public void run(){
    int r=readRssi();boolean valid=SignalQuality.valid(r);
    if(info!=null)info.setText(sceneStatus);
    if(customerQuality!=null){
      customerQuality.setText(valid?"●  "+SignalQuality.name(r)+"  |  איכות האות":"ממתין למדידת קליטה");
      customerQuality.setTextColor(SignalQuality.color(r));
    }
    if(signalMeter!=null){
      signalMeter.setProgress(valid?Math.max(0,Math.min(100,(r+95)*2)):0);
      signalMeter.setProgressTintList(ColorStateList.valueOf(SignalQuality.color(r)));
    }
    if(trend!=null){
      String msg=routerRssi<-15&&valid&&routerRssi-r>=8?
        "▼ הקליטה נחלשה בהשוואה לנתב ("+(routerRssi-r)+" dB)":
        "מעקב אות אלחוטי בזמן תנועה • אין מדידת מהירות כאן";
      trend.setText(msg);
      trend.setTextColor(routerRssi<-15&&valid&&routerRssi-r>=8?0xFFFFD27E:0xFFA9D0E8);
    }
    int count,weak;
    synchronized(sessionLock){
      count=marks.size();weak=0;
      for(Measure m:marks)if(SignalQuality.valid(m.rssi)&&m.rssi<-72)weak++;
    }
    if(pointCounter!=null)pointCounter.setText("נקודות מדודות: "+count+"  •  אזורים חלשים: "+weak);
    if(needExtender!=null){
      if(count>=3&&weak>0){
        needExtender.setText("!  נדרש שיפור כיסוי — בדוק Mesh / מגדיל טווח");
        needExtender.setTextColor(0xFFFFE1E8);needExtender.setBackground(color(0xFF792846,14));
      }else if(valid&&r<-72){
        needExtender.setText("!  אות חלש כאן — שמור נקודה ואמת בסיום");
        needExtender.setTextColor(0xFFFFD8E0);needExtender.setBackground(color(0xFF792846,14));
      }else{
        needExtender.setText(count<3?"המשך לסרוק • עוד "+(3-count)+" נקודות לאבחון":"אין עדיין ממצא שמצדיק ציוד נוסף");
        needExtender.setTextColor(0xFF99F7E0);needExtender.setBackground(color(0xFF145247,14));
      }
    }
    if(overlay!=null&&overlay.getParent()!=null)AppLanguage.translateTree(ARSurveyActivity.this,(View)overlay.getParent());
    handler.postDelayed(this,900);
  }};
  private static class Measure{
    Anchor anchor;int rssi,floor;float distance;String room;
    Measure(Anchor a,int r,float d,String room,int floor){
      anchor=a;rssi=r;distance=d;this.room=room;this.floor=floor;
    }
  }
  private int dp(int n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    selfScan=getIntent().getBooleanExtra("self_scan",false);
    claimedArea=Math.max(0,getIntent().getIntExtra("claimed_area_sqm",0));
    floorCount=Math.max(1,Math.min(4,getIntent().getIntExtra("floor_count",1)));
    getWindow().setStatusBarColor(Color.rgb(13,30,57));
    if(checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){
      requestPermissions(new String[]{Manifest.permission.CAMERA},18);return;
    }
    initUI();
  }
  @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] res){
    super.onRequestPermissionsResult(code,permissions,res);
    if(code==18){if(res.length>0&&res[0]==PackageManager.PERMISSION_GRANTED){initUI();resumeAR();}
      else{Toast.makeText(this,"נדרשת הרשאת מצלמה",Toast.LENGTH_LONG).show();finish();}}
  }
  private GradientDrawable color(int c,int radius){
    GradientDrawable d=new GradientDrawable();d.setColor(c);d.setCornerRadius(dp(radius));return d;
  }
  private void initUI(){
    FrameLayout screen=new FrameLayout(this);setContentView(screen);
    gl=new GLSurfaceView(this);gl.setEGLContextClientVersion(2);gl.setPreserveEGLContextOnPause(true);
    gl.setRenderer(this);gl.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    screen.addView(gl,new FrameLayout.LayoutParams(-1,-1));
    overlay=new MarkerOverlay(this);
    screen.addView(overlay,new FrameLayout.LayoutParams(-1,-1));
    LinearLayout top=new LinearLayout(this);top.setOrientation(LinearLayout.VERTICAL);top.setPadding(dp(16),dp(12),dp(16),dp(12));
    top.setBackground(color(0xD90D1E39,16));
    FrameLayout.LayoutParams tl=new FrameLayout.LayoutParams(-1,-2,Gravity.TOP);tl.setMargins(dp(9),dp(12),dp(9),0);screen.addView(top,tl);
    TextView title=new TextView(this);title.setText("Bezeq WiFi 360  /  AR");
    if(selfScan)title.setText("Bezeq WiFi 360  /  סריקה עצמית");
    title.setTextSize(20);title.setTextColor(Color.WHITE);title.setTypeface(null,1);title.setGravity(Gravity.RIGHT);top.addView(title);
    info=new TextView(this);
    info.setText(selfScan?"שלב 1: סמן את הנתב • שלב 2: הסתובב עם הטלפון":"מציאות רבודה • עוקב אחר תנועת הטכנאי");
    info.setTextSize(12);info.setTextColor(0xFFADD0EC);info.setGravity(Gravity.RIGHT);top.addView(info);
    customerQuality=new TextView(this);customerQuality.setText("מתחיל לבדוק...");
    customerQuality.setTextSize(27);customerQuality.setTypeface(null,1);customerQuality.setGravity(Gravity.RIGHT);
    customerQuality.setTextColor(0xFF20DCB7);top.addView(customerQuality);
    signalMeter=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
    signalMeter.setMax(100);signalMeter.setProgress(0);
    signalMeter.setProgressTintList(ColorStateList.valueOf(0xFF23D7BB));
    signalMeter.setProgressBackgroundTintList(ColorStateList.valueOf(0xFF264C70));
    LinearLayout.LayoutParams meterP=new LinearLayout.LayoutParams(-1,dp(13));meterP.setMargins(0,dp(8),0,dp(8));top.addView(signalMeter,meterP);
    trend=new TextView(this);trend.setText("עוצמת האות מתעדכנת בזמן התנועה");
    trend.setTextSize(13);trend.setTextColor(0xFFB6D8EB);trend.setGravity(Gravity.RIGHT);top.addView(trend);
    needExtender=new TextView(this);needExtender.setText("מדוד לפחות 3 נקודות");
    needExtender.setTextSize(16);needExtender.setTypeface(null,1);needExtender.setGravity(Gravity.CENTER);
    needExtender.setTextColor(0xFF93F2DC);needExtender.setPadding(dp(8),dp(12),dp(8),dp(12));
    needExtender.setBackground(color(0xFF145247,14));
    LinearLayout.LayoutParams stateLp=new LinearLayout.LayoutParams(-1,-2);
    stateLp.setMargins(0,dp(7),0,dp(6));top.addView(needExtender,stateLp);
    pointCounter=new TextView(this);pointCounter.setText("נקודות מדודות: 0");
    pointCounter.setTextSize(12);pointCounter.setTextColor(0xFFB3D9F0);pointCounter.setGravity(Gravity.RIGHT);top.addView(pointCounter);
    summary=new TextView(this);
    summary.setText(selfScan?"סריקה עצמית • המדידות נשמרות לבד תוך כדי הליכה":"1. סמן נתב   2. סרוק חדרים   3. סיים לקבלת המלצה");
    summary.setTextColor(Color.WHITE);summary.setTextSize(12);summary.setGravity(Gravity.RIGHT);top.addView(summary);
    LinearLayout controls=new LinearLayout(this);controls.setOrientation(LinearLayout.VERTICAL);
    controls.setPadding(dp(9),dp(10),dp(9),dp(10));controls.setBackground(color(0xEF10233B,18));
    FrameLayout.LayoutParams bl=new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM);
    bl.setMargins(dp(9),0,dp(9),dp(11));screen.addView(controls,bl);
    Button finishButton=btn(selfScan?"סיים סריקת הבית • קבל דוח והמלצה":"סיום סריקה  ·  סיכום ציוד ומיקומים",0xFF059F91);
    controls.addView(finishButton,new LinearLayout.LayoutParams(-1,dp(54)));
    finishButton.setOnClickListener(v->showReport());
    LinearLayout bottom=new LinearLayout(this);bottom.setOrientation(LinearLayout.HORIZONTAL);
    bottom.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
    LinearLayout.LayoutParams bottomP=new LinearLayout.LayoutParams(-1,dp(51));bottomP.topMargin=dp(7);controls.addView(bottom,bottomP);
    Button routerButton=btn("◉ סמן נתב",0xFF155FD2);bottom.addView(routerButton,new LinearLayout.LayoutParams(0,-1,1));
    Button sampleButton=btn(selfScan?"🏠  שנה חדר":"+ מדוד חדר",0xFF087EAD);
    LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(0,-1,1);sp.setMargins(dp(6),0,dp(6),0);bottom.addView(sampleButton,sp);
    Button exit=btn("חזרה",0xFF354761);bottom.addView(exit,new LinearLayout.LayoutParams(0,-1,.60f));
    routerButton.setOnClickListener(v->{markRouter=true;sceneStatus="מסמן עוגן נתב במרכז המסך...";});
    roomButton=sampleButton;
    sampleButton.setOnClickListener(v->{
      if(selfScan)chooseRoom();else promptMeasure();
    });
    if(selfScan&&floorCount>1){
      floorButton=btn("קומה 1 / "+floorCount,0xFF185C93);
      controls.addView(floorButton,new LinearLayout.LayoutParams(-1,dp(44)));
      floorButton.setOnClickListener(v->{
        currentFloor=currentFloor>=floorCount?1:currentFloor+1;
        currentRoom="אזור ראשי";
        lastAutoPose=null;lastAutoAt=0;
        floorButton.setText("קומה "+currentFloor+" / "+floorCount);
        Toast.makeText(this,"קומה "+currentFloor+" — המדידות יישמרו לקומה זו",Toast.LENGTH_LONG).show();
      });
    }
    exit.setOnClickListener(v->finish());
  }
  private Button btn(String value,int c){
    Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextSize(13);b.setTextColor(Color.WHITE);b.setBackground(color(c,11));return b;
  }
  private void chooseRoom(){
    EditText name=new EditText(this);name.setSingleLine(true);
    name.setText(currentRoom);name.setSelectAllOnFocus(true);
    name.setHint("לדוגמה: סלון / חדר שינה / מסדרון");
    LinearLayout parent=new LinearLayout(this);
    parent.setPadding(dp(16),0,dp(16),0);
    parent.addView(name,new LinearLayout.LayoutParams(-1,-2));
    new AlertDialog.Builder(this).setTitle("איזה חדר אתה סורק כעת?")
      .setMessage("המדידה תימשך אוטומטית. בחר שם חדר חדש במעבר בין חדרים.")
      .setView(parent)
      .setPositiveButton("המשך סריקה",(d,w)->{
        String t=name.getText().toString().trim();
        if(!t.isEmpty())currentRoom=t;
        lastAutoPose=null;lastAutoAt=0;
      })
      .setNegativeButton("ביטול",null).show();
  }
  private void autoCapture(Camera camera){
    if(!selfScan||router==null||camera.getTrackingState()!=TrackingState.TRACKING)return;
    if(router.getTrackingState()!=TrackingState.TRACKING)return;
    if(marks.size()>=130)return;
    Pose pose=camera.getPose();
    long now=android.os.SystemClock.elapsedRealtime();
    if(now-lastAutoAt<4000)return;
    if(lastAutoPose!=null&&dist(pose,lastAutoPose)<1.65f)return;
    int r=readRssi();
    if(!SignalQuality.valid(r))return;
    Anchor anchor=ar.createAnchor(pose);
    float d=dist(pose,router.getPose());
    String label=currentRoom;
    int index=marks.size()+1;
    marks.add(new Measure(anchor,r,d,label,currentFloor));
    saveARPoint(r,d,index,label);
    lastAutoAt=now;lastAutoPose=pose;
    if(index%3==0)handler.post(()->summary.setText("נסרקו "+index+" נקודות • "+label+
        " • קומה "+currentFloor+" • המשך ללכת לחדר הבא"));
  }
  private void promptMeasure(){
    if(router==null){Toast.makeText(this,"סמן תחילה את מיקום הנתב",Toast.LENGTH_LONG).show();return;}
    EditText name=new EditText(this);name.setSingleLine(true);
    name.setHint("לדוגמה: מסדרון / חדר שינה / סלון");
    name.setText("חדר "+(marks.size()+1));
    name.setSelectAllOnFocus(true);
    LinearLayout box=new LinearLayout(this);box.setPadding(dp(18),dp(6),dp(18),0);box.addView(name,new LinearLayout.LayoutParams(-1,-2));
    new AlertDialog.Builder(this).setTitle("באיזה חדר אתה מודד?")
      .setMessage("תן שם לחדר כדי שבסיום נוכל להמליץ היכן להתקין ציוד.")
      .setView(box).setPositiveButton("שמור מדידה",(d,w)->{
        captureRoom=name.getText().toString().trim();
        if(captureRoom.isEmpty())captureRoom="נקודה "+(marks.size()+1);
        capture=true;sceneStatus="מודד קליטה בחדר: "+captureRoom;
      }).setNegativeButton("ביטול",null).show();
  }
  private ArrayList<Measure> samplesFromMeasurements(){
    synchronized(sessionLock){return new ArrayList<>(marks);}
  }
  private String reportText(){
    if(selfScan){
      ArrayList<HomeScanAdvisor.Sample> samples=new ArrayList<>();
      for(Measure m:samplesFromMeasurements()){
        Pose pos=m.anchor.getPose();
        samples.add(new HomeScanAdvisor.Sample(m.room,m.floor,m.rssi,
          pos.tx(),pos.ty(),pos.tz(),m.distance));
      }
      return HomeScanAdvisor.evaluate(samples,claimedArea,floorCount).text;
    }
    ArrayList<Measure> samples;
    synchronized(sessionLock){samples=new ArrayList<>(marks);}
    StringBuilder b=new StringBuilder("Bezeq WiFi 360 | סיכום סריקת כיסוי\n");
    b.append("CREATED BY HEN DAYAN\n\n");
    b.append("נקודות שנמדדו: ").append(samples.size()).append("\n");
    if(samples.size()<3){
      b.append("אין עדיין די מדידות להצעת ציוד. מדוד לפחות שלוש נקודות: ליד הנתב, באמצע ובחדר המרוחק.");
      return b.toString();
    }
    LinkedHashSet<String> weakRooms=new LinkedHashSet<>();
    ArrayList<Measure> candidates=new ArrayList<>();
    for(Measure m:samples){
      if(!SignalQuality.valid(m.rssi))continue;
      if(m.rssi<-72)weakRooms.add(m.room);
      if(m.rssi>=-63&&m.rssi<=-50&&m.distance>=1.5f)candidates.add(m);
    }
    b.append("\nמצב החדרים:\n");
    for(Measure m:samples){
      b.append("• ").append(m.room).append(" — ").append(SignalQuality.name(m.rssi));
      b.append(" (מרחק AR משוער ").append(String.format(Locale.US,"%.1f",m.distance)).append(" מטר)\n");
    }
    if(weakRooms.isEmpty()){
      b.append("\nלא נמצאו נקודות קליטה חלשות בסריקה. אין כרגע הצדקה לקבוע שנדרש ציוד נוסף. ");
      b.append("מומלץ לאמת מהירות ויציבות בחדרים.");
      return b.toString();
    }
    b.append("\nנמצא צורך לבדוק שיפור קליטה בחדרים: ");
    for(String room:weakRooms)b.append(room).append(" • ");
    b.append("\n");
    if(candidates.isEmpty()){
      b.append("\nציוד: טרם ניתן לקבוע כמות או מיקום אמינים. ");
      b.append("יש למדוד נקודת ביניים נוספת שבה הקליטה מהנתב טובה, או לבדוק נקודת גישה בחיבור קווי.");
    }else{
      Measure best=candidates.get(0);
      for(Measure m:candidates)if(m.rssi<best.rssi)best=m;
      int quantity=weakRooms.size()>=2 && candidates.size()>=2?2:1;
      b.append("\nהצעת ציוד ראשונית: ");
      if(quantity==1)b.append("יחידת Mesh / מגדיל טווח אחת לניסוי.\n");
      else b.append("1–2 יחידות Mesh לניסוי, בכפוף למפת הבית ולבדיקת התקנה.\n");
      b.append("נקודת התחלה מומלצת: ").append(best.room).append(" (קליטה ").append(SignalQuality.name(best.rssi)).append(").\n");
      if(quantity==2)b.append("מיקום יחידה נוספת ייקבע רק לאחר בדיקת הכיסוי עם היחידה הראשונה.\n");
      b.append("לא מתקינים מגדיל באזור האדום; הוא חייב לקלוט אות טוב מהנתב.\n");
    }
    b.append("\nהסיכום מבוסס על עוצמת אות ועל מרחק AR משוער, לא על מפת RF מלאה. ");
    b.append("לפני מכירת ציוד יש לאמת גם מהירות, יציבות ותשתית קווית, ולמדוד שוב אחרי התקנה.");
    return b.toString();
  }
  private void showReport(){
    String report=AppLanguage.tr(this,reportText());
    if(selfScan)getSharedPreferences("home_scan",MODE_PRIVATE).edit()
      .putString("last_report",report).putLong("report_timestamp",System.currentTimeMillis()).apply();
    TextView content=new TextView(this);content.setText(report);content.setTextSize(16);
    content.setTextColor(0xFFEEF7FF);content.setPadding(dp(18),dp(18),dp(18),dp(18));
    content.setBackgroundColor(0xFF102942);content.setTextDirection(View.TEXT_DIRECTION_RTL);
    android.widget.ScrollView scroll=new android.widget.ScrollView(this);scroll.addView(content);
    new AlertDialog.Builder(this).setTitle(selfScan?
        "דוח כיסוי הבית והמלצות ציוד":"סיכום סריקה • הצעת ציוד ללקוח")
      .setView(scroll)
      .setPositiveButton("שתף סיכום",(d,w)->{
        Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT,report);
        startActivity(Intent.createChooser(send,"שליחת סיכום ללקוח"));
      })
      .setNeutralButton("סיים",(d,w)->finish())
      .setNegativeButton("המשך סריקה",null).show();
  }
  private int readRssi(){
    try{WifiManager wifi=(WifiManager)getApplicationContext().getSystemService(Context.WIFI_SERVICE);
      return wifi.getConnectionInfo().getRssi();}catch(Exception e){return 0;}
  }
  @Override protected void onResume(){
    super.onResume();resumeAR();
  }
  private void resumeAR(){
    if(gl==null)return;
    try{
      if(ar==null){
        ArCoreApk.InstallStatus install=ArCoreApk.getInstance().requestInstall(this,true);
        if(install==ArCoreApk.InstallStatus.INSTALL_REQUESTED){sceneStatus="נדרשת התקנת שירות ARCore";return;}
        ar=new Session(this);
      }
      synchronized(sessionLock){ar.resume();}
      gl.onResume();
      handler.post(update);
    }catch(Exception e){
      Toast.makeText(this,"ARCore לא זמין במכשיר או נדרשת התקנה: "+e.getMessage(),Toast.LENGTH_LONG).show();
      sceneStatus="ARCore אינו זמין. נסה במכשיר תומך.";
    }
  }
  @Override protected void onPause(){
    handler.removeCallbacks(update);
    if(gl!=null)gl.onPause();
    synchronized(sessionLock){if(ar!=null)ar.pause();}
    super.onPause();
  }
  @Override protected void onDestroy(){
    synchronized(sessionLock){for(Measure m:marks)m.anchor.detach();marks.clear();
      if(router!=null)router.detach();if(ar!=null)ar.close();ar=null;}
    super.onDestroy();
  }
  private FloatBuffer floats(float[] vals){
    FloatBuffer b=ByteBuffer.allocateDirect(vals.length*4).order(ByteOrder.nativeOrder()).asFloatBuffer();
    b.put(vals);b.position(0);return b;
  }
  private int shader(int type,String code){
    int s=GLES20.glCreateShader(type);GLES20.glShaderSource(s,code);GLES20.glCompileShader(s);return s;
  }
  @Override public void onSurfaceCreated(GL10 gl10,EGLConfig cfg){
    int[] ids=new int[1];GLES20.glGenTextures(1,ids,0);camTexture=ids[0];
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,camTexture);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_MIN_FILTER,GLES20.GL_LINEAR);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_MAG_FILTER,GLES20.GL_LINEAR);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_WRAP_S,GLES20.GL_CLAMP_TO_EDGE);
    GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,GLES20.GL_TEXTURE_WRAP_T,GLES20.GL_CLAMP_TO_EDGE);
    String vs="attribute vec2 aPosition; attribute vec2 aTexCoord; varying vec2 vTex; void main(){gl_Position=vec4(aPosition,0.0,1.0);vTex=aTexCoord;}";
    String fs="#extension GL_OES_EGL_image_external : require\nprecision mediump float; varying vec2 vTex; uniform samplerExternalOES uTexture; void main(){gl_FragColor=texture2D(uTexture,vTex);}";
    program=GLES20.glCreateProgram();GLES20.glAttachShader(program,shader(GLES20.GL_VERTEX_SHADER,vs));
    GLES20.glAttachShader(program,shader(GLES20.GL_FRAGMENT_SHADER,fs));GLES20.glLinkProgram(program);
    positionLoc=GLES20.glGetAttribLocation(program,"aPosition");
    texLoc=GLES20.glGetAttribLocation(program,"aTexCoord");
    textureLoc=GLES20.glGetUniformLocation(program,"uTexture");
    positions=floats(quad);uvs=floats(tex);
    GLES20.glClearColor(0.05f,.12f,.22f,1);
  }
  @Override public void onSurfaceChanged(GL10 gl10,int w,int h){
    width=w;height=h;GLES20.glViewport(0,0,w,h);
  }
  @Override public void onDrawFrame(GL10 gl10){
    GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT|GLES20.GL_DEPTH_BUFFER_BIT);
    synchronized(sessionLock){
      if(ar==null||width<1||height<1)return;
      try{
        ar.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(),width,height);
        ar.setCameraTextureName(camTexture);
        Frame frame=ar.update();
        FloatBuffer in=floats(quad),out=floats(new float[8]);
        frame.transformCoordinates2d(Coordinates2d.OPENGL_NORMALIZED_DEVICE_COORDINATES,in,Coordinates2d.TEXTURE_NORMALIZED,out);
        out.position(0);uvs=out;drawCamera();
        Camera camera=frame.getCamera();
        if(camera.getTrackingState()!=TrackingState.TRACKING){sceneStatus="ממתין למעקב מצלמה יציב — הזז את הטלפון באיטיות";return;}
        sceneStatus="מעקב AR פעיל • שמורות "+marks.size()+" נקודות";
        if(markRouter){
          markRouter=false;
          Anchor a=anchorAtCenter(frame,camera);
          if(router!=null)router.detach();router=a;routerRssi=readRssi();
          lastAutoPose=null;lastAutoAt=0;
          handler.post(()->summary.setText(selfScan?
            "הנתב סומן. התרחק והסתובב בבית • המדידות נאספות אוטומטית.":
            "מיקום הנתב סומן. עבור לחדרים ושמור מדידות."));
        }
        if(capture){
          capture=false;
          if(router==null){handler.post(()->Toast.makeText(this,"יש לסמן קודם את הנתב",Toast.LENGTH_SHORT).show());}
          else{
            Anchor a=ar.createAnchor(camera.getPose());
            int r=readRssi();float distance=dist(a.getPose(),router.getPose());
            int index=marks.size()+1;
            String room=captureRoom.isEmpty()?"נקודה "+index:captureRoom;
            marks.add(new Measure(a,r,distance,room,currentFloor));
            saveARPoint(r,distance,index,room);
            final String msg=String.format(Locale.US,"נקודה %d • קליטה %s • מרחק משוער %.1f מ׳",marks.size(),SignalQuality.name(r),distance);
            final String recommendation=arRecommendation();
            handler.post(()->summary.setText(msg+"\n"+recommendation));
          }
        }
        if(selfScan)autoCapture(camera);
        camera.getProjectionMatrix(projection,0,.1f,100f);camera.getViewMatrix(view,0);
        ArrayList<Marker> visible=new ArrayList<>();
        if(router!=null&&router.getTrackingState()==TrackingState.TRACKING){Marker m=screenPoint(router.getPose(),-999,"נתב",false);if(m!=null)visible.add(m);}
        boolean hasWeak=false;for(Measure item:marks)if(SignalQuality.valid(item.rssi)&&item.rssi<-72)hasWeak=true;
        for(Measure m:marks)if(m.anchor.getTrackingState()==TrackingState.TRACKING){
          boolean candidate=hasWeak&&m.rssi>=-63&&m.rssi<=-50&&m.distance>=1.5f;
          Marker outMark=screenPoint(m.anchor.getPose(),m.rssi,m.room,candidate);
          if(outMark!=null)visible.add(outMark);
        }
        overlay.setMarkers(visible);
      }catch(Exception e){sceneStatus="מעקב AR: "+e.getClass().getSimpleName();}
    }
  }
  private Anchor anchorAtCenter(Frame frame,Camera camera){
    try{
      List<HitResult> hits=frame.hitTest(width/2f,height/2f);
      for(HitResult h:hits){
        if(h.getTrackable() instanceof Plane){
          Plane p=(Plane)h.getTrackable();if(p.isPoseInPolygon(h.getHitPose()))return h.createAnchor();
        }
        if(h.getTrackable() instanceof Point)return h.createAnchor();
      }
    }catch(Exception ignored){}
    // No hit-test surface: the position is only an approximation along the camera ray.
    return ar.createAnchor(camera.getPose().compose(Pose.makeTranslation(0,0,-1.25f)));
  }
  private void saveARPoint(int rssi,float distance,int index,String room){
    try{
      SharedPreferences prefs=getSharedPreferences("prolink_field",Context.MODE_PRIVATE);
      JSONArray items=new JSONArray(prefs.getString("points","[]"));
      JSONObject p=new JSONObject();
      p.put("kind","signal");
      if(selfScan)p.put("self_scan",true);
      p.put("floor",currentFloor);
      p.put("claimed_area_sqm",claimedArea);
      p.put("room",room);
      p.put("rssi",rssi);p.put("distance_m",Math.round(distance*10f)/10.0);
      p.put("timestamp",System.currentTimeMillis());
      p.put("after",false);p.put("wired",false);
      p.put("cloud_session",selfScan?"":CloudSync.session(this));
      p.put("cloud_id",java.util.UUID.randomUUID().toString());
      p.put("cloud_synced",false);
      items.put(p);
      prefs.edit().putString("points",items.toString()).apply();
      if(!selfScan&&CloudSync.connected(this)){
        new Thread(()->{try{CloudSync.sendPending(this);}catch(Exception ignored){}},
          "ar-cloud-sync").start();
      }
    }catch(Exception e){android.util.Log.e("PROLINK_AR","Could not save AR point",e);}
  }
  private String arRecommendation(){
    if(marks.size()<3)return "המשך למדוד לפחות 3 נקודות מהנתב לכיוון החדר החלש. המרחק הוא רק הערכת מצלמה.";
    Measure candidate=null;boolean weak=false;
    for(Measure m:marks){
      if(!SignalQuality.valid(m.rssi))continue;
      if(m.rssi<-72)weak=true;
      if(m.rssi>=-63&&m.rssi<=-50&&m.distance>=1.5f&&
         (candidate==null||m.rssi<candidate.rssi))candidate=m;
    }
    if(!weak)return "אין כרגע נקודה חלשה במדידות. מומלץ לבדוק מהירות בחדרי הקצה לפני רכישת ציוד.";
    if(candidate==null)return "● אין נקודת התקנה מתאימה למגדיל אלחוטי. חפש נקודת ביניים קרובה יותר לנתב, או בדוק כבל רשת.";
    int index=marks.indexOf(candidate)+1;
    return String.format(Locale.US,
      "● מועמד להתקנה בניסוי: %s (מרחק AR משוער %.1f מ׳). אמת מהירות ויציבות לאחר התקנה.",candidate.room,candidate.distance);
  }
  private float dist(Pose a,Pose b){float x=a.tx()-b.tx(),y=a.ty()-b.ty(),z=a.tz()-b.tz();return (float)Math.sqrt(x*x+y*y+z*z);}
  private void drawCamera(){
    GLES20.glDisable(GLES20.GL_DEPTH_TEST);GLES20.glUseProgram(program);
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0);GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES,camTexture);
    GLES20.glUniform1i(textureLoc,0);positions.position(0);uvs.position(0);
    GLES20.glEnableVertexAttribArray(positionLoc);GLES20.glEnableVertexAttribArray(texLoc);
    GLES20.glVertexAttribPointer(positionLoc,2,GLES20.GL_FLOAT,false,0,positions);
    GLES20.glVertexAttribPointer(texLoc,2,GLES20.GL_FLOAT,false,0,uvs);
    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP,0,4);
    GLES20.glDisableVertexAttribArray(positionLoc);GLES20.glDisableVertexAttribArray(texLoc);
  }
  private static class Marker {
    float x,y;int rssi;String name;boolean candidate;
    Marker(float x,float y,int r,String name,boolean candidate){
      this.x=x;this.y=y;this.rssi=r;this.name=name;this.candidate=candidate;
    }
  }
  private Marker screenPoint(Pose pose,int rssi,String name,boolean candidate){
    vector[0]=pose.tx();vector[1]=pose.ty();vector[2]=pose.tz();vector[3]=1;
    Matrix.multiplyMV(eye,0,view,0,vector,0);Matrix.multiplyMV(clip,0,projection,0,eye,0);
    if(clip[3]<=0)return null;
    float x=(clip[0]/clip[3]+1)*width/2;
    float y=(1-clip[1]/clip[3])*height/2;
    if(x<0||y<0||x>width||y>height)return null;
    return new Marker(x,y,rssi,AppLanguage.tr(this,name),candidate);
  }
  private final class MarkerOverlay extends View {
    private volatile List<Marker> visible=new ArrayList<>();
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
    private final Bitmap routerPhoto;
    private final Bitmap extenderPhoto;
    MarkerOverlay(Context context) {
      super(context);
      setLayerType(View.LAYER_TYPE_SOFTWARE,null);
      routerPhoto=BitmapFactory.decodeResource(getResources(),R.drawable.ar_router);
      extenderPhoto=BitmapFactory.decodeResource(getResources(),R.drawable.ar_extender);
    }
    void setMarkers(List<Marker> points){visible=points;postInvalidate();}
    private void device(Canvas canvas,float cx,float cy,Bitmap photo,int tone,boolean chosen){
      float width=dp(chosen?86:99),height=dp(chosen?105:102);
      RectF panel=new RectF(cx-width/2-dp(9),cy-height/2-dp(10),cx+width/2+dp(9),cy+height/2+dp(9));
      paint.clearShadowLayer();paint.setStyle(Paint.Style.FILL);
      paint.setColor(0xBC071B34);paint.setShadowLayer(dp(17),0,dp(7),0xBB000000);
      canvas.drawRoundRect(panel,dp(18),dp(18),paint);
      paint.clearShadowLayer();
      paint.setColor(tone);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(3));
      canvas.drawRoundRect(panel,dp(18),dp(18),paint);paint.setStyle(Paint.Style.FILL);
      paint.setColor(0xFFFFffff);
      RectF imageRect=new RectF(cx-width*.43f,cy-height*.43f,cx+width*.43f,cy+height*.43f);
      if(photo!=null){
        float scale=Math.min(imageRect.width()/photo.getWidth(),imageRect.height()/photo.getHeight());
        float photoW=photo.getWidth()*scale,photoH=photo.getHeight()*scale;
        RectF dst=new RectF(cx-photoW/2,cy-photoH/2,cx+photoW/2,cy+photoH/2);
        canvas.drawBitmap(photo,null,dst,paint);
      }
      paint.setColor(tone);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(2));
      canvas.drawArc(new RectF(cx-dp(34),panel.bottom-dp(19),cx+dp(34),panel.bottom+dp(9)),12,155,false,paint);
      paint.setStyle(Paint.Style.FILL);
    }
    private void label(Canvas canvas,String label,float x,float y,int tone){
      paint.setTextAlign(Paint.Align.CENTER);paint.setTypeface(android.graphics.Typeface.create("sans-serif",android.graphics.Typeface.BOLD));paint.setTextSize(dp(13));
      float textWidth=paint.measureText(label);
      float half=Math.min(textWidth/2+dp(12),getWidth()*.45f);
      x=Math.max(half+dp(3),Math.min(getWidth()-half-dp(3),x));
      paint.setColor(0xF0081F39);
      canvas.drawRoundRect(x-half,y-dp(21),x+half,y+dp(8),dp(11),dp(11),paint);
      paint.setColor(tone);canvas.drawText(label,x,y,paint);
    }
    @Override protected void onDraw(Canvas canvas){
      super.onDraw(canvas);
      float sx=getWidth()/(float)Math.max(1,width);
      float sy=getHeight()/(float)Math.max(1,height);
      for(Marker point:visible){
        float x=point.x*sx,y=point.y*sy;
        boolean isRouter=point.rssi==-999;
        int tone=isRouter?0xFF36D9FF:point.candidate?0xFF13F1BC:SignalQuality.color(point.rssi);
        if(isRouter||point.candidate){
          // Actual transparent product photos instead of circular AR dots.
          device(canvas,x,y,isRouter?routerPhoto:extenderPhoto,tone,point.candidate);
          label(canvas,isRouter?AppLanguage.tr(ARSurveyActivity.this,"נתב ראשי"):
           AppLanguage.tr(ARSurveyActivity.this,"מיקום מוצע למגדיל")+" • "+point.name,x,y-dp(69),tone);
        }else{
          // Signal-only measurement: a compact readable chip, never a misleading device icon.
          String note=point.name+" • "+AppLanguage.tr(ARSurveyActivity.this,SignalQuality.name(point.rssi));
          label(canvas,note,x,y-dp(4),tone);
          paint.setColor(tone);canvas.drawRoundRect(x-dp(3),y+dp(9),x+dp(3),y+dp(24),dp(3),dp(3),paint);
        }
      }
      paint.setColor(0xFF1CDCF7);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(2));
      canvas.drawCircle(getWidth()/2f,getHeight()/2f,dp(23),paint);
      canvas.drawLine(getWidth()/2f-dp(7),getHeight()/2f,getWidth()/2f+dp(7),getHeight()/2f,paint);
      canvas.drawLine(getWidth()/2f,getHeight()/2f-dp(7),getWidth()/2f,getHeight()/2f+dp(7),paint);
      paint.setStyle(Paint.Style.FILL);
    }
  }
}
