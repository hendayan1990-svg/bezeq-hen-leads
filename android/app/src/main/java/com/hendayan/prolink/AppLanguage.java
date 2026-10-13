package com.hendayan.prolink;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;
import android.widget.EditText;
import android.content.SharedPreferences;
import java.util.Map;
import java.util.LinkedHashMap;

public final class AppLanguage {
  // Ordered: Hebrew, Arabic, English, Russian, Spanish.
  private static final String[] CODES={"he","ar","en","ru","es"};
  private static final String[] NAMES={"עברית","العربية","English","Русский","Español"};
  private static final Map<String,String[]> WORDS=new LinkedHashMap<>();
  private static void put(String he,String ar,String en,String ru,String es){
    WORDS.put(he,new String[]{he,ar,en,ru,es});
  }
  static {
    put("בדיקת רשת מקצועית","فحص شبكة احترافي","Professional network testing","Профессиональная проверка сети","Prueba profesional de red");
    put("מהירות","السرعة","Speed","Скорость","Velocidad");
    put("מדידות","القياسات","Measurements","Измерения","Mediciones");
    put("מיקום AR","تحديد الموقع AR","AR placement","AR размещение","Ubicación RA");
    put("שיתוף","مشاركة","Sharing","Доступ","Compartir");
    put("בדוק עדכונים לאפליקציה","التحقق من التحديثات","Check for updates","Проверить обновления","Buscar actualizaciones");
    put("ממשק רשת ומצב קליטה","اتصال الشبكة وجودة الإشارة","Network and signal status","Сеть и уровень сигнала","Red y señal");
    put("איכות קליטה","جودة الإشارة","Signal quality","Качество сигнала","Calidad de señal");
    put("מצוינת","ممتازة","Excellent","Отличная","Excelente");
    put("טובה","جيدة","Good","Хорошая","Buena");
    put("בינונית","متوسطة","Fair","Средняя","Regular");
    put("חלשה מאוד","ضعيفة جدا","Very weak","Очень слабая","Muy débil");
    put("חלשה","ضعيفة","Weak","Слабая","Débil");
    put("אין נתון קליטה","لا تتوفر بيانات إشارة","No signal data","Нет данных сигнала","Sin datos de señal");
    put("מהירות הורדה","سرعة التنزيل","Download speed","Скорость загрузки","Velocidad de descarga");
    put("מדידה חיה","قياس مباشر","Live measurement","Измерение в реальном времени","Medición en vivo");
    put("בדיקת מהירות","اختبار السرعة","Speed test","Тест скорости","Prueba de velocidad");
    put("מד מקצועי","مقياس احترافي","Professional gauge","Профессиональный индикатор","Medidor profesional");
    put("שיא מאומת","الذروة المقاسة","Verified peak","Подтвержденный максимум","Pico verificado");
    put("תוצאה מייצגת","نتيجة نموذجية","Typical result","Типичный результат","Resultado típico");
    put("העלאה","رفع","Upload","Отдача","Subida");
    put("שרת הורדה","خادم التنزيل","Download server","Сервер загрузки","Servidor de descarga");
    put("שרת העלאה","خادم الرفع","Upload server","Сервер отдачи","Servidor de subida");
    put("תוצאות מפורטות","نتائج مفصلة","Detailed results","Подробные результаты","Resultados detallados");
    put("התחל בדיקת מהירות מלאה","بدء اختبار السرعة الكامل","Start full speed test","Начать полный тест скорости","Iniciar prueba completa");
    put("מוכן לבדיקה","جاهز للاختبار","Ready to test","Готов к тесту","Listo para probar");
    put("שמור נקודה עם המדידה האחרונה","حفظ النقطة مع آخر قياس","Save point with last measurement","Сохранить точку с последним измерением","Guardar punto con la última medición");
    put("שם החדר, לדוגמה: מסדרון","اسم الغرفة مثلا الممر","Room name, e.g. hallway","Название комнаты, например коридор","Nombre de habitación, p. ej. pasillo");
    put("בדיקת אחרי התקנת הציוד","اختبار بعد تركيب المعدات","After equipment installation","После установки оборудования","Después de instalar equipo");
    put("קיימת אפשרות להעביר כבל רשת","يمكن مد كابل شبكة","Ethernet cable available","Возможна прокладка кабеля Ethernet","Cable Ethernet disponible");
    put("שתף סיכום בדיקות עם הלקוח","مشاركة النتائج مع العميل","Share results with customer","Поделиться результатами с клиентом","Compartir resultados con cliente");
    put("מחיקת מדידות מקומיות","حذف القياسات المحلية","Delete local measurements","Удалить локальные измерения","Eliminar mediciones locales");
    put("טרם נשמרו נקודות","لم تحفظ نقاط بعد","No points saved yet","Точки ещё не сохранены","Aún no hay puntos guardados");
    put("סיור מצלמה ומיקום ציוד","مسح بالكاميرا وتحديد مواقع الأجهزة","Camera survey and equipment placement","Обход с камерой и размещение устройств","Recorrido con cámara y ubicación de equipos");
    put("פתח סיור מציאות רבודה","بدء مسح الواقع المعزز","Start AR coverage survey","Открыть AR-обход","Iniciar recorrido RA");
    put("סיום סריקה","إنهاء المسح","Finish scan","Завершить сканирование","Finalizar escaneo");
    put("סיכום ציוד ומיקומים","ملخص الأجهزة والمواقع","Equipment and placement summary","Итог по оборудованию и размещению","Resumen de equipos y ubicaciones");
    put("סמן נתב","حدد الراوتر","Mark router","Отметить роутер","Marcar router");
    put("מדוד חדר","قياس غرفة","Measure room","Измерить комнату","Medir habitación");
    put("חזרה","رجوع","Back","Назад","Volver");
    put("נקודות מדודות","نقاط مقاسة","Measured points","Измеренные точки","Puntos medidos");
    put("אזורים חלשים","مناطق ضعيفة","Weak areas","Слабые зоны","Zonas débiles");
    put("נדרש שיפור כיסוי","يلزم تحسين التغطية","Coverage improvement needed","Нужно улучшить покрытие","Se necesita mejorar la cobertura");
    put("מיקום מוצע למגדיל","موقع مقترح للمقوي","Suggested extender location","Место для усилителя","Ubicación sugerida para repetidor");
    put("נתב ראשי","الراوتر الرئيسي","Main router","Главный роутер","Router principal");
    put("חדר","غرفة","Room","Комната","Habitación");
    put("סלון","غرفة المعيشة","Living room","Гостиная","Salón");
    put("מסדרון","ممر","Hallway","Коридор","Pasillo");
    put("חדר שינה","غرفة النوم","Bedroom","Спальня","Dormitorio");
    put("שיתוף פשוט עם הלקוח","مشاركة سهلة مع العميل","Simple customer sharing","Простой доступ клиенту","Compartir fácilmente con cliente");
    put("צור קישור צפייה ללקוח","إنشاء رابط عرض للعميل","Create customer viewing link","Создать ссылку клиенту","Crear enlace para cliente");
    put("שם הטכנאי","اسم الفني","Technician name","Имя техника","Nombre del técnico");
    put("קוד טכנאי","رمز الفني","Technician code","Код техника","Código del técnico");
    put("פתח ביקור ויצור קישור ללקוח","فتح زيارة وإنشاء رابط","Create visit and customer link","Создать визит и ссылку","Crear visita y enlace");
    put("נסה שוב לשלוח מדידות","إعادة إرسال القياسات","Retry sending measurements","Повторить отправку измерений","Reintentar envío");
    put("שלח ללקוח קישור צפייה חי","إرسال رابط العرض المباشر","Send live customer link","Отправить онлайн-ссылку","Enviar enlace en vivo");
    put("פתח ממשק טכנאי בענן","فتح واجهة الفني السحابية","Open technician portal","Открыть портал техника","Abrir portal del técnico");
    put("ביטול","إلغاء","Cancel","Отмена","Cancelar");
    put("מחק","حذف","Delete","Удалить","Eliminar");
    put("שתף","مشاركة","Share","Поделиться","Compartir");
    put("יש להתחבר לרשת ה־Wi-Fi הביתית על מנת לבצע בדיקה.","يجب الاتصال بشبكة Wi-Fi المنزلية لإجراء الاختبار.","Connect to the home Wi-Fi network to run a test.","Для проверки подключитесь к домашней сети Wi-Fi.","Conéctate al Wi-Fi de casa para realizar la prueba.");
    put("לפני תחילת בדיקה יש להתחבר לרשת ה־Wi-Fi הביתית של הלקוח.","قبل البدء، اتصل بشبكة Wi-Fi المنزلية للعميل.","Before testing, connect to the customer's home Wi-Fi network.","Перед проверкой подключитесь к домашней сети Wi-Fi клиента.","Antes de probar, conéctate al Wi-Fi del cliente.");
    put("ודא שהטלפון מחובר לרשת הביתית של הלקוח ולא לאינטרנט הסלולרי.","تأكد من اتصال الهاتف بشبكة المنزل وليس ببيانات الهاتف.","Make sure the phone uses the customer's home Wi-Fi, not mobile data.","Убедитесь, что телефон подключён к домашнему Wi-Fi, а не к мобильной сети.","Comprueba que el móvil use el Wi-Fi de casa, no datos móviles.");
    put("לבדיקת מהירות אפשר להשתמש גם במתאם USB-C ל־RJ45 עם חיבור Ethernet פעיל.","يمكن أيضًا قياس السرعة عبر محول USB-C إلى RJ45 واتصال Ethernet.","For speed tests, an active Ethernet connection via a USB-C to RJ45 adapter also works.","Для проверки скорости можно использовать активный Ethernet через адаптер USB-C—RJ45.","La prueba de velocidad también admite Ethernet mediante adaptador USB-C a RJ45.");
    put("לא יודעים להתחבר? מדריך מפורט עם תמונות","لا تعرف كيف تتصل؟ دليل مصور خطوة بخطوة","Need help connecting? Picture guide","Нужна помощь с Wi-Fi? Инструкция с картинками","¿Necesitas ayuda? Guía con imágenes");
    put("מדריך חיבור עם תמונות","دليل اتصال بالصور","Picture connection guide","Инструкция с картинками","Guía de conexión con imágenes");
    put("פתח הגדרות Wi-Fi","فتح إعدادات Wi-Fi","Open Wi-Fi settings","Открыть настройки Wi-Fi","Abrir ajustes Wi-Fi");
    put("ביטול","إلغاء","Cancel","Отмена","Cancelar");
    put("שפה","اللغة","Language","Язык","Idioma");
  }
  private AppLanguage(){}
  private static SharedPreferences settings(Context c){return c.getSharedPreferences("wifi360_lang",Context.MODE_PRIVATE);}
  public static String code(Context c){return settings(c).getString("language","he");}
  public static boolean rtl(Context c){String c0=code(c);return c0.equals("he")||c0.equals("ar");}
  public static void choose(Activity a){
    int current=0;for(int i=0;i<CODES.length;i++)if(CODES[i].equals(code(a)))current=i;
    new AlertDialog.Builder(a).setTitle("Language / שפה").setSingleChoiceItems(NAMES,current,(dialog,selection)->{
      settings(a).edit().putString("language",CODES[selection]).apply();
      dialog.dismiss();a.recreate();
    }).setNegativeButton("Cancel / ביטול",null).show();
  }
  public static String tr(Context ctx,String raw){
    if(raw==null||code(ctx).equals("he"))return raw;
    int index=0;for(int i=0;i<CODES.length;i++)if(CODES[i].equals(code(ctx)))index=i;
    if(index==0)return raw;
    String out=raw;
    // Replace longest-first to avoid matching short words inside larger terms.
    java.util.ArrayList<String> keys=new java.util.ArrayList<>(WORDS.keySet());
    keys.sort((a,b)->Integer.compare(b.length(),a.length()));
    for(String key:keys){
      if(out.contains(key)){
        String replacement=WORDS.get(key)[index];
        out=out.replace(key,replacement);
      }
    }
    return out;
  }
  public static void translateTree(Context ctx,View view){
    int direction=rtl(ctx)?View.LAYOUT_DIRECTION_RTL:View.LAYOUT_DIRECTION_LTR;
    if(view instanceof TextView){
      TextView t=(TextView)view;
      String prior=t.getText().toString();
      if(!prior.isEmpty())t.setText(tr(ctx,prior));
      if(t instanceof EditText){
        EditText e=(EditText)t;
        if(e.getHint()!=null)e.setHint(tr(ctx,e.getHint().toString()));
      }
      t.setTextDirection(rtl(ctx)?View.TEXT_DIRECTION_RTL:View.TEXT_DIRECTION_LTR);
    }
    view.setLayoutDirection(direction);
    if(view instanceof ViewGroup){
      ViewGroup group=(ViewGroup)view;
      for(int i=0;i<group.getChildCount();i++)translateTree(ctx,group.getChildAt(i));
    }
  }
}
