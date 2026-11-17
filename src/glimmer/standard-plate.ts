export const STANDARD_PLATE_METRES=.27;
export interface CutoutBounds {left:number;top:number;right:number;bottom:number}
/** Ignore nearly transparent edge noise; run only when loading a portion. */
export function cutoutBounds(rgba:Uint8ClampedArray,width:number,height:number):CutoutBounds {
 let left=width,top=height,right=0,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=128){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
 return right>left&&bottom>top?{left,top,right,bottom}:{left:0,top:0,right:width,bottom:height};
}
/** Preserve photo proportions and fit the visible footprint to the standard plate. */
export function standardPlateScale(width:number,height:number,b:CutoutBounds){
 const metresPerPixel=STANDARD_PLATE_METRES/Math.max(b.right-b.left,b.bottom-b.top,1);
 return {width:width*metresPerPixel,depth:height*metresPerPixel,
  offsetX:(width/2-(b.left+b.right)/2)*metresPerPixel,
  offsetZ:(height/2-(b.top+b.bottom)/2)*metresPerPixel};
}
