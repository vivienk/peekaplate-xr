/** Render scheduling only: input, simulation and XR tracking keep their cadence. */
export class RenderCadence {
  private last=-Infinity;
  due(now:number,interval:number){
    if(now-this.last<interval-.1)return false;
    this.last=now;return true;
  }
  reset(){this.last=-Infinity;}
}
export function renderInterval(lowPower:boolean,immersive:boolean,flat:boolean){
  return !lowPower||immersive?0:flat?250:1000/30;
}
export function readLowPower(fallback:boolean){
  try{const value=localStorage.getItem('peekaplate-low-power');return value===null?fallback:value==='on';}catch{return fallback;}
}
