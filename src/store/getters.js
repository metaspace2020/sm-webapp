import {mzFilterPrecision} from '../util';
import {decodeParams, decodeSettings} from '../url';
import {toGraphQLFilter} from '../filterSpecs';

export default {
  myId: (state) => state.user ? state.user.id : null,
  myGroups: (state) => state.user ? state.user.groups : [],
  myProjects: (state) => state.user ? state.user.projects : [],
  myManagedProjects: (state, getters) => {
    if (!state.user)
      return [];
    const projects = getters.myProjects.filter(proj => getters.myId == proj.manager.id);
    console.log(projects);
    return projects;
  },

  filter: (state) => decodeParams(state.route),

  settings: (state) => decodeSettings(state.route),

  gqlFilter: (state, getters) => toGraphQLFilter(getters.filter),

  ftsQuery: (state, getters) => getters.filter.simpleQuery,

  gqlAnnotationFilter: (state, getters) => getters.gqlFilter.annotation,

  gqlDatasetFilter: (state, getters) => getters.gqlFilter.dataset,
}
