export function interfaceIcon(c:CanvasRenderingContext2D,name:string,x:number,y:number,size=32){
 const patterns:Record<string,string[]>={
  search:['  ####        ',' ##  ##       ','##    ##      ','##    ##      ',' ##  ##       ','  ######      ','      ###     ','       ###    ','        ##    '],
  speaker:['      ##      ','    ####      ',' #######      ',' #######      ',' #######      ','    ####      ','      ##      '],
 };
 const draw=(rows:string[],ox:number,oy:number,color:string)=>{c.fillStyle=color;rows.forEach((row,j)=>[...row].forEach((ch,i)=>{if(ch==='#')c.fillRect(x+(ox+i)*size/14,y+(oy+j)*size/14,size/14+.1,size/14+.1);}));};
 if(name==='search'){draw(patterns.search,1,2,'#321b15');return;}
 draw(patterns.speaker,0,3,'#321b15');
 draw(name==='sound-off'?['#   #',' # # ','  #  ',' # # ','#   #']:['#  # ',' #  #',' #  #',' #  #','#  # '],9,4,name==='sound-off'?'#ba4a33':'#321b15');
}
