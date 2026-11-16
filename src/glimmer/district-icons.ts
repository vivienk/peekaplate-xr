/** Small monochrome pixel marks, shared by district labels and travel cards. */
export const districtIconNames:Record<string,string>={
 'd1-rain-alley':'district-rain',
 'd2-lantern-steps':'district-lantern',
 'd3-fogline-pier':'district-pier',
};
const pixels:Record<string,readonly string[]>={
 'district-rain':['00111000','01111100','11111110','01111100','00000000','01001010','10010100','00101000'],
 'district-lantern':['00011000','00111100','01111110','01011010','01011010','01111110','00111100','00011000'],
 'district-pier':['00000000','01000010','11111111','11111111','01000010','01000010','10100101','01011010'],
};
export function drawDistrictIcon(c:CanvasRenderingContext2D,name:string,x:number,y:number,size:number,color:string):boolean{
 const rows=pixels[name];if(!rows)return false;
 c.fillStyle=color;
 rows.forEach((row,j)=>{for(let i=0;i<8;i++)if(row[i]==='1'){
  const left=Math.round(x+i*size/8),top=Math.round(y+j*size/8);
  c.fillRect(left,top,Math.round(x+(i+1)*size/8)-left,Math.round(y+(j+1)*size/8)-top);
 }});return true;
}
