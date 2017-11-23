import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

import actions from './actions.js';
import getters from './getters.js';
import mutations from './mutations.js';

const store = new Vuex.Store({
  state: {
    // names of currently shown filters
    orderedActiveFilters: [],

    // currently selected annotation
    annotation: undefined,

    // is annotation table loading?
    tableIsLoading: true,

    lastUsedFilters: {},

    authenticated: false,
    user: null,

    currentTour: null,
  },

  actions,
  getters,
  mutations
})

export default store;
