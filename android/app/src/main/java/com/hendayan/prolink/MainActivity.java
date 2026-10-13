package com.hendayan.prolink;

import android.Manifest;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.text.InputType;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class MainActivity extends Activity {
  private static final int NAVY=Color.rgb(13,30,57), BLUE=Color.rgb(26,105,220), CYAN=Color.rgb(4,160,187);
  private static final int LIGHT=Color.rgb(7,19,36), SUB=Color.rgb(169,195,219), GREEN=Color.rgb(21,213,165);
  private final Handler ui=new Handler(Looper.getMainLooper());
  private LinearLayout root,main,tests,history,guide,cloud;
  private TextView wifiText,resultsText,statusText,historyText,adviceText,cloudStatus;
  private Button testButton;
  private SpeedGaugeView speedGauge;
  private TextView speedValue;
  private TextView signalChip;
  private final Button[] tabs=new Button[4];
  private EditText cloudTech,cloudCustomer,cloudPassword;
  private EditText room;
  private Switch after,wired;
  private JSONObject lastTest;
  private JSONArray points=new JSONArray();
  private boolean busy=false;
  private SharedPreferences prefs;
  private final Runnable refresh=new Runnable(){@Override public void run(){
    updateWifi();
    if(root!=null)AppLanguage.translateTree(MainActivity.this,root);
    ui.postDelayed(this,2200);
  }};
  private int dp(float n){return Math.round(getResources().getDisplayMetrics().density*n);}
  private GradientDrawable bg(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
  @Override public void onCreate(Bundle b){
    super.onCreate(b);getWindow().setStatusBarColor(NAVY);getWindow().setNavigationBarColor(NAVY);
    prefs=getSharedPreferences("prolink_field",MODE_PRIVATE);
    try{points=new JSONArray(prefs.getString("points","[]"));}catch(Exception ignored){}
    askPermissions();build();
    UpdateManager.check(this,false);
  }
  private void askPermissions(){
    java.util.ArrayList<String> request=new java.util.ArrayList<>();
    for(String p:new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.CAMERA}){
      if(checkSelfPermission(p)!=PackageManager.PERMISSION_GRANTED)request.add(p);
    }
    if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.NEARBY_WIFI_DEVICES)!=PackageManager.PERMISSION_GRANTED)
      request.add(Manifest.permission.NEARBY_WIFI_DEVICES);
    if(!request.isEmpty())requestPermissions(request.toArray(new String[0]),7);
  }
  private TextView text(String value,int size,int color,boolean bold){
    TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);
    t.setGravity(Gravity.RIGHT);t.setTextDirection(View.TEXT_DIRECTION_RTL);
    if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
    return t;
  }
  private LinearLayout column(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);l.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);return l;}
  private void pad(View v,int n){v.setPadding(dp(n),dp(n),dp(n),dp(n));}
  private void gap(LinearLayout p,int n){View v=new View(this);p.addView(v,new LinearLayout.LayoutParams(1,dp(n)));}
  private void section(LinearLayout p,String title,String subtitle){
    TextView h=text(title,22,Color.WHITE,true);p.addView(h);
    if(subtitle!=null){TextView t=text(subtitle,13,SUB,false);p.addView(t);}
    gap(p,12);
  }
  private GradientDrawable cardBg(){
    GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
      new int[]{Color.rgb(17,45,76),Color.rgb(10,30,54)});
    d.setCornerRadius(dp(20));d.setStroke(dp(1),Color.rgb(40,83,125));return d;
  }
  private LinearLayout card(LinearLayout parent){
    LinearLayout l=column();l.setBackground(cardBg());pad(l,17);
    LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.bottomMargin=dp(14);
    parent.addView(l,lp);return l;
  }
  private Button button(String label,int color){
    Button b=new Button(this);b.setText(label);b.setTextColor(Color.WHITE);b.setTextSize(14);b.setAllCaps(false);b.setBackground(bg(color,13));return b;
  }
  private EditText field(String hint){
    EditText e=new EditText(this);e.setHint(hint);e.setSingleLine(true);e.setTextSize(15);e.setTextDirection(View.TEXT_DIRECTION_RTL);
    e.setBackground(bg(Color.rgb(9,27,50),10));e.setTextColor(Color.WHITE);e.setHintTextColor(SUB);pad(e,10);return e;
  }
  private void build(){
    ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setBackgroundColor(LIGHT);
    root=column();root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);scroll.addView(root);
    setContentView(scroll);
    LinearLayout head=column();head.setBackground(bg(NAVY,0));pad(head,22);root.addView(head);
    LinearLayout brandRow=new LinearLayout(this);
    brandRow.setOrientation(LinearLayout.HORIZONTAL);brandRow.setGravity(Gravity.CENTER_VERTICAL);
    brandRow.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
    ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.ic_prolink);
    logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
    brandRow.addView(logo,new LinearLayout.LayoutParams(dp(55),dp(55)));
    TextView brand=text("Bezeq WiFi 360",28,Color.WHITE,true);
    brand.setGravity(Gravity.CENTER_VERTICAL);
    brand.setTextDirection(View.TEXT_DIRECTION_LTR);
    LinearLayout.LayoutParams brandParams=new LinearLayout.LayoutParams(-2,dp(55));brandParams.leftMargin=dp(12);
    brandRow.addView(brand,brandParams);head.addView(brandRow);
    TextView tagline=text("Smart Home Network Diagnostics  •  CREATED BY HEN DAYAN",11,Color.rgb(133,216,248),false);head.addView(tagline);
    gap(head,12);
    TextView heading=text("כיסוי Wi-Fi ביתי מלא • בדיקת רשת מקצועית",19,Color.WHITE,true);head.addView(heading);
    Button langs=button("🌐  Language / שפה",NAVY);
    head.addView(langs,new LinearLayout.LayoutParams(-1,dp(42)));
    langs.setOnClickListener(v->AppLanguage.choose(this));
    gap(head,9);
    Button checkUpdates=button("↻ בדוק עדכונים לאפליקציה",CYAN);
    head.addView(checkUpdates,new LinearLayout.LayoutParams(-1,dp(43)));
    checkUpdates.setOnClickListener(v->UpdateManager.check(this,true));
    gap(head,10);
    TextView wifiNotice=text("לפני תחילת בדיקה יש להתחבר לרשת ה־Wi-Fi הביתית של הלקוח.",15,Color.WHITE,true);
    wifiNotice.setBackground(bg(0xFF125A7D,14));
    pad(wifiNotice,13);head.addView(wifiNotice);
    gap(head,8);
    Button wifiTutorial=button("📶  לא יודעים להתחבר? מדריך מפורט עם תמונות",0xFF17689B);
    wifiTutorial.setTextSize(15);
    head.addView(wifiTutorial,new LinearLayout.LayoutParams(-1,dp(52)));
    wifiTutorial.setOnClickListener(v->openWifiHelp());
    gap(head,10);
    Button homeScan=button("🏠  סריקת הבית בעצמך • ללא טכנאי",0xFF0E9E93);
    homeScan.setTextSize(17);
    head.addView(homeScan,new LinearLayout.LayoutParams(-1,dp(57)));
    homeScan.setOnClickListener(v->startSelfScan());
    gap(head,7);
    Button lastReport=button("דוח סריקת הבית האחרון",NAVY);
    head.addView(lastReport,new LinearLayout.LayoutParams(-1,dp(42)));
    lastReport.setOnClickListener(v->showLatestHomeReport());
    gap(head,9);
    LinearLayout nav=new LinearLayout(this);nav.setOrientation(LinearLayout.HORIZONTAL);nav.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
    pad(nav,7);root.addView(nav);
    String[] labels={"מהירות","מדידות","מיקום AR","שיתוף"};
    for(int i=0;i<4;i++){final int k=i;Button b=button(labels[i],i==0?BLUE:NAVY);
      LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(0,dp(47),1);bp.setMargins(dp(3),0,dp(3),0);nav.addView(b,bp);tabs[i]=b;b.setOnClickListener(v->showPane(k));}
    main=column();pad(main,15);root.addView(main);
    tests=column();pad(tests,15);root.addView(tests);
    history=column();pad(history,15);root.addView(history);
    guide=column();pad(guide,15);root.addView(guide);
    cloud=column();pad(cloud,15);root.addView(cloud);
    buildSpeed();buildMeasurements();buildGuide();buildCloud();showPane(0);
    AppLanguage.translateTree(this,root);
    gap(root,14);
    TextView footer=text("© 2026 HEN DAYAN · ALL RIGHTS RESERVED",11,SUB,false);footer.setGravity(Gravity.CENTER);root.addView(footer);gap(root,22);
  }
  private void buildSpeed(){
    section(main,"SpeedTest PRO","המהירות המרבית שנמדדה בפועל • בחירת שרת אוטומטית • 4 חיבורים במקביל");
    LinearLayout overview=card(main);TextView sub=text("ממשק רשת ומצב קליטה",16,Color.WHITE,true);overview.addView(sub);gap(overview,6);
    signalChip=text("מאתר איכות קליטה...",19,GREEN,true);pad(signalChip,12);signalChip.setBackground(bg(0xFFE9F7F0,12));overview.addView(signalChip);gap(overview,8);
    wifiText=text("בודק חיבור...",13,SUB,false);overview.addView(wifiText);gap(overview,7);
    overview.addView(text("🟢 טובה / מצוינת     🟡 בינונית     🔴 חלשה",12,SUB,false));
    LinearLayout big=card(main);TextView h=text("בדיקת מהירות • מד מקצועי",16,Color.WHITE,true);big.addView(h);
    speedGauge=new SpeedGaugeView(this);
    big.addView(speedGauge,new LinearLayout.LayoutParams(-1,dp(215)));
    // Numeric readout lives outside the gauge canvas; never touches the needle.
    LinearLayout readout=new LinearLayout(this);
    readout.setOrientation(LinearLayout.HORIZONTAL);
    readout.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
    readout.setGravity(Gravity.CENTER);
    big.addView(readout,new LinearLayout.LayoutParams(-1,dp(64)));
    speedValue=text("0.0",44,Color.WHITE,true);
    speedValue.setGravity(Gravity.CENTER);
    speedValue.setTextDirection(View.TEXT_DIRECTION_LTR);
    readout.addView(speedValue,new LinearLayout.LayoutParams(-2,-1));
    TextView mbps=text("Mbps",19,Color.rgb(45,213,244),true);
    mbps.setGravity(Gravity.CENTER_VERTICAL);
    mbps.setTextDirection(View.TEXT_DIRECTION_LTR);
    LinearLayout.LayoutParams unitLayout=new LinearLayout.LayoutParams(-2,-1);
    unitLayout.leftMargin=dp(9);
    readout.addView(mbps,unitLayout);
    speedGauge.setSpeedListener(value->speedValue.setText(String.format(Locale.US,"%.1f",value)));
    TextView speedCaption=text("מהירות הורדה • מדידה חיה",13,SUB,false);
    speedCaption.setGravity(Gravity.CENTER);
    big.addView(speedCaption);
    gap(big,12);
    resultsText=text("שיא מאומת: — Mbps",17,CYAN,true);big.addView(resultsText);gap(big,8);
    TextView explanation=text("שיא = התוצאה הגבוהה ביותר מתוך סבבי מדידה שהושלמו. התוצאה המייצגת מוצגת בנפרד.",12,SUB,false);big.addView(explanation);
    LinearLayout run=card(main);testButton=button("התחל בדיקת מהירות מלאה",BLUE);run.addView(testButton);
    statusText=text("מוכן למדידה • נתונים אמת בלבד",13,SUB,false);gap(run,9);run.addView(statusText);
    testButton.setOnClickListener(v->runSpeed());
    LinearLayout details=card(main);TextView title=text("תוצאות מפורטות",17,Color.WHITE,true);details.addView(title);gap(details,8);
    TextView info=text("תוצאה מייצגת / Upload / HTTP Ping / Jitter / שרת בדיקה יופיעו לאחר מדידה.",14,SUB,false);details.addView(info);
    resultsText.setTag(info);
  }
  private void buildMeasurements(){
    section(tests,"מפת מדידות הבית","תעד מדידה ליד הנתב, בנקודת ביניים ובחדרים מרוחקים");
    LinearLayout f=card(tests);room=field("שם החדר, לדוגמה: מסדרון");f.addView(room);gap(f,10);
    after=new Switch(this);after.setText("בדיקת אחרי התקנת הציוד");after.setTextSize(15);after.setTextColor(Color.WHITE);f.addView(after);
    wired=new Switch(this);wired.setText("קיימת אפשרות להעביר כבל רשת");wired.setTextSize(15);wired.setTextColor(Color.WHITE);f.addView(wired);
    gap(f,10);
    Button save=button("שמור נקודה עם המדידה האחרונה",CYAN);f.addView(save);save.setOnClickListener(v->savePoint());
    LinearLayout list=card(tests);historyText=text("טרם נשמרו נקודות",14,SUB,false);list.addView(historyText);
    LinearLayout actions=card(tests);Button share=button("שתף סיכום בדיקות עם הלקוח",BLUE);actions.addView(share);share.setOnClickListener(v->share());
    gap(actions,9);Button clear=button("מחיקת מדידות מקומיות",NAVY);actions.addView(clear);clear.setOnClickListener(v->new android.app.AlertDialog.Builder(this).setTitle("מחיקת כל המדידות?")
       .setMessage("מחיקה תסיר את המדידות המקומיות ולא ניתן יהיה לשחזר באמצעותן מידע שנמחק מן הענן.")
       .setPositiveButton("מחק",(d,w)->{points=new JSONArray();prefs.edit().remove("points").apply();drawHistory();})
       .setNegativeButton("ביטול",null).show());
    drawHistory();
  }
  private void buildGuide(){
    section(guide,"סיור מצלמה ומיקום ציוד","AR במכשירים תומכים • ניטור קליטה תוך מעבר בין חדרים");
    LinearLayout c=card(guide);
    adviceText=text("למיקום מקצועי: בדוק תחילה ליד הנתב, אחר כך במסדרון, ולבסוף בחדר הרחוק.",15,Color.WHITE,false);c.addView(adviceText);
    gap(c,12);Button launch=button("פתח סיור מציאות רבודה",BLUE);c.addView(launch);
    launch.setOnClickListener(v->{if(requireHomeWifi(false))startActivity(new Intent(this,ARSurveyActivity.class));});
    gap(c,10);
    Button scanForCustomer=button("סריקת בית אוטומטית ללקוח",0xFF0E9E93);
    c.addView(scanForCustomer);
    scanForCustomer.setOnClickListener(v->startSelfScan());
    LinearLayout caution=card(guide);
    caution.addView(text("הסימון המרחבי הוא הערכה מבוססת מצלמה ומעקב ARCore, ולא מדידת RF תלת־ממדית. נקודת ההתקנה נקבעת לפי מדידות בפועל וכיול.",13,SUB,false));
    recommend();
  }
  private void showLatestHomeReport(){
    String report=getSharedPreferences("home_scan",MODE_PRIVATE).getString("last_report","");
    if(report.isEmpty()){
      new android.app.AlertDialog.Builder(this).setTitle("עדיין אין דוח סריקה")
        .setMessage("בצע סריקה עצמית ולחץ על סיום סריקה כדי ליצור דוח.")
        .setPositiveButton("סגור",null).show();
      return;
    }
    TextView txt=text(report,15,Color.WHITE,false);pad(txt,18);
    ScrollView sc=new ScrollView(this);sc.addView(txt);
    new android.app.AlertDialog.Builder(this,android.app.AlertDialog.THEME_DEVICE_DEFAULT_DARK)
      .setTitle("דוח סריקת הבית האחרון")
      .setView(sc)
      .setPositiveButton("שתף דוח",(d,w)->{
        Intent share=new Intent(Intent.ACTION_SEND);
        share.setType("text/plain");share.putExtra(Intent.EXTRA_TEXT,report);
        startActivity(Intent.createChooser(share,"שליחת דוח כיסוי"));
      }).setNegativeButton("סגור",null).show();
  }
  private boolean hasConnectedNetwork(boolean allowWired){
    try{
      ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
      if(cm==null)return false;
      for(Network network:cm.getAllNetworks()){
        NetworkCapabilities caps=cm.getNetworkCapabilities(network);
        if(caps==null)continue;
        if(caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI))return true;
        if(allowWired&&caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))return true;
      }
    }catch(Exception ignored){}
    return false;
  }
  private void openWifiHelp(){
    startActivity(new Intent(this,WifiHelpActivity.class));
  }
  private boolean requireHomeWifi(boolean allowWired){
    if(hasConnectedNetwork(allowWired))return true;
    String note="יש להתחבר לרשת ה־Wi-Fi הביתית על מנת לבצע בדיקה.\n"+
      "ודא שהטלפון מחובר לרשת הביתית של הלקוח ולא לאינטרנט הסלולרי.";
    if(allowWired)note+="\nלבדיקת מהירות אפשר להשתמש גם במתאם USB-C ל־RJ45 עם חיבור Ethernet פעיל.";
    new android.app.AlertDialog.Builder(this,android.app.AlertDialog.THEME_DEVICE_DEFAULT_DARK)
      .setTitle("נדרש חיבור לרשת הביתית")
      .setMessage(AppLanguage.tr(this,note))
      .setPositiveButton(AppLanguage.tr(this,"מדריך חיבור עם תמונות"),(dialog,which)->openWifiHelp())
      .setNeutralButton(AppLanguage.tr(this,"פתח הגדרות Wi-Fi"),(dialog,which)->{
        Intent settings=new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS);
        startActivity(settings);
      })
      .setNegativeButton(AppLanguage.tr(this,"ביטול"),null).show();
    return false;
  }
  private void startSelfScan(){
    if(!requireHomeWifi(false))return;
    LinearLayout layout=column();
    layout.setPadding(dp(22),dp(10),dp(22),0);
    TextView description=text("אפשר לסרוק את הבית בלי טכנאי. ציין גודל משוער וקומות, "
        +"התחבר ל-Wi-Fi, ואז סמן את הנתב והסתובב בבית. המצלמה אינה מודדת מ״ר במדויק.",14,Color.WHITE,false);
    layout.addView(description);
    gap(layout,12);
    TextView sqmTitle=text("שטח הבית במ״ר (משוער, לא חובה)",14,Color.WHITE,true);
    layout.addView(sqmTitle);
    EditText sqm=new EditText(this);
    sqm.setSingleLine(true);sqm.setTextColor(Color.WHITE);sqm.setHint("לדוגמה: 100");
    sqm.setHintTextColor(SUB);sqm.setInputType(InputType.TYPE_CLASS_NUMBER);
    sqm.setBackground(bg(Color.rgb(16,40,67),12));pad(sqm,12);
    layout.addView(sqm,new LinearLayout.LayoutParams(-1,dp(51)));
    gap(layout,10);
    layout.addView(text("מספר קומות לסריקה",14,Color.WHITE,true));
    Spinner floors=new Spinner(this);
    String[] choices={"קומה אחת","2 קומות","3 קומות","4 קומות"};
    ArrayAdapter<String> adapter=new ArrayAdapter<>(this,android.R.layout.simple_spinner_item,choices);
    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
    floors.setAdapter(adapter);layout.addView(floors);
    new android.app.AlertDialog.Builder(this,android.app.AlertDialog.THEME_DEVICE_DEFAULT_DARK)
      .setTitle("סריקת Wi-Fi עצמית לבית")
      .setView(layout)
      .setPositiveButton("התחל לסרוק",(dialog,which)->{
        int area=0;
        try{area=Math.max(0,Math.min(2000,Integer.parseInt(sqm.getText().toString().trim())));}
        catch(Exception ignored){}
        Intent i=new Intent(this,ARSurveyActivity.class);
        i.putExtra("self_scan",true);i.putExtra("claimed_area_sqm",area);
        i.putExtra("floor_count",floors.getSelectedItemPosition()+1);
        startActivity(i);
      }).setNegativeButton("ביטול",null).show();
  }
  private void showPane(int which){
    main.setVisibility(which==0?View.VISIBLE:View.GONE);
    tests.setVisibility(which==1?View.VISIBLE:View.GONE);
    guide.setVisibility(which==2?View.VISIBLE:View.GONE);
    cloud.setVisibility(which==3?View.VISIBLE:View.GONE);
    for(int i=0;i<tabs.length;i++)if(tabs[i]!=null)tabs[i].setBackground(bg(i==which?BLUE:NAVY,13));
  }
  private void buildCloud(){
    section(cloud,"שיתוף פשוט עם הלקוח","רוצים שהלקוח יראה את הבדיקות בלייב? פותחים ביקור ושולחים לו קישור צפייה.");
    LinearLayout overview=card(cloud);
    cloudStatus=text(CloudSync.connected(this)?"ביקור ענן פעיל • מוכן לשידור":"עדיין לא נפתח ביקור בענן",16,Color.WHITE,true);
    overview.addView(cloudStatus);gap(overview,6);
    overview.addView(text("שרת: "+CloudSync.SERVER+"\nהמדידות נשמרות מקומית גם בלי חיבור. כשיש אינטרנט אפשר לשדר מחדש.",12,SUB,false));
    LinearLayout entry=card(cloud);
    entry.addView(text("1. צור קישור צפייה ללקוח",18,Color.WHITE,true));gap(entry,8);
    cloudTech=field("שם הטכנאי");entry.addView(cloudTech);gap(entry,8);
    cloudTech.setText(CloudSync.technician(this));
    cloudCustomer=field("תיאור הלקוח (ללא מידע אישי מיותר)");entry.addView(cloudCustomer);gap(entry,8);
    cloudPassword=field(CloudSync.hasSavedCode(this)?"קוד הטכנאי כבר שמור, אפשר להשאיר ריק":"קוד טכנאי (נדרש רק בפעם הראשונה)");
    cloudPassword.setInputType(129);entry.addView(cloudPassword);gap(entry,8);
    entry.addView(text("קוד הטכנאי נשמר בהצפנה במכשיר. לא מציגים אותו ללקוח.",12,SUB,false));gap(entry,9);
    Button newVisit=button("פתח ביקור ויצור קישור ללקוח",BLUE);entry.addView(newVisit);
    newVisit.setOnClickListener(v->createCloudSession());
    LinearLayout actions=card(cloud);
    actions.addView(text("2. המדידות נשלחות אוטומטית. במקרה של ניתוק:",14,SUB,false));gap(actions,8);
    Button resend=button("נסה שוב לשלוח מדידות",CYAN);actions.addView(resend);resend.setOnClickListener(v->syncCloudNow());
    gap(actions,9);
    Button shareLink=button("שלח ללקוח קישור צפייה חי",BLUE);actions.addView(shareLink);shareLink.setOnClickListener(v->shareLiveLink());
    gap(actions,9);
    Button dashboard=button("פתח ממשק טכנאי בענן",NAVY);actions.addView(dashboard);
    dashboard.setOnClickListener(v->startActivity(new Intent(Intent.ACTION_VIEW,android.net.Uri.parse(CloudSync.SERVER+"/tech"))));
    cloud.addView(text("כל ביקור מקבל קישור צפייה ייחודי לקריאה בלבד. התחלה של ביקור חדש לא מוחקת מדידות מקומיות של ביקורים קודמים.",12,SUB,false));
  }
  private void createCloudSession(){
    String code=cloudPassword.getText().toString().trim();
    if(code.isEmpty()&&!CloudSync.hasSavedCode(this)){cloudPassword.setError("מזינים קוד טכנאי רק פעם אחת");return;}
    cloudStatus.setText("יוצר ביקור בענן ומוודא הרשאה...");
    String tech=cloudTech.getText().toString(),client=cloudCustomer.getText().toString();
    new Thread(()->{
      try{
        CloudSync.create(this,code,tech,client);
        ui.post(()->{cloudPassword.setText("");cloudStatus.setText("● ביקור פעיל • נוצר קישור אישי ללקוח");Toast.makeText(this,"נוצר ביקור מסונכרן. יש לשמור נקודות חדשות בביקור הזה.",Toast.LENGTH_LONG).show();});
      }catch(Exception e){ui.post(()->{cloudStatus.setText("יצירת ביקור נכשלה: "+e.getMessage());});}
    },"cloud-create").start();
  }
  private void syncCloudNow(){
    if(!CloudSync.connected(this)){cloudStatus.setText("יש לפתוח ביקור חדש בענן תחילה");return;}
    cloudStatus.setText("מסנכרן מדידות ממתינות...");
    new Thread(()->{
      try{int n=CloudSync.sendPending(this);ui.post(()->{cloudStatus.setText("● סנכרון הושלם • "+n+" מדידות נשלחו");try{points=new JSONArray(prefs.getString("points","[]"));}catch(Exception ignored){}drawHistory();});}
      catch(Exception e){ui.post(()->cloudStatus.setText("סנכרון ממתין: "+e.getMessage()));}
    },"cloud-sync").start();
  }
  private void shareLiveLink(){
    String url=CloudSync.viewer(this);
    if(url.isEmpty()){cloudStatus.setText("יש לפתוח ביקור כדי ליצור קישור לקוח");return;}
    Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");
    send.putExtra(Intent.EXTRA_TEXT,"Bezeq WiFi 360 — צפייה בתוצאות בדיקת הרשת בזמן אמת:\n"+url);
    startActivity(Intent.createChooser(send,"שליחת קישור צפייה ללקוח"));
  }
  private void updateWifi(){
    if(wifiText==null)return;
    try{
      ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
      String kind="לא זוהה Wi-Fi / Ethernet";int rssi=999,link=-1,freq=-1;
      for(Network n:cm.getAllNetworks()){
        NetworkCapabilities cap=cm.getNetworkCapabilities(n);if(cap==null)continue;
        if(cap.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)){kind="Ethernet / חיבור קווי";continue;}
        if(cap.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)){
          kind="Wi-Fi";
          WifiInfo wi=null;
          if(Build.VERSION.SDK_INT>=31&&cap.getTransportInfo() instanceof WifiInfo)wi=(WifiInfo)cap.getTransportInfo();
          if(wi==null)wi=((WifiManager)getApplicationContext().getSystemService(Context.WIFI_SERVICE)).getConnectionInfo();
          if(wi!=null){rssi=wi.getRssi();link=wi.getLinkSpeed();freq=wi.getFrequency();}
        }
      }
      if(link>0)kind+=" • מהירות קישור "+link+" Mbps (לא מהירות אינטרנט)";
      if(freq>0)kind+=" • "+(freq>=5925?"6GHz":freq>=4900?"5GHz":"2.4GHz");
      wifiText.setText(AppLanguage.tr(this,kind));
      if(signalChip!=null){
        if(kind.startsWith("Ethernet")){signalChip.setText("● חיבור קווי פעיל");signalChip.setTextColor(GREEN);signalChip.setBackground(bg(0xFFE9F7F0,12));}
        else if(SignalQuality.valid(rssi)){signalChip.setText("● איכות קליטה: "+SignalQuality.name(rssi)+"\n"+SignalQuality.customerDescription(rssi));signalChip.setTextColor(SignalQuality.color(rssi));signalChip.setBackground(bg(rssi>=-65?0xFFE9F7F0:rssi>=-72?0xFFFFF6DF:0xFFFFEDF0,12));}
        else{signalChip.setText("● איכות הקליטה אינה זמינה");signalChip.setTextColor(SUB);signalChip.setBackground(bg(0xFFF0F2F5,12));}
      }
    }catch(Exception e){wifiText.setText("נדרשת הרשאת גישה לנתוני Wi-Fi");}
  }
  private void runSpeed(){
    if(!requireHomeWifi(true))return;
    if(busy)return;busy=true;testButton.setEnabled(false);statusText.setText("מתחיל...");speedGauge.reset();speedGauge.loading("מחבר שרתים ומודד...");
    new Thread(()->{
      try{
        SpeedEngine engine=new SpeedEngine((ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE));
        JSONObject result=engine.run(msg->ui.post(()->{
          statusText.setText(msg);
          if(msg.startsWith("הורדה ")){
            try{java.util.regex.Matcher m=java.util.regex.Pattern.compile(": ([0-9.]+) Mbps").matcher(msg);
              if(m.find()){speedGauge.setValue(Float.parseFloat(m.group(1)));speedGauge.loading("סבב הורדה פעיל");}
            }catch(Exception ignored){}
          }
        }));
        lastTest=result;ui.post(()->{
          resultsText.setText("שיא מאומת: "+result.optString("downloadPeak","—")+" Mbps");
          speedGauge.finish((float)result.optDouble("downloadPeak",0));
          TextView info=(TextView)resultsText.getTag();
          info.setText("תוצאה מייצגת: "+result.optString("downloadTypical")+" Mbps\nהעלאה: "+result.optString("uploadPeak")+" Mbps\nHTTP Ping: "+result.optString("latency")+" ms  •  Jitter: "+result.optString("jitter")+" ms\nשרת הורדה: "+result.optString("downServer")+"\nשרת העלאה: "+result.optString("upServer")+"\nרשת: "+result.optString("transport")+"\nשיטת בדיקה: 3 סבבי הורדה מרובי זרמים");
          statusText.setText("הבדיקה הושלמה ונשמרה בזיכרון. שמור מדידה בשם חדר.");
        });
      }catch(Exception e){ui.post(()->{statusText.setText("הבדיקה נכשלה: "+e.getMessage());speedGauge.loading("בדיקת מהירות לא הושלמה");Toast.makeText(this,e.getMessage(),Toast.LENGTH_LONG).show();});}
      finally{ui.post(()->{busy=false;testButton.setEnabled(true);});}
    },"speedtest").start();
  }
  private int currentRssi(){
    try{WifiManager w=(WifiManager)getApplicationContext().getSystemService(Context.WIFI_SERVICE);return w.getConnectionInfo().getRssi();}catch(Exception e){return 0;}
  }
  private void savePoint(){
    String label=room.getText().toString().trim();
    if(label.isEmpty()){room.setError("שם החדר נדרש");return;}
    if(lastTest==null){Toast.makeText(this,"יש לבצע בדיקת מהירות אמיתית לפני שמירה",Toast.LENGTH_LONG).show();return;}
    try{
      JSONObject p=new JSONObject(lastTest.toString());p.put("room",label);p.put("rssi",currentRssi());
      p.put("after",after.isChecked());p.put("wired",wired.isChecked());
      p.put("cloud_session",CloudSync.session(this));p.put("cloud_id",java.util.UUID.randomUUID().toString());
      p.put("cloud_synced",false);
      points.put(p);prefs.edit().putString("points",points.toString()).apply();
      Toast.makeText(this,"המדידה נשמרה: "+label,Toast.LENGTH_SHORT).show();
      room.setText("");drawHistory();recommend();
      if(CloudSync.connected(this))syncCloudNow();
    }catch(Exception e){Toast.makeText(this,"שמירה נכשלה",Toast.LENGTH_SHORT).show();}
  }
  private void drawHistory(){
    if(historyText==null)return;StringBuilder s=new StringBuilder();
    for(int i=points.length()-1;i>=0;i--){
      JSONObject p=points.optJSONObject(i);if(p==null)continue;
      if(CloudSync.connected(this)&&!CloudSync.session(this).equals(p.optString("cloud_session")))continue;
      int rssi=p.optInt("rssi",0);String marker=!SignalQuality.valid(rssi)?"⚪ ":rssi>=-65?"🟢 ":rssi>=-72?"🟡 ":"🔴 ";
      s.append(marker).append(p.optString("room")).append(p.optBoolean("after")?"  •  אחרי":"  •  לפני");
      if("signal".equals(p.optString("kind")))s.append("\nסריקת AR • קליטה בלבד (לא בוצעה בדיקת מהירות)");
      else s.append("\n").append(p.optDouble("downloadPeak")).append(" Mbps ↓  /  ")
           .append(p.optDouble("uploadPeak")).append(" Mbps ↑");
      s.append("  •  קליטה: ").append(SignalQuality.name(p.optInt("rssi"))).append("\n\n");
    }
    historyText.setText(s.length()==0?"טרם נשמרו נקודות":s.toString().trim());
  }
  private void recommend(){
    if(adviceText==null)return;
    int count=0,poor=0;boolean wiredAny=false;
    String candidate="";int candidateRssi=0;double reference=0,candidateSpeed=0;
    for(int i=0;i<points.length();i++){
      JSONObject p=points.optJSONObject(i);if(p==null||p.optBoolean("after"))continue;
      if(CloudSync.connected(this)&&!CloudSync.session(this).equals(p.optString("cloud_session")))continue;
      count++;int r=p.optInt("rssi",0);double speed=p.optDouble("downloadTypical",0);
      if(SignalQuality.valid(r)){
        if(r<-72)poor++;
        // Best possible radio repeater position: near edge of good coverage, NOT inside the dead zone.
        if(r>=-63&&r<=-50&&(candidate.isEmpty()||r<candidateRssi)){
          candidate=p.optString("room");candidateRssi=r;candidateSpeed=speed;
        }
      }
      if(speed>reference)reference=speed;
      if(p.optBoolean("wired"))wiredAny=true;
    }
    if(count<2){adviceText.setText("מדוד ליד הנתב, במסדרון ובחדר המרוחק. אי אפשר לקבוע נקודת התקנה על פי מרחק במטרים בלבד.");return;}
    if(poor==0){adviceText.setText("במדידות הקליטה לא נמצא אזור אדום. בדוק מהירות ויציבות בשעות עומס לפני המלצה על רכישת ציוד. אפשר לשפר מיקום נתב מרכזי וגבוה.");return;}
    if(wiredAny){adviceText.setText("● המלצה: נקודת גישה או Mesh עם חיבור קווי בחדר החלש. כבל רשת עדיף על ממסר אלחוטי כשנקודת ההתקנה רחוקה מדי מהנתב.");return;}
    if(count<3||candidate.isEmpty()){
      adviceText.setText("● האזור המרוחק חלש. אין עדיין נקודת ביניים מתאימה למגדיל אלחוטי. מדוד מקום נוסף בין הנתב לחדר הבעייתי; התקנה באזור אדום לא תפתור את הבעיה.");
      return;
    }
    if(reference>0&&candidateSpeed==0){
      adviceText.setText("● נקודת ביניים אפשרית: "+candidate+". קליטת המקור טובה, אבל עדיין חייבים לבדוק מהירות בפועל בנקודה לפני המלצה ללקוח.");
      return;
    }
    if(reference>0&&candidateSpeed<reference*.35){
      adviceText.setText("● נבדקה נקודת ביניים ב"+candidate+", אבל המהירות שם נמוכה ביחס לייחוס. חפש מקום קרוב יותר לנתב או בדוק כבילה.");
      return;
    }
    adviceText.setText("● נקודת התקנה מומלצת לניסוי: "+candidate+" (קליטה "+SignalQuality.name(candidateRssi)+"). אל תתקין מגדיל באזור אדום: צריך שגם המגדיל עצמו יקבל אות מספיק חזק מהנתב. בדוק אחרי ההתקנה מהירות ויציבות בחדר היעד.");
  }
  private void share(){
    if(points.length()==0){Toast.makeText(this,"אין מדידות לשיתוף",Toast.LENGTH_SHORT).show();return;}
    StringBuilder s=new StringBuilder("Bezeq WiFi 360 — דו״ח מדידה\nCreated by HEN DAYAN\n\n");
    for(int i=0;i<points.length();i++){JSONObject p=points.optJSONObject(i);
      s.append(p.optString("room")).append(" • ").append(p.optBoolean("after")?"אחרי":"לפני")
      .append("\nהורדה ").append(p.optString("downloadPeak")).append(" Mbps, העלאה ").append(p.optString("uploadPeak"))
      .append(" Mbps, קליטה ").append(p.optString("rssi")).append(" dBm, שרת ").append(p.optString("downServer")).append("\n\n");
    }
    Intent send=new Intent(Intent.ACTION_SEND);send.setType("text/plain");send.putExtra(Intent.EXTRA_TEXT,s.toString());
    startActivity(Intent.createChooser(send,"שליחת תוצאות ללקוח"));
  }
  @Override protected void onResume(){super.onResume();ui.post(refresh);
    try{points=new JSONArray(prefs.getString("points","[]"));}catch(Exception ignored){}
    if(historyText!=null)drawHistory();if(adviceText!=null)recommend();
    if(CloudSync.connected(this)){boolean pending=false;
      for(int i=0;i<points.length();i++){JSONObject p=points.optJSONObject(i);
        if(p!=null&&CloudSync.session(this).equals(p.optString("cloud_session"))&&!p.optBoolean("cloud_synced")){pending=true;break;}}
      // Verify the session even when nothing is pending, so volatile cloud storage can be restored from local records.
      if(cloudStatus!=null)syncCloudNow();
    }
  }
  @Override protected void onPause(){ui.removeCallbacks(refresh);super.onPause();}
}
