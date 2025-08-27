// src/types/vanta.d.ts
declare module "vanta/dist/vanta.clouds.min" {
  type VantaInstance = { destroy?: () => void };
  // You can add more props if you want intellisense
  interface CloudsOptions {
    el: HTMLElement;
    THREE?: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    skyColor?: number;
    cloudColor?: number;
  }
  const CLOUDS: (opts: CloudsOptions) => VantaInstance;
  export default CLOUDS;
}
