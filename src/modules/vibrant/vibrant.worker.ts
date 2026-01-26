import { Vibrant, WorkerPipeline } from 'node-vibrant/worker';

Vibrant.use(new WorkerPipeline(class {
  constructor() {
    return new Worker(
      // @ts-ignore
      new URL('node-vibrant/worker.worker', import.meta.url),
    );
  }
} as any));

export default Vibrant;
