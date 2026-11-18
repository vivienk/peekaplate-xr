/** One-second average of presented application frames, including stalls and idle windows. */
export class FrameRateMeter {
  fps=0;
  private start:number|null=null;
  private frames=0;
  reset(){this.start=null;this.frames=0;}
  sample(now:number,presented=true):boolean {
    if(this.start===null){this.start=now;return false;}
    if(presented)this.frames++;
    const elapsed=now-this.start;
    if(elapsed<1000)return false;
    this.fps=Math.round(this.frames*1000/elapsed);
    this.start=now;this.frames=0;return true;
  }
}
