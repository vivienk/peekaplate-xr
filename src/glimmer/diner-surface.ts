import type { GlimmerApp } from './app';
export const dinerColors={panel:'#2a2d36',deep:'#1f222a',line:'#494c55',text:'#fafafa',muted:'#aaa9ad',orange:'#f89537'};
/** Scoped canvas controls retain the game's shared mouse, keyboard, gamepad and XR targets. */
export class DinerSurface {
 constructor(readonly a:GlimmerApp){}
 box(x:number,y:number,w:number,h:number,fill=dinerColors.panel,r=16){const c=this.a.context;c.save();c.fillStyle=fill;c.strokeStyle=dinerColors.line;c.lineWidth=1;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();c.restore();}
 text(value:string,x:number,y:number,size=24,color=dinerColors.text,width=1100,weight=400){const c=this.a.context;c.save();c.font=`${weight} ${size}px Arial, sans-serif`;c.fillStyle=color;c.textBaseline='alphabetic';let s=value;while(c.measureText(s).width>width&&s.length>1)s=s.slice(0,-2)+'…';c.fillText(s,x,y);c.restore();}
 lines(value:string,x:number,y:number,width:number,size=20,max=3,color=dinerColors.muted){const c=this.a.context;c.save();c.font=`${size}px Arial, sans-serif`;const lines:string[]=[];let line='';for(const word of value.split(/\s+/)){if(line&&c.measureText(line+' '+word).width>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);c.restore();lines.slice(0,max).forEach((s,i)=>this.text(i===max-1&&lines.length>max?s+'…':s,x,y+i*(size+6),size,color,width));return lines;}
 icon(name:string,x:number,y:number,size=24,color=dinerColors.text){const c=this.a.context;c.save();c.translate(x,y);c.scale(size/24,size/24);c.strokeStyle=color;c.lineWidth=1.8;c.lineCap='round';c.lineJoin='round';c.beginPath();
 if(name==='back'){c.moveTo(15,4);c.lineTo(7,12);c.lineTo(15,20);}
 else if(name==='close'){c.moveTo(6,6);c.lineTo(18,18);c.moveTo(18,6);c.lineTo(6,18);}
 else if(name==='search'){c.arc(10,10,6,0,Math.PI*2);c.moveTo(15,15);c.lineTo(21,21);}
 else if(name==='heart'){c.moveTo(12,21);c.bezierCurveTo(-7,9,5,-3,12,6);c.bezierCurveTo(19,-3,31,9,12,21);}
 else if(name==='portion'){c.rect(5,6,14,12);c.moveTo(2,8);c.lineTo(2,2);c.lineTo(8,2);c.moveTo(16,22);c.lineTo(22,22);c.lineTo(22,16);}
 else if(name==='compare'){c.rect(2,4,8,16);c.rect(14,4,8,16);}
 else if(name==='order'){c.moveTo(3,18);c.lineTo(21,18);c.moveTo(5,15);c.arc(12,15,7,Math.PI,0);c.moveTo(12,8);c.lineTo(12,5);c.moveTo(10,5);c.lineTo(14,5);c.moveTo(5,21);c.lineTo(19,21);}
 else if(name==='plus'){c.moveTo(12,4);c.lineTo(12,20);c.moveTo(4,12);c.lineTo(20,12);}
 else if(name==='sound'||name==='muted'){c.moveTo(3,9);c.lineTo(7,9);c.lineTo(12,5);c.lineTo(12,19);c.lineTo(7,15);c.lineTo(3,15);c.closePath();if(name==='sound'){c.moveTo(16,8);c.quadraticCurveTo(21,12,16,16);}else{c.moveTo(17,9);c.lineTo(22,15);c.moveTo(22,9);c.lineTo(17,15);}}
 c.stroke();c.restore();}
 button(label:string,x:number,y:number,w:number,h:number,action:()=>void,options:{icon?:string;primary?:boolean;disabled?:boolean;selected?:boolean;visible?:string;iconOnly?:boolean}={}){const {primary,selected,disabled,icon,iconOnly}=options;const index=this.a.buttons.length,focus=this.a.keyboardFocus===index,c=this.a.context;c.save();c.globalAlpha=disabled?.4:1;this.box(x,y,w,h,primary||(selected&&icon==='heart')?dinerColors.orange:selected?dinerColors.text:dinerColors.deep,12);if(focus){c.strokeStyle=dinerColors.orange;c.lineWidth=3;c.strokeRect(x-3,y-3,w+6,h+6);}const color=primary||selected?dinerColors.deep:dinerColors.text;if(icon)this.icon(icon,x+(iconOnly?(w-24)/2:16),y+(h-24)/2,24,color);if(!iconOnly){const txt=options.visible??label;c.font='20px Arial, sans-serif';const tx=icon?x+50:x+Math.max(12,(w-c.measureText(txt).width)/2);this.text(txt,tx,y+h/2+7,20,color,w-(tx-x)-12,primary?600:400);}c.restore();this.a.hit(label,x,y,w,h,action);this.a.buttons[index].disabled=!!disabled;}
 shell(title:string){const c=this.a.context;c.fillStyle='#11141bd9';c.fillRect(0,0,1280,720);this.box(48,24,1184,672);this.button('Back',72,46,48,48,()=>this.a.close(),{icon:'back',iconOnly:true});this.text(title,140,80,28,dinerColors.text,880,600);this.button('Close',1156,46,48,48,()=>this.a.close(),{icon:'close',iconOnly:true});c.fillStyle=dinerColors.line;c.fillRect(72,114,1136,1);}
 sound(){this.button(this.a.muted?'Sound off':'Sound on',1156,634,48,44,()=>this.a.toggleSound(),{icon:this.a.muted?'muted':'sound',iconOnly:true});}
}
