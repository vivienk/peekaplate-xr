/** Blend the tail into the head once, then let the audio clock loop the buffer. */
export function blendRainLoop(input: Float32Array, sampleRate: number): Float32Array<ArrayBuffer> {
  const fade = Math.min(Math.round(sampleRate * .25), Math.floor(input.length / 8));
  const start = 0, end = input.length;
  const output = new Float32Array(end - start - fade);
  output.set(input.subarray(start + fade, end));
  for (let i = 0; i < fade; i++) {
    const angle = i / Math.max(1, fade - 1) * Math.PI / 2;
    output[output.length - fade + i] = input[end - fade + i] * Math.cos(angle) + input[start + i] * Math.sin(angle);
  }
  return output;
}
