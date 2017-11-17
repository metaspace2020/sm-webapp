import FILTER_SPECIFICATIONS, {Filter, FilterKey, FilterLevel} from './filterSpecs';
import { Dictionary } from './util';

import { invert } from 'lodash';
import { Location } from 'vue-router';

let URL_TO_FILTER: Dictionary<FilterKey> = {};
let DEFAULT_FILTER: Dictionary<any> = {};

FILTER_SPECIFICATIONS.forEach((v, k) => {
  URL_TO_FILTER[v.urlShortcut] = k;
  DEFAULT_FILTER[k] = v.defaultValue;
})

const PATH_TO_LEVEL: Dictionary<FilterLevel> = {
  '/annotations': FilterLevel.annotation,
  '/datasets': FilterLevel.dataset
};

export {DEFAULT_FILTER};

export function encodeParams(filter: Filter, path: string): Dictionary<string> {
  const level = PATH_TO_LEVEL[path];
  let q: Dictionary<string> = {};
  FILTER_SPECIFICATIONS.forEach((spec, key) => {
    const {levels, encoding} = spec;
    if (levels.indexOf(level) == -1)
      return;

    if (filter[key] != spec.defaultValue) {
      const param = spec.urlShortcut;
      if (encoding == 'json')
        q[param] = JSON.stringify(filter[key]);
      else if (encoding == 'list')
        q[param] = filter[key].join(',');
      else
        q[param] = filter[key];
    }
  });
  return q;
}

export function stripFilteringParams(query: Dictionary<string>): Dictionary<string> {
  let q: Dictionary<string> = {};
  for (var key in query) {
    const fKey = URL_TO_FILTER[key];
    if (!fKey)
      q[key] = query[key];
  }
  return q;
}

export function decodeParams(location: Location): Object {
  const {query, path} = location;

  if (!path || !query)
    return {};

  const level = PATH_TO_LEVEL[path];

  let filter: any = {};

  FILTER_SPECIFICATIONS.forEach((spec, key) => {
    if (spec.levels.indexOf(level) != -1)
      filter[key] = spec.defaultValue;
  });

  for (var key in query) {
    const fKey = URL_TO_FILTER[key];
    if (!fKey)
      continue; // skip params unrelated to filtering

    const {levels, encoding} = FILTER_SPECIFICATIONS.get(fKey)!!;

    if (levels.indexOf(level) == -1)
      continue;

    if (encoding == 'json') {
      if ('[{'.indexOf(query[key][0]) == -1) {
        // assume non-JSON means array of one element
        filter[fKey] = [query[key]];
      } else {
        filter[fKey] = JSON.parse(query[key]);
      }
    } else if (encoding == 'list') {
      filter[fKey] = query[key] ? query[key].split(',') : [];
    } else {
      filter[fKey] = query[key];
    }

    if (filter[fKey] === null)
      filter[fKey] = undefined;
  }

  return filter;
}

const allSections = ['images', 'compounds', 'scores', 'metadata', 'adducts'].reverse();

function decodeSections(number: string): string[] {
  let sections = [],
      mask = parseInt(number).toString(2);
  for (let i = mask.length - 1; i >= 0; i--) {
    if (mask[i] == '1') {
      sections.push(allSections[allSections.length - mask.length + i]);
    }
  }
  return sections;
}

export function encodeSections(sections: string[]) {
  let str = '';
  for (let i = 0; i < allSections.length; i++) {
    let found = sections.indexOf(allSections[i]) >= 0;
    str += found ? '1' : '0';
  }
  return parseInt(str, 2);
}

function decodeSortOrder(str: string) {
  const dir = str[0] == '-' ? 'DESCENDING' : 'ASCENDING';
  if (str[0] == '-')
    str = str.slice(1);
  const by = 'ORDER_BY_' + str.toUpperCase();
  return {by, dir};
}

interface SortSettings {
  by: string
  dir: string
}

export function encodeSortOrder(settings: SortSettings): string {
  let sort = settings.dir == 'ASCENDING' ? '' : '-';
  return sort + settings.by.replace('ORDER_BY_', '').toLowerCase();
}

export function decodeSettings(location: Location): any {
  const {query, path} = location;
  if (!query || !path)
    return undefined;

  let settings = {
    table: {
      currentPage: 0,
      order: {
        by: 'ORDER_BY_MSM',
        dir: 'DESCENDING'
      }
    },

    annotationView: {
      activeSections: ['images'],
      colormap: 'Viridis'
    },

    datasets: {
      tab: 'List'
    }
  };

  if (query.page)
    settings.table.currentPage = parseInt(query.page) - 1;
  if (query.sort)
    settings.table.order = decodeSortOrder(query.sort);
  if (query.cmap)
    settings.annotationView.colormap = query.cmap;
  if (query.sections !== undefined)
    settings.annotationView.activeSections = decodeSections(query.sections);
  if (query.tab !== undefined)
    settings.datasets.tab = query.tab;
  return settings;
}
