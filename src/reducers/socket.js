import _ from 'lodash';
import {
  AGGREGRATION_SECONDS,
  DEVICE_TYPE,
  MAX_RESULT_RECORDS,
  OPENCLGA_STATES
} from '../shared/constants';
import { ACTION_KEYS } from '../shared/socket';

export const initialState = {
  aggregrated: [],
  workers: {},
  bestResult: null
};

const AGGREGRATION_TEMPLATE = {
  groupKey: null,
  avg_fitness: 0,
  best_fitness: 0,
  count: 0,
  worst_fitness: 0
};

const WORKER_TEMPLATE = {
  'best': null,
  'device': '',
  'ip': '',
  'platform': '',
  'state': OPENCLGA_STATES.DEFAULT,
  'statistics': [],
  'shiftedStatistics': 0,
  'type': DEVICE_TYPE.CPU,
};

const handleWorkerConnected = (workers, data) => {
  if (workers[data.worker]) {
    console.warn('duplicated worker found!! data will be overridden.', data.worker);
  }
  const worker = _.cloneDeep(WORKER_TEMPLATE);
  worker.device = data.name;
  worker.id = data.worker;
  worker.ip = data.ip;
  worker.platform = data.platform;
  worker.type = data.type;
  workers[data.worker] = worker;
};

const handleWorkerLost = (workers, data) => {
  delete workers[data.worker];
};

const handleStateChanged = (workers, data) => {
  const worker = workers[data.worker];
  if (!worker) {
    console.error('unknown worker id found', data.worker);
    return;
  }
  worker.state = data.state;
};

const aggregrateGlobalResult = (aggregrated, data) => {
  const result = data.result;
  const time = new Date();
  time.setSeconds(((time.getSeconds() / AGGREGRATION_SECONDS) >> 0) * AGGREGRATION_SECONDS);
  time.setMilliseconds(0);
  const groupKey = time.getTime();
  const lastGroup = aggregrated[aggregrated.length - 1];
  let group;
  if (lastGroup && lastGroup.groupKey === groupKey) {
    group = lastGroup;
  } else {
    group = _.cloneDeep(AGGREGRATION_TEMPLATE);
    aggregrated.push(group);
    while (aggregrated.length > MAX_RESULT_RECORDS && aggregrated.shift());
  }
  group.groupKey = groupKey;
  group.count++;
  group.best_fitness += (result.best_fitness - group.best_fitness) / group.count;
  group.avg_fitness += (result.avg_fitness - group.avg_fitness) / group.count;
  group.worst_fitness += (result.worst_fitness - group.worst_fitness) / group.count;
};

const handleGenerationResult = (workers, data) => {
  const worker = workers[data.worker];
  if (!worker) {
    console.error('unknown worker id found', data.worker);
    return;
  }
  // put data in array
  worker.statistics.push(data.result);
  while (worker.statistics.length > MAX_RESULT_RECORDS) {
    if (!worker.statistics.shift()) {
      break;
    }
    worker.shiftedStatistics++;
  }
  if (worker.best) {
    // TODO: we should read opt_for_max from server.
    worker.best = Math.min(worker.best, data.result.best_fitness);
  } else {
    worker.best = data.result.best_fitness;
  }
};

export default (state = initialState, payload) => {
  const data = payload.data;
  const workers = { ...state.workers };
  switch (payload.type) {
    case ACTION_KEYS.WORKER_CONNECTED:
      handleWorkerConnected(workers, data);
      return { ...state, workers };
    case ACTION_KEYS.WORKER_LOST:
      handleWorkerLost(workers, data);
      return { ...state, workers };
    case ACTION_KEYS.STATE_CHANGED:
      handleStateChanged(workers, data);
      return { ...state, workers };
    case ACTION_KEYS.GENERATION_RESULT:
      const aggregrated = [ ...state.aggregrated ];
      handleGenerationResult(workers, data);
      aggregrateGlobalResult(aggregrated, data);
      return { aggregrated, workers };
    default:
      return state;
  }
};
