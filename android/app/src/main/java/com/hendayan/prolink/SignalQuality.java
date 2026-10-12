package com.hendayan.prolink;

import android.graphics.Color;

public final class SignalQuality {
  private SignalQuality(){}
  public static boolean valid(int rssi){return rssi<=-15&&rssi>=-100;}
  public static String name(int rssi){
    if(!valid(rssi))return "אין נתון קליטה";
    if(rssi>=-55)return "מצוינת";
    if(rssi>=-65)return "טובה";
    if(rssi>=-72)return "בינונית";
    if(rssi>=-80)return "חלשה";
    return "חלשה מאוד";
  }
  public static int color(int rssi){
    if(!valid(rssi))return Color.rgb(118,133,151);
    if(rssi>=-65)return Color.rgb(17,165,113);
    if(rssi>=-72)return Color.rgb(224,158,25);
    return Color.rgb(226,65,87);
  }
  public static String repeaterAdvice(int rssi) {
    if(!valid(rssi))return "אי אפשר להעריך התאמה למגדיל בלי נתוני קליטה.";
    if(rssi>=-65)return "הקליטה מתאימה לניסיון מיקום אלחוטי; יש לאמת גם מהירות ויציבות.";
    if(rssi>=-72)return "קליטת המקור גבולית למגדיל; מומלץ לחפש נקודה קרובה יותר לנתב.";
    return "קליטת המקור חלשה מדי להמלצת התקנה אלחוטית כאן. חפש מקום קרוב יותר או השתמש בכבל רשת.";
  }
  public static String customerDescription(int rssi){
    if(!valid(rssi))return "אין מדידה";
    if(rssi>=-55)return "קליטה מצוינת – מתאימה לחיבור מהיר ויציב";
    if(rssi>=-65)return "קליטה טובה – בדרך כלל מתאימה לגלישה רגילה";
    if(rssi>=-72)return "קליטה בינונית – ייתכנו האטות ועומסים";
    return "קליטה חלשה – מומלץ לבדוק שיפור כיסוי";
  }
}
