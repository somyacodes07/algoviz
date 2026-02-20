import { Timeline } from '../../types';

// We use Vite's ?worker feature to correctly bundle the worker and resolve its URL
import ExecutorWorker from './executor.worker?worker';

export const executeCode = (userCode: string, language: string = 'javascript'): Promise<Timeline> => {
  return new Promise((resolve, reject) => {
    // Instantiate the worker
    const worker = new ExecutorWorker();

    worker.onmessage = (e) => {
      const { type, timeline, message } = e.data;
      // Clean up the worker memory after we finish execution
      worker.terminate();

      // Even errors return a timeline up to the point of failure
      resolve(timeline || []);
    };

    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(`Worker failed: ${e.message}`));
    };

    // Send the code payload to be processed asynchronously
    worker.postMessage({ userCode, language });
  });
};
