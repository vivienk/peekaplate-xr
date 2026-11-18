/** One-second average of actual game-loop intervals, including stalls. */
export class FrameRateMeter {
  fps=0;
  private start:number|null=null;
  private frames=0;
  reset(){this.start=null;this.frames=0;}
  sample(now:number):boolean {
    if(this.start===null){this.start=now;return false;}
    this.frames++;
    const elapsed=now-this.start;
    if(elapsed<1000)return false;
    this.fps=Math.round(this.frames*1000/elapsed);
    this.start=now;this.frames=0;return true;
  }
}
