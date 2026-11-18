/** Render scheduling only: input, simulation and XR tracking keep their cadence. */
export class RenderCadence {
  private next=-Infinity;
  private interval=0;
  due(now:number,interval:number){
    if(interval<=0){this.reset();return true;}
    if(!Number.isFinite(this.next)||interval!==this.interval){
      this.interval=interval;this.next=now+interval;return true;
    }
    if(now+.1<this.next)return false;
    // Keep the original phase across slightly late browser frames. Starting a
    // fresh interval at every draw turned a 30 Hz cap into roughly 20–25 Hz.
    this.next+=Math.max(1,Math.floor((now+.1-this.next)/interval)+1)*interval;
    return true;
  }
  reset(){this.next=-Infinity;}
}
export function renderInterval(lowPower:boolean,immersive:boolean,flat:boolean){
  return !lowPower||immersive?0:flat?250:1000/30;
}
export function readLowPower(fallback:boolean){
  try{const value=localStorage.getItem('peekaplate-low-power');return value===null?fallback:value==='on';}catch{return fallback;}
}

/** Reduce only non-immersive portion raster cost after sustained slow windows. */
export class PortionResolution {
  scale=.75;
  private slow=0;
  observe(fps:number){
    this.slow=fps<29?this.slow+1:0;
    if(this.slow>=2){this.scale=this.scale>.65?.65:.55;this.slow=0;}
  }
  reset(){this.scale=.75;this.slow=0;}
}
