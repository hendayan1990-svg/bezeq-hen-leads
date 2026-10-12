package com.hendayan.prolink;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;
import java.util.Locale;

public final class SpeedGaugeView extends View {
  private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
  private float shown=0f,limit=100f;
  private boolean testing=false;
  private String label="מוכן לבדיקה";
  private ValueAnimator animator;
  public interface SpeedListener { void onSpeedChanged(float speedMbps); }
  private SpeedListener speedListener;
  public void setSpeedListener(SpeedListener listener){speedListener=listener;}
  private final int blue=Color.rgb(26,105,220),cyan=Color.rgb(13,182,203),navy=Color.rgb(244,250,255);
  public SpeedGaugeView(Context c){super(c);setLayerType(View.LAYER_TYPE_SOFTWARE,null);}
  public void loading(String text){testing=true;label=text;invalidate();}
  public void finish(float value){testing=false;label="מהירות הורדה שנמדדה";setValue(value);}
  public void reset(){if(animator!=null)animator.cancel();testing=false;label="מוכן לבדיקה";shown=0f;limit=100f;if(speedListener!=null)speedListener.onSpeedChanged(0f);invalidate();}
  public void setValue(float value){
    if(!Float.isFinite(value))return;
    float target=Math.max(0,value);
    while(target>limit*.9f)limit*=2;
    if(animator!=null)animator.cancel();
    animator=ValueAnimator.ofFloat(shown,target);
    animator.setDuration(850);
    animator.addUpdateListener(a->{shown=(float)a.getAnimatedValue();if(speedListener!=null)speedListener.onSpeedChanged(shown);invalidate();});
    animator.start();
  }
  private void text(Canvas c,String txt,float x,float y,float size,int color,boolean bold){
    p.setTypeface(bold?android.graphics.Typeface.create("sans-serif",android.graphics.Typeface.BOLD):android.graphics.Typeface.create("sans-serif",android.graphics.Typeface.NORMAL));
    p.setTextAlign(Paint.Align.CENTER);p.setTextSize(size);p.setColor(color);p.setStyle(Paint.Style.FILL);
    c.drawText(txt,x,y,p);
  }
  @Override protected void onDraw(Canvas c){
    super.onDraw(c);
    float w=getWidth(),h=getHeight();
    // Gauge only: no number or unit can overlap the center needle.
    // The live value and Mbps unit are rendered in a native Android row below this view.
    float cx=w/2f,cy=h*.53f;
    float r=Math.min(w*.40f,h*.46f);
    float start=145f,sweep=250f;
    RectF arc=new RectF(cx-r,cy-r,cx+r,cy+r);
    p.setStyle(Paint.Style.STROKE);p.setStrokeCap(Paint.Cap.ROUND);p.setStrokeWidth(r*.11f);
    p.setColor(0xFF244866);c.drawArc(arc,start,sweep,false,p);
    p.setColor(blue);c.drawArc(arc,start,sweep*Math.min(1f,shown/limit),false,p);
    p.setStrokeWidth(Math.max(2,r*.015f));
    for(int i=0;i<=10;i++){
      float deg=(start+sweep*i/10f)*(float)Math.PI/180f;
      float x1=cx+(r*.83f)*(float)Math.cos(deg),y1=cy+(r*.83f)*(float)Math.sin(deg);
      float x2=cx+(r*.75f)*(float)Math.cos(deg),y2=cy+(r*.75f)*(float)Math.sin(deg);
      p.setColor(0xFF6195B9);c.drawLine(x1,y1,x2,y2,p);
    }
    float a=(start+sweep*Math.min(1f,shown/limit))*(float)Math.PI/180f;
    float nx=cx+(r*.66f)*(float)Math.cos(a);
    float ny=cy+(r*.66f)*(float)Math.sin(a);
    p.setColor(navy);p.setStrokeWidth(r*.022f);c.drawLine(cx,cy,nx,ny,p);
    p.setStyle(Paint.Style.FILL);p.setColor(cyan);c.drawCircle(cx,cy,r*.072f,p);
    text(c,"0",cx-r*.84f,cy+r*.64f,r*.135f,0xFF9DB7D2,false);
    text(c,String.format(Locale.US,"%.0f",limit),cx+r*.84f,cy+r*.64f,r*.135f,0xFF9DB7D2,false);
  }
}
