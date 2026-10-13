package com.hendayan.prolink;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class WifiHelpActivity extends Activity {
  private static final int BACKGROUND=0xFF07162A, PANEL=0xFF102B48;
  private static final int BLUE=0xFF29B7F5, WHITE=0xFFF5FAFF, MUTE=0xFFAAC5DC;
  private static final int GREEN=0xFF27DBA8;
  private int lang;
  private LinearLayout root;
  private TextView status;

  private static final int[] PICTURES={
    R.drawable.wifi_guide_01,R.drawable.wifi_guide_02,
    R.drawable.wifi_guide_03,R.drawable.wifi_guide_04,R.drawable.wifi_guide_05
  };
  private static final String[][] TITLES={
    {"פתיחת הגדרות Wi-Fi","فتح إعدادات Wi-Fi","Open Wi-Fi settings","Откройте настройки Wi-Fi","Abre los ajustes de Wi-Fi"},
    {"בחירת הרשת הביתית","اختيار شبكة المنزل","Select the home network","Выберите домашнюю сеть","Selecciona la red de casa"},
    {"הזנת סיסמת הרשת","إدخال كلمة مرور الشبكة","Enter the Wi-Fi password","Введите пароль от Wi-Fi","Introduce la contraseña"},
    {"אימות שהטלפון מחובר","تأكد من اتصال الهاتف","Confirm the connection","Проверьте подключение","Confirma la conexión"},
    {"חזרה לאפליקציה ותחילת בדיקה","العودة للتطبيق وبدء الفحص","Return and start testing","Вернитесь и начните проверку","Vuelve e inicia la prueba"}
  };
  private static final String[][] DESCRIPTIONS={
    {
      "החלק את האצבע פעמיים מראש המסך כלפי מטה. לחץ לחיצה ארוכה על סמל ה־Wi-Fi, או היכנס אל הגדרות > חיבורים > Wi-Fi. הפעל את המתג אם הוא כבוי.",
      "اسحب للأسفل مرتين من أعلى الشاشة. اضغط مطولاً على رمز Wi-Fi أو افتح الإعدادات > الاتصالات > Wi-Fi. شغّل Wi-Fi إذا كان مغلقاً.",
      "Swipe down twice from the top of the screen. Long-press the Wi-Fi icon or open Settings > Connections > Wi-Fi. Turn Wi-Fi on if needed.",
      "Дважды проведите вниз от верхнего края экрана. Удерживайте значок Wi-Fi или откройте Настройки > Подключения > Wi-Fi. Включите Wi-Fi.",
      "Desliza dos veces hacia abajo desde arriba. Mantén pulsado el icono Wi-Fi o ve a Ajustes > Conexiones > Wi-Fi. Actívalo si está apagado."
    },
    {
      "חפש ברשימת הרשתות את שם הרשת הביתית של הלקוח. בדרך כלל הוא רשום על מדבקה בנתב, או שאפשר לבקש מבעל הבית. בחר את הרשת הנכונה — לא רשת אורחים ולא נקודה חמה של טלפון.",
      "ابحث عن اسم شبكة المنزل في القائمة. تجده عادةً على ملصق جهاز التوجيه، أو اسأل صاحب المنزل. اختر الشبكة الصحيحة، وليس شبكة ضيوف أو نقطة اتصال هاتف.",
      "Find the customer's home network name (SSID) in the list. Check the router label or ask the homeowner. Choose the home Wi-Fi, not a guest network or phone hotspot.",
      "Найдите домашнюю сеть клиента в списке. Имя сети (SSID) часто указано на наклейке роутера; также можно спросить хозяина. Не выбирайте гостевую сеть или точку доступа телефона.",
      "Busca el nombre de la red doméstica (SSID). Suele aparecer en la etiqueta del router o puedes preguntarle al dueño. No elijas una red de invitados ni un punto de acceso móvil."
    },
    {
      "אם מופיעה בקשה לסיסמה, הזן את סיסמת ה־Wi-Fi של הבית בדיוק כפי שהיא מופיעה על הנתב או נמסרה לך. שים לב לאותיות גדולות וקטנות ולספרות. לחץ על 'התחבר'. אל תשתף סיסמאות בצילומי מסך.",
      "إذا طُلبت كلمة المرور، أدخل كلمة مرور Wi-Fi المنزلية كما هي على ملصق الجهاز أو كما أعطاها لك صاحب المنزل. انتبه للأحرف والأرقام، ثم اضغط «اتصال». لا تشارك كلمة المرور.",
      "If asked, enter the home Wi-Fi password exactly as printed on the router or provided by the homeowner. Check capitals and digits, then tap Connect. Never share the password in screenshots.",
      "Если потребуется пароль, введите пароль домашнего Wi-Fi с наклейки роутера или полученный от хозяина. Учитывайте регистр букв и цифры, затем нажмите «Подключиться». Не делитесь паролем.",
      "Si te pide una contraseña, introduce la clave Wi-Fi tal como aparece en el router o te la dio el propietario. Respeta mayúsculas y números y pulsa Conectar. No compartas la contraseña."
    },
    {
      "ליד שם הרשת אמור להופיע 'מחובר' או Connected. ודא שזו הרשת הביתית הנכונה. אם מופיע 'מחובר ללא אינטרנט', נסה להתקרב לנתב ובדוק שיש גלישה. אין צורך להפעיל נתונים סלולריים.",
      "يجب أن تظهر كلمة «متصل» بجوار اسم الشبكة. تأكد أنها الشبكة المنزلية الصحيحة. إذا ظهر «متصل بدون إنترنت»، اقترب من جهاز التوجيه وتحقق من الإنترنت. لا تعتمد على بيانات الهاتف.",
      "The network should show Connected. Confirm it's the correct home Wi-Fi. If it says 'Connected without internet', move closer to the router and check internet service. Mobile data doesn't replace home Wi-Fi.",
      "Рядом с сетью должно быть «Подключено». Убедитесь, что это нужная домашняя сеть. Если написано «Без интернета», подойдите ближе к роутеру и проверьте доступ. Мобильные данные не заменяют Wi-Fi.",
      "La red debe mostrar «Conectado». Verifica que sea el Wi-Fi de casa. Si aparece «Conectado sin internet», acércate al router y comprueba la conexión. Los datos móviles no sustituyen al Wi-Fi."
    },
    {
      "חזור ל־Bezeq WiFi 360. בחר 'סריקת הבית בעצמך' כדי לבדוק את כל החדרים, או 'התחל בדיקת מהירות מלאה'. התחל בסמוך לנתב ועבור בהדרגה לחדרים הרחוקים.",
      "ارجع إلى Bezeq WiFi 360. اختر مسح المنزل بنفسك لفحص الغرف، أو ابدأ اختبار السرعة. ابدأ قرب جهاز التوجيه ثم انتقل تدريجياً إلى الغرف البعيدة.",
      "Return to Bezeq WiFi 360. Choose Self-service home scan for room-by-room coverage or Start full speed test. Begin next to the router and gradually move to distant rooms.",
      "Вернитесь в Bezeq WiFi 360. Выберите самостоятельное сканирование дома или полную проверку скорости. Начните возле роутера и постепенно переходите в дальние комнаты.",
      "Regresa a Bezeq WiFi 360. Elige el escaneo de casa para revisar cada habitación o inicia la prueba de velocidad. Empieza junto al router y sigue hacia las habitaciones lejanas."
    }
  };
  private static final String[][] UI={
    {"מדריך חיבור ל־Wi-Fi","دليل الاتصال بشبكة Wi-Fi","How to connect to Wi-Fi","Подключение к Wi-Fi","Cómo conectarse al Wi-Fi"},
    {"5 שלבים פשוטים, עם תמונות","٥ خطوات سهلة بالصور","5 easy steps with pictures","5 простых шагов с иллюстрациями","5 pasos fáciles con imágenes"},
    {"הטלפון מחובר ל־Wi-Fi. ודא שזו הרשת הביתית הנכונה.","الهاتف متصل بشبكة Wi-Fi. تأكد أنها شبكة المنزل الصحيحة.","Wi-Fi is connected. Make sure it's the correct home network.","Wi-Fi подключён. Убедитесь, что выбрана домашняя сеть.","Wi-Fi conectado. Comprueba que sea la red de casa."},
    {"הטלפון אינו מחובר כרגע ל־Wi-Fi.","الهاتف غير متصل حالياً بشبكة Wi-Fi.","This phone is not connected to Wi-Fi yet.","Телефон пока не подключён к Wi-Fi.","El teléfono aún no está conectado al Wi-Fi."},
    {"פתח הגדרות Wi-Fi","افتح إعدادات Wi-Fi","Open Wi-Fi settings","Открыть настройки Wi-Fi","Abrir ajustes Wi-Fi"},
    {"רענן בדיקת חיבור","تحديث حالة الاتصال","Recheck connection","Проверить подключение","Comprobar conexión"},
    {"חזור לאפליקציה","العودة إلى التطبيق","Back to the app","Вернуться в приложение","Volver a la aplicación"},
    {"איורים להמחשה בלבד. מראה התפריטים משתנה בין Samsung, Xiaomi ומכשירי Android אחרים.","الصور للتوضيح فقط. تختلف القوائم بين أجهزة Android.","Illustrations only. Settings may look different on Samsung, Xiaomi and other Android phones.","Иллюстрации примерные. Меню может отличаться на Samsung, Xiaomi и других Android.","Imágenes ilustrativas. Los menús varían entre Samsung, Xiaomi y otros Android."},
    {"אם אינך יודע את הסיסמה: בדוק על מדבקת הנתב או בקש מבעל הבית. אין להזין סיסמה של רשת אחרת.","إذا لم تعرف كلمة المرور، ابحث عنها على جهاز التوجيه أو اسأل صاحب المنزل.","Don't know the password? Check the router's label or ask the homeowner. Don't enter a different network's password.","Не знаете пароль? Посмотрите наклейку роутера или спросите хозяина.","¿No sabes la clave? Mira la etiqueta del router o pregunta al dueño."},
    {"שלב","الخطوة","Step","Шаг","Paso"}
  };
  private String local(int i){return UI[i][lang];}
  private int dp(float n){return Math.round(getResources().getDisplayMetrics().density*n);}
  private GradientDrawable shape(int fill,int radius,int stroke){
    GradientDrawable d=new GradientDrawable();
    d.setColor(fill);d.setCornerRadius(dp(radius));
    if(stroke!=0)d.setStroke(dp(1),stroke);
    return d;
  }
  private TextView label(String text,int size,int color,boolean bold){
    TextView v=new TextView(this);
    v.setText(text);v.setTextColor(color);v.setTextSize(size);
    if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
    v.setTextDirection(lang==0||lang==1?View.TEXT_DIRECTION_RTL:View.TEXT_DIRECTION_LTR);
    v.setGravity(lang==0||lang==1?Gravity.RIGHT:Gravity.LEFT);
    return v;
  }
  private Button button(String name,int color){
    Button b=new Button(this);
    b.setAllCaps(false);b.setText(name);b.setTextSize(16);
    b.setTextColor(WHITE);b.setBackground(shape(color,13,0));
    return b;
  }
  private void pad(View view,int p){view.setPadding(dp(p),dp(p),dp(p),dp(p));}
  private boolean wifiConnected(){
    try{
      ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
      if(cm==null)return false;
      for(Network n:cm.getAllNetworks()){
        NetworkCapabilities c=cm.getNetworkCapabilities(n);
        if(c!=null&&c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI))return true;
      }
    }catch(Exception ignored){}
    return false;
  }
  private void updateStatus(){
    if(status==null)return;
    boolean connected=wifiConnected();
    status.setText(local(connected?2:3));
    status.setTextColor(connected?GREEN:0xFFFFC275);
    status.setBackground(shape(connected?0xFF153F40:0xFF513C2B,14,connected?0xFF226F63:0xFF9A6D42));
    pad(status,15);
  }
  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getWindow().setStatusBarColor(BACKGROUND);
    getWindow().setNavigationBarColor(BACKGROUND);
    String langCode=AppLanguage.code(this);
    lang=langCode.equals("ar")?1:langCode.equals("en")?2:langCode.equals("ru")?3:langCode.equals("es")?4:0;
    build();
  }
  @Override public void onResume(){super.onResume();updateStatus();}
  private void build(){
    boolean rtl=lang==0||lang==1;
    ScrollView scroll=new ScrollView(this);
    scroll.setFillViewport(true);scroll.setBackgroundColor(BACKGROUND);
    root=new LinearLayout(this);
    root.setOrientation(LinearLayout.VERTICAL);
    root.setLayoutDirection(rtl?View.LAYOUT_DIRECTION_RTL:View.LAYOUT_DIRECTION_LTR);
    root.setPadding(dp(16),dp(22),dp(16),dp(32));
    scroll.addView(root);setContentView(scroll);

    LinearLayout hero=new LinearLayout(this);hero.setOrientation(LinearLayout.VERTICAL);
    hero.setBackground(shape(PANEL,20,0xFF315678));pad(hero,20);
    root.addView(hero,new LinearLayout.LayoutParams(-1,-2));
    TextView brand=label("BEZEQ  /  WiFi 360",14,BLUE,true);hero.addView(brand);
    TextView title=label(local(0),25,WHITE,true);
    LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(-1,-2);titleLp.topMargin=dp(13);
    hero.addView(title,titleLp);
    TextView subtitle=label(local(1),14,MUTE,false);
    LinearLayout.LayoutParams subLp=new LinearLayout.LayoutParams(-1,-2);subLp.topMargin=dp(5);
    hero.addView(subtitle,subLp);
    status=label("",15,WHITE,true);
    LinearLayout.LayoutParams statusLp=new LinearLayout.LayoutParams(-1,-2);statusLp.topMargin=dp(15);
    hero.addView(status,statusLp);updateStatus();

    Button settings=button(local(4),0xFF1168CD);
    LinearLayout.LayoutParams settingsLp=new LinearLayout.LayoutParams(-1,dp(53));settingsLp.topMargin=dp(13);
    hero.addView(settings,settingsLp);
    settings.setOnClickListener(v->{
      try{startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS));}
      catch(Exception ignored){startActivity(new Intent(Settings.ACTION_SETTINGS));}
    });
    Button refresh=button(local(5),0xFF174667);
    LinearLayout.LayoutParams refreshLp=new LinearLayout.LayoutParams(-1,dp(44));refreshLp.topMargin=dp(9);
    hero.addView(refresh,refreshLp);refresh.setOnClickListener(v->updateStatus());

    for(int i=0;i<5;i++){
      LinearLayout step=new LinearLayout(this);step.setOrientation(LinearLayout.VERTICAL);
      step.setBackground(shape(PANEL,19,0xFF294766));pad(step,13);
      LinearLayout.LayoutParams cardLp=new LinearLayout.LayoutParams(-1,-2);
      cardLp.topMargin=dp(14);
      root.addView(step,cardLp);
      TextView header=label(local(9)+" "+(i+1)+"  ·  "+TITLES[i][lang],18,WHITE,true);
      step.addView(header);
      ImageView picture=new ImageView(this);
      picture.setImageResource(PICTURES[i]);
      picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
      picture.setAdjustViewBounds(true);
      picture.setContentDescription(TITLES[i][lang]);
      LinearLayout.LayoutParams imageLp=new LinearLayout.LayoutParams(-1,-2);
      imageLp.topMargin=dp(10);
      step.addView(picture,imageLp);
      TextView description=label(DESCRIPTIONS[i][lang],15,MUTE,false);
      description.setLineSpacing(dp(3),1);
      LinearLayout.LayoutParams descriptionLp=new LinearLayout.LayoutParams(-1,-2);
      descriptionLp.topMargin=dp(9);
      step.addView(description,descriptionLp);
    }
    TextView tip=label(local(8),14,0xFFFFD18A,false);
    tip.setBackground(shape(0xFF463B31,15,0xFF766348));pad(tip,15);
    LinearLayout.LayoutParams tipLp=new LinearLayout.LayoutParams(-1,-2);
    tipLp.topMargin=dp(15);root.addView(tip,tipLp);
    TextView caption=label(local(7),12,MUTE,false);
    LinearLayout.LayoutParams capLp=new LinearLayout.LayoutParams(-1,-2);
    capLp.topMargin=dp(15);root.addView(caption,capLp);
    Button finish=button(local(6),0xFF0B967F);
    LinearLayout.LayoutParams finishLp=new LinearLayout.LayoutParams(-1,dp(56));
    finishLp.topMargin=dp(19);root.addView(finish,finishLp);
    finish.setOnClickListener(v->finish());
  }
}
