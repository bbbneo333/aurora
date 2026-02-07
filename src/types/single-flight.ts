const debug = require('debug')('aurora:single-flight');

export type SingleFlightInstance = {
  controller: AbortController;
  done: Promise<void>;
};

export type SingleFlightRunFn = (signal: AbortSignal) => Promise<void>;

export type SingleFlightCancelFn = () => void;

/*
SingleFlight allows only one promise to run at a time
Promise gets a AbortSignal which gets aborted before running a new instance
onCancel is called before aborting
 */
export class SingleFlight {
  #current: SingleFlightInstance | null = null;

  async run(run: SingleFlightRunFn, onCancel?: SingleFlightCancelFn) {
    // if something is running → cancel it
    if (this.#current) {
      debug('run - cancelling current...');
      onCancel?.();
      this.#current.controller.abort('SingleFlight has new run');
      debug('run - current cancelled!');

      // wait for existing run to finish
      try {
        await this.#current.done;
      } catch (error) {
        console.error(error);
      }
    }

    // new runner
    const controller = new AbortController();

    const done = (async () => {
      try {
        debug('run - runner starting...');
        await run(controller.signal);
        debug('run - runner finished!');
      } finally {
        if (this.#current?.controller === controller) {
          debug('run - runner deregistered!');
          this.#current = null;
        }
      }
    })();

    this.#current = { controller, done };
    return done;
  }
}
