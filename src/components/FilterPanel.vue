<template>
  <div class="filter-panel">
    <el-select placeholder="Add filter"
               v-model="selectedFilterToAdd"
               @change="addFilter"
               style="width: 200px; margin-bottom: 10px;">
      <el-option v-for="f in availableFilters"
                 :value="f.key" :label="f.description">
      </el-option>
    </el-select>

    <component v-for="(f, idx) in activeFilters"
               :is="f.type"
               v-bind="f"
               :options="getFilterOptions(f)"
               :value="filterValue(activeKeys[idx])"
               @change="onChange(activeKeys[idx], $event)"
               @destroy="onChange(activeKeys[idx], undefined)"
    >
    </component>
  </div>
</template>

<script>
 import InputFilter from './InputFilter.vue';
 import SingleSelectFilter from './SingleSelectFilter.vue';
 import MultiSelectFilter from './MultiSelectFilter.vue';
 import DatasetNameFilter from './DatasetNameFilter.vue';
 import MzFilter from './MzFilter.vue';
 import SearchBox from './SearchBox.vue';
 import FILTER_SPECIFICATIONS, {filterComponents} from '../filterSpecs';
 import {fetchOptionListsQuery} from '../api/metadata';
 import deepcopy from 'deepcopy';

 export default {
   name: 'filter-panel',
   props: ["level"],
   components: filterComponents,
   apollo: {
     optionLists_: {
       query: fetchOptionListsQuery,
       update: data => data,
       result({data}) {
         if (data)
           this.optionLists = deepcopy(data)
       }
     }
   },
   computed: {
     filter() {
       return this.$store.getters.filter;
     },

     activeKeys() {
       return this.$store.state.orderedActiveFilters;
     },

     activeFilters() {
       return this.activeKeys.map(this.makeFilter);
     },

     availableFilters() {
       let available = [];
       FILTER_SPECIFICATIONS.forEach((spec, key) => {
         const {levels, description} = spec;
         if (levels.indexOf(this.level) == -1)
           return;
         if (this.activeKeys.indexOf(key) == -1)
           available.push({key, description});
       });
       return available;
     }
   },

   data () {
     return {
       selectedFilterToAdd: null,
       optionLists: null
     }
   },

   methods: {
     makeFilter(filterKey) {
       return FILTER_SPECIFICATIONS.get(filterKey);
     },

     filterValue(filterKey) {
       return this.filter[filterKey];
     },

     onChange(filterKey, val) {
       this.$store.commit('updateFilter',
                          Object.assign(this.filter, {[filterKey]: val}));
     },

     addFilter(key) {
       if (key) {
         this.selectedFilterToAdd = null;
         this.$store.commit('addFilter', key);
       }
     },

     getFilterOptions(filter) {
       if (!this.optionLists || (typeof filter.optionList !== 'function'))
         return [];
       else
         return filter.optionList(this.optionLists);
     }
   }
 }
</script>

<style>
 .filter-panel {
   display: inline-flex;
   align-items: flex-start;
   flex-wrap: wrap;
   padding: 0px 4px;
 }

 .el-select-dropdown__wrap {
   /* so that no scrolling is necessary */
   max-height: 480px;
 }

 .el-select-dropdown__wrap {
    max-height: 500px;
 }
</style>
