package com.hendayan.prolink;

import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public final class SpeedEngine {
  public interface Progress { void onProgress(String message); }
  private static final String CF="https://speed.cloudflare.com/__down?bytes=";
  private static final String UP="https://speed.cloudflare.com/__up";
  private static final String[] NAMES={"Cloudflare Edge","Hetzner Germany","OVH Europe"};
  private static final String[] DOWNLOADS={CF,"https://fsn1-speed.hetzner.com/100MB.bin","https://proof.ovh.net/files/100Mb.dat"};
  private final ConnectivityManager cm;
  public SpeedEngine(ConnectivityManager connectivity){cm=connectivity;}

  private Network testedNetwork() throws Exception {
    Network preferred=null;
    Network ethernet=null;
    for(Network n:cm.getAllNetworks()) {
      NetworkCapabilities c=cm.getNetworkCapabilities(n);
      if(c==null || !c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))continue;
      if(c.hasTransport(NetworkCapabilities.TRANSPORT_VPN))continue;
      if(c.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))ethernet=n;
      if(c.hasTransport(NetworkCapabilities.TRANSPORT_WIFI))preferred=n;
    }
    if(ethernet==null&&preferred==null)throw new IllegalStateException("נדרש חיבור Wi-Fi או Ethernet. רשת סלולרית אינה מאושרת למדידה.");
    Network active=cm.getActiveNetwork();
    NetworkCapabilities activeCaps=active==null?null:cm.getNetworkCapabilities(active);
    // A phone VPN can prohibit direct socket binding to underlying Wi-Fi.
    // Keep its default VPN route rather than bypassing the owner's security settings.
    if(activeCaps!=null&&activeCaps.hasTransport(NetworkCapabilities.TRANSPORT_VPN))return null;
    return ethernet!=null?ethernet:preferred;
  }
  private HttpURLConnection conn(Network n,String url) throws Exception {
    HttpURLConnection c=(HttpURLConnection)(n==null?new URL(url).openConnection():n.openConnection(new URL(url)));
    c.setConnectTimeout(5000);c.setReadTimeout(8000);c.setUseCaches(false);
    c.setRequestProperty("Cache-Control","no-cache, no-store");c.setRequestProperty("User-Agent","ProLinkWiFiPRO/1.0");
    return c;
  }
  private static String urlFor(int i,int bytes){
    if(i==0)return CF+bytes+"&r="+System.nanoTime();
    return DOWNLOADS[i]+(DOWNLOADS[i].contains("?")?"&":"?")+"r="+System.nanoTime();
  }
  private long downloadOnce(Network n,int i,int cap) throws Exception {
    HttpURLConnection c=conn(n,urlFor(i,cap));
    long count=0;
    try(InputStream in=c.getInputStream()){
      if(c.getResponseCode()/100!=2)throw new Exception("server HTTP "+c.getResponseCode());
      byte[] buf=new byte[65536];int len;
      while((len=in.read(buf))!=-1 && count<cap)count+=len;
    }finally{c.disconnect();}
    if(count<8192)throw new Exception("No useful data");
    return count;
  }
  public JSONObject run(Progress progress) throws Exception {
    Network n=testedNetwork();
    NetworkCapabilities caps=n==null?null:cm.getNetworkCapabilities(n);
    String transport=caps!=null&&caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)?"Ethernet":n==null?"Wi-Fi/Ethernet via VPN":"Wi-Fi";
    progress.onProgress("בוחר שרתים לפי בדיקות אמיתיות...");
    ArrayList<Integer> valid=new ArrayList<>();ArrayList<Double> probe=new ArrayList<>();
    for(int i=0;i<DOWNLOADS.length;i++){
      long t=System.nanoTime();
      try{long b=downloadOnce(n,i,1024*1024); double seconds=(System.nanoTime()-t)/1e9;
        double mbps=b*8/1e6/Math.max(.001,seconds);
        valid.add(i);probe.add(mbps);
      }catch(Exception e){android.util.Log.w("PROLINK_PROBE", "Server probe failed: "+NAMES[i], e);progress.onProgress(NAMES[i]+": "+e.getClass().getSimpleName()+": "+e.getMessage());}
    }
    if(valid.isEmpty())throw new Exception("לא נמצא שרת נגיש לבדיקת הורדה. בדוק גישה לאינטרנט.");
    int chosen=valid.get(0);double top=0;
    for(int k=0;k<valid.size();k++)if(probe.get(k)>top){top=probe.get(k);chosen=valid.get(k);}
    final int server=chosen;
    progress.onProgress("שרת נבחר: "+NAMES[server]+" • מבצע בדיקות מרובות חיבורים");
    List<Double> down=new ArrayList<>();
    for(int i=0;i<3;i++){
      double d=parallelDown(n,server,4,4500);
      if(d>0)down.add(d);
      progress.onProgress(String.format(Locale.US,"הורדה %d/3: %.1f Mbps",i+1,d));
    }
    if(down.isEmpty())throw new Exception("שרת ההורדה לא השלים מדידה");
    Collections.sort(down);
    double peak=down.get(down.size()-1),typical=down.get(down.size()/2);
    progress.onProgress("מודד העלאה בשרת Cloudflare...");
    List<Double> ups=new ArrayList<>();
    for(int i=0;i<2;i++){double u=upload(n,4*1024*1024);if(u>0)ups.add(u);}
    double up=ups.isEmpty()?0:Collections.max(ups);
    progress.onProgress("בודק זמן תגובה ושינויים בהשהיה...");
    List<Double> pings=new ArrayList<>();
    for(int i=0;i<6;i++){
      long t=System.nanoTime();
      try{downloadOnce(n,server,16384);pings.add((System.nanoTime()-t)/1e6);}catch(Exception ignored){}
    }
    double ping=0,jitter=0;
    if(!pings.isEmpty()){
      for(double p:pings)ping+=p;
      ping/=pings.size();
      for(int i=1;i<pings.size();i++)jitter+=Math.abs(pings.get(i)-pings.get(i-1));
      jitter/=Math.max(1,pings.size()-1);
    }
    JSONObject data=new JSONObject();
    data.put("downloadPeak",Math.round(peak*10)/10.0);
    data.put("downloadTypical",Math.round(typical*10)/10.0);
    data.put("uploadPeak",Math.round(up*10)/10.0);
    data.put("latency",Math.round(ping*10)/10.0);
    data.put("jitter",Math.round(jitter*10)/10.0);
    data.put("downServer",NAMES[server]);
    data.put("upServer","Cloudflare Edge");
    data.put("transport",transport);
    data.put("timestamp",System.currentTimeMillis());
    data.put("method","HTTP throughput • 4 download streams • 3 rounds; peak = highest verified round");
    data.put("verified",true);
    return data;
  }
  private double parallelDown(Network n,int server,int streams,long millis) throws Exception {
    ExecutorService pool=Executors.newFixedThreadPool(streams);
    AtomicLong count=new AtomicLong();
    long st=System.nanoTime(),until=System.currentTimeMillis()+millis;
    List<Future<?>> futures=new ArrayList<>();
    for(int k=0;k<streams;k++)futures.add(pool.submit(()->{
      while(System.currentTimeMillis()<until && !Thread.currentThread().isInterrupted()){
        try{count.addAndGet(downloadOnce(n,server,8*1024*1024));}
        catch(Exception error){break;}
      }
    }));
    pool.shutdown();
    if(!pool.awaitTermination(millis+10000,TimeUnit.MILLISECONDS))pool.shutdownNow();
    for(Future<?> f:futures){try{f.get(1,TimeUnit.SECONDS);}catch(Exception ignored){}}
    double sec=(System.nanoTime()-st)/1e9;
    return count.get()*8/1e6/Math.max(.01,sec);
  }
  private double upload(Network n,int bytes){
    HttpURLConnection c=null;long st=System.nanoTime();
    try{
      c=conn(n,UP+"?r="+System.nanoTime());c.setRequestMethod("POST");c.setDoOutput(true);
      c.setFixedLengthStreamingMode(bytes);c.setRequestProperty("Content-Type","application/octet-stream");
      byte[] chunk=new byte[32768];
      try(OutputStream out=c.getOutputStream()){for(int i=0;i<bytes;i+=chunk.length)out.write(chunk,0,Math.min(chunk.length,bytes-i));}
      if(c.getResponseCode()/100!=2)return 0;
      try(InputStream in=c.getInputStream()){byte[] b=new byte[4096];while(in.read(b)!=-1){}}
      return bytes*8/1e6/Math.max(.001,(System.nanoTime()-st)/1e9);
    }catch(Exception e){return 0;}
    finally{if(c!=null)c.disconnect();}
  }
}
