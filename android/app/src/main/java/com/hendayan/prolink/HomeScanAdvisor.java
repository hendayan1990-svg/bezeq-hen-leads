package com.hendayan.prolink;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.HashSet;

/** Advisory only; measured signal, user supplied area and AR distances are different sources. */
public final class HomeScanAdvisor {
  private HomeScanAdvisor(){}
  public static class Sample {
    public final String room;
    public final int floor,rssi;
    public final float x,y,z,distance;
    public Sample(String room,int floor,int rssi,float x,float y,float z,float distance){
      this.room=room;this.floor=floor;this.rssi=rssi;this.x=x;this.y=y;this.z=z;this.distance=distance;
    }
  }
  public static class Recommendation {
    public String text;
    public int preliminaryUnits;
    public boolean insufficient;
    public boolean cablePreferred;
  }
  private static class Zone{
    String name;int floor,count,weak;float x,y,z,mean;double signalSum;
  }
  private static float distance(Zone a,Zone b){
    float dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
    return (float)Math.sqrt(dx*dx+dy*dy+dz*dz);
  }
  public static Recommendation evaluate(List<Sample> samples,int claimedAreaSqm,int floors){
    Recommendation result=new Recommendation();
    StringBuilder out=new StringBuilder();
    out.append("Bezeq WiFi 360\nדו״ח סריקת כיסוי ביתי\n");
    out.append("נוצר על ידי HEN DAYAN • © 2026\n\n");
    out.append("שטח הבית שהוזן: ").append(claimedAreaSqm>0?claimedAreaSqm+" מ״ר":"לא הוזן");
    out.append(" • קומות: ").append(Math.max(1,floors)).append("\n");
    out.append("נקודות קליטה שנאספו: ").append(samples.size()).append("\n");
    Map<String,Zone> zones=new LinkedHashMap<>();
    HashSet<Integer> scannedFloors=new HashSet<>();
    for(Sample sample:samples){
      if(!SignalQuality.valid(sample.rssi))continue;
      String label=(sample.room==null||sample.room.trim().isEmpty())?"אזור ללא שם":sample.room.trim();
      String k=sample.floor+":"+label;
      Zone zone=zones.get(k);
      if(zone==null){zone=new Zone();zone.name=label;zone.floor=sample.floor;zones.put(k,zone);}
      zone.count++;zone.signalSum+=sample.rssi;
      zone.x+=sample.x;zone.y+=sample.y;zone.z+=sample.z;
      if(sample.rssi<=-74)zone.weak++;
      scannedFloors.add(sample.floor);
    }
    ArrayList<Zone> validZones=new ArrayList<>();
    for(Zone z:zones.values()){
      z.mean=(float)(z.signalSum/Math.max(1,z.count));
      z.x/=Math.max(1,z.count);z.y/=Math.max(1,z.count);z.z/=Math.max(1,z.count);
      validZones.add(z);
    }
    out.append("\nמפת איכות קליטה לפי חדר:\n");
    for(Zone z:validZones){
      out.append("• קומה ").append(z.floor).append(", ").append(z.name).append(" — ");
      out.append(SignalQuality.name(Math.round(z.mean))).append(" (").append(z.count).append(" מדידות)\n");
    }
    if(samples.size()<6||validZones.size()<2||scannedFloors.size()<Math.max(1,floors)){
      result.insufficient=true;
      out.append("\nנדרשות עוד מדידות לפני המלצת ציוד: סרוק לפחות שני אזורים, ");
      out.append("לפחות שש נקודות, ואת כל הקומות שציינת. עבור גם ליד הנתב וגם בחדרים המרוחקים.");
      out.append("\n\nמרחקי AR הם הערכה בלבד, ואין להסיק מהם שטח בית מדויק.");
      result.text=out.toString();return result;
    }
    ArrayList<Zone> weakZones=new ArrayList<>();
    for(Zone z:validZones)if(z.count>=2&&z.weak>=2&&z.mean<=-71)weakZones.add(z);
    if(weakZones.isEmpty()){
      out.append("\nלא אובחנה חולשת קליטה עקבית המצדיקה המלצה לרכוש ציוד נוסף.");
      out.append("\nלסיום בדוק מהירות ויציבות בכל חדר לפני קבלת החלטה.");
      result.text=out.toString();return result;
    }
    out.append("\nאזורים שבהם נמדדה חולשה עקבית:\n");
    for(Zone z:weakZones)out.append("• ").append(z.name).append(" (קומה ").append(z.floor).append(")\n");
    // Group nearby weak zones on same floor to avoid selling one repeater per weak room.
    ArrayList<ArrayList<Zone>> clusters=new ArrayList<>();
    for(Zone weak:weakZones){
      ArrayList<Zone> group=null;
      for(ArrayList<Zone> candidate:clusters){
        for(Zone placed:candidate){if(placed.floor==weak.floor&&distance(placed,weak)<7.5f){group=candidate;break;}}
        if(group!=null)break;
      }
      if(group==null){group=new ArrayList<>();clusters.add(group);}
      group.add(weak);
    }
    int supported=0,uncovered=0;
    StringBuilder locations=new StringBuilder();
    for(ArrayList<Zone> cluster:clusters){
      Zone weak=cluster.get(0);
      Zone candidate=null;
      float best=Float.MAX_VALUE;
      for(Zone z:validZones){
        if(z.floor!=weak.floor||z.mean<-65||z.mean>-45||z.count<1)continue;
        if(cluster.contains(z))continue;
        float d=distance(weak,z);
        if(d<best){best=d;candidate=z;}
      }
      if(candidate!=null && best<=11f){
        supported++;
        locations.append("• לניסוי Mesh בקומה ").append(weak.floor).append(": ")
         .append(candidate.name).append(" (קליטה ").append(SignalQuality.name(Math.round(candidate.mean)))
         .append(", מרחק AR משוער ").append(String.format(Locale.US,"%.1f",best))
         .append(" מ׳ מהאזור החלש).\n");
      }else{
        uncovered++;locations.append("• קומה ").append(weak.floor)
          .append(": לא זוהתה נקודת ביניים עם קליטה טובה. ")
          .append("יש לקרב את הנתב, למדוד שוב או להתקין נקודת גישה עם כבל רשת.\n");
      }
    }
    result.preliminaryUnits=Math.min(3,supported);
    result.cablePreferred=uncovered>0;
    out.append("\nציוד מוצע לשלב בדיקה: ");
    out.append(supported==0?"עדיין אי אפשר לקבוע מספר מגדילים אלחוטיים אמין":
      supported>3?"3 יחידות Mesh לפחות לבחינה מקצועית":"עד "+supported+" יחידות Mesh / נקודות גישה לניסוי");
    out.append(".\n");
    if(uncovered>0)out.append("נוסף לכך, ").append(uncovered)
       .append(" אזורים עשויים להצריך כבילה או מדידות נוספות — אין להבטיח פתרון אלחוטי.\n");
    out.append("\nמיקומים מועמדים:\n").append(locations);
    out.append("\nהמלצה זו משוערת ולא מחייבת רכישה. אין לקבוע מספר מגדילים לפי מ״ר או מרחק בלבד.");
    out.append("\nכדי לאשר פתרון בדוק מהירות ויציבות בפועל, תדר Wi-Fi, קירות, עומסים וקליטה אחרי ההתקנה.");
    out.append("\nמעקב AR עשוי לסטות בין חדרים וקומות. שטח הבית הוא נתון שהוזן ולא נמדד במצלמה.");
    result.text=out.toString();return result;
  }
}
