/* eslint-disable @typescript-eslint/no-explicit-any */
declare class Chart {
  constructor(ctx: HTMLCanvasElement | null, config: any);
  data: any;
  options: any;
  update(mode?: string): void;
  destroy(): void;
  resize(): void;
}
