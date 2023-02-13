import { EventEmitter } from 'events';

import logger from '../../../core/utils/logger';

interface IOptions {
  [key: string]: any;
}

/**
 * Constructor
 */
class BufferedQueue extends EventEmitter {
  _name: string;
  _size: number;
  _verbose: boolean;
  _useCustomResultFunction: boolean;
  _flushTimeout: number | null;
  _customResultFunction?: any;

  intervalId: NodeJS.Timeout | null;
  options: IOptions;
  _items: Array<any>;

  constructor(name: string, options: IOptions) {
    super();

    this.options = options;

    // Array for queue items
    this._items = [];

    // Local properties
    this._name = name ? name : Math.random().toString(16).slice(2);
    this._size = options && 'size' in options ? options.size : -1;
    this._flushTimeout =
      options && 'flushTimeout' in options ? options.flushTimeout : null;
    this._verbose = options && 'verbose' in options ? options.verbose : false;
    this._useCustomResultFunction = false;

    // Custom result function handling
    if (
      options &&
      'customResultFunction' in options &&
      this.isFunction(options.customResultFunction)
    ) {
      this._useCustomResultFunction = true;
      this._customResultFunction = options.customResultFunction;
    }

    // Trigger for the timed Queue flush
    this.intervalId = null;
  }

  // Check whether supplied argument is a function or not
  isFunction(functionToCheck: (data: IOptions) => void): boolean {
    const getType = {};
    return (
      functionToCheck &&
      getType.toString.call(functionToCheck) === '[object Function]'
    );
  }

  public add(item: IOptions | Array<IOptions>): void {
    // Add (fifo)
    this._items[this._items.length] = item;

    if (this._verbose)
      logger.debug(
        'Queue (' + this._name + '): Added item: ',
        JSON.stringify(item)
      );

    // Flush queue if max queue size is reached
    if (this.maxQueueSizeReached()) {
      this.onFlush();
      // Start the timeout
    } else {
      this.startTimeout();
    }
  }

  maxQueueSizeReached(): boolean {
    const bool = this._items.length >= this._size;
    if (bool) {
      // Trigger Queue flush
      if (this._verbose)
        logger.debug('Queue (' + this._name + '): Maximum Queue size reached!');
    } else {
      // Do nothing
      if (this._verbose)
        logger.debug(
          'Queue (' +
            this._name +
            '): Maximum Queue size not reached. Currently ' +
            this._items.length +
            ' of ' +
            this._size +
            ' in queue!'
        );
    }
    return bool;
  }

  onFlush(): void {
    // Stop the timeout
    this.stopTimeout();
    // Instantiate new Array etc.
    const data = new Array(this._items.length);
    let i = this._items.length;
    // Populate new Array
    while (i--) {
      data[i] = this._items[i];
    }
    // Emit flush event
    this.emit(
      'flush-recovvo-queue',
      this._useCustomResultFunction ? this._customResultFunction(data) : data,
      this._name
    );
    // Empty the queue
    this.flushItems();
  }

  flushItems(): void {
    // Erase contents of Items array
    this._items.length = 0;
  }

  startTimeout(): void {
    if (!this.intervalId && this._flushTimeout) {
      const callback = this.recurringQueue.bind(this);
      this.intervalId = setTimeout(callback, this._flushTimeout);
    }
  }

  stopTimeout(): void {
    if (this.intervalId && this._flushTimeout) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  recurringQueue(): void {
    // Check if there's some work to do
    if (this._items.length > 0) {
      if (this._verbose)
        logger.debug(
          'Queue (' +
            this._name +
            '): The timeout triggered a Queue flush! ' +
            this._items.length +
            ' items are in the Queue.'
        );
      // Trigger Queue flush
      this.onFlush();
    } else {
      if (this._verbose)
        logger.debug(
          'Queue (' +
            this._name +
            '): The timeout triggered a Queue flush, but there are no items!'
        );
    }
  }
}

export default BufferedQueue;
