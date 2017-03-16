import FILTER_SPECIFICATIONS from './filterSpecs.js';

export const DEFAULT_FILTER = {
  database: 'HMDB',
  institution: undefined,
  datasetName: undefined,
  minMSM: 0.1,
  compoundName: undefined,
  adduct: undefined,
  mz: undefined,
  fdrLevel: 0.2,
  polarity: undefined,
  organism: undefined,
  ionisationSource: undefined,
  maldiMatrix: undefined
};

function revMap(d) {
  let revd = {};
  for (var key in d)
    if (d.hasOwnProperty(key))
    revd[d[key]] = key;
  return revd;
}

const FILTER_TO_URL = {
  database: 'db',
  institution: 'inst',
  datasetName: 'ds',
  minMSM: 'msmthr',
  compoundName: 'mol',
  adduct: 'add',
  mz: 'mz',
  fdrLevel: 'fdrlvl',
  polarity: 'mode',
  organism: 'organism',
  ionisationSource: 'src',
  maldiMatrix: 'matrix'
};

const URL_TO_FILTER = revMap(FILTER_TO_URL);

const PATH_TO_LEVEL = {
  '/annotations': 'annotation',
  '/datasets': 'dataset'
};

export function encodeParams(filter, path) {
  const level = PATH_TO_LEVEL[path];
  let q = {};
  for (var key in FILTER_TO_URL) {
    if (FILTER_SPECIFICATIONS[key].levels.indexOf(level) == -1)
      continue;

    if (filter[key] != DEFAULT_FILTER[key]) {
      q[FILTER_TO_URL[key]] = filter[key] || null;
    }
  }
  return q;
}

export function decodeParams({query, path}) {
  const level = PATH_TO_LEVEL[path];

  let filter = {};
  for (var key in DEFAULT_FILTER)
    if (FILTER_SPECIFICATIONS[key].levels.indexOf(level) != -1)
      filter[key] = DEFAULT_FILTER[key];

  for (var key in query) {
    const fKey = URL_TO_FILTER[key];
    if (FILTER_SPECIFICATIONS[fKey].levels.indexOf(level) == -1)
      continue;

    if (fKey) {
      filter[fKey] = query[key];
      if (filter[fKey] === null)
        filter[fKey] = undefined;
    }
  }
  return filter;
}