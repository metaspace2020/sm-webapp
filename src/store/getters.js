import {mzFilterPrecision} from '../util';
import {decodeParams, decodeSettings} from '../url';
import {toGraphQLFilter} from '../filterSpecs';

export default {
  filter: (state) => decodeParams(state.route),

  settings: (state) => decodeSettings(state.route),

  gqlFilter: (state, getters) => toGraphQLFilter(getters.filter),

  ftsQuery: (state, getters) => getters.filter.simpleQuery,

  gqlAnnotationFilter: (state, getters) => getters.gqlFilter.annotation,

  gqlDatasetFilter: (state, getters) => getters.gqlFilter.dataset,
}
