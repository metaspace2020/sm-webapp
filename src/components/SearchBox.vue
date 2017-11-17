<template>
  <div class="tf-outer">
    <div class="tf-name">
      <i class="el-icon-search" style="color: white"></i>
    </div>

    <input ref="input"
           class="tf-value-input" type="text"
           style="display: inline-block;"
           placeholder="enter any keywords"
           :value="value" @input="onChange($event.target.value)">

    <div class="tf-remove el-icon-circle-close"
         v-if="removable"
         @click="destroy"></div>
  </div>
</template>

<script lang="ts">
 import Vue, {ComponentOptions} from 'vue';
 import * as _ from 'lodash';

 export default Vue.extend({
   name: 'search-box',
   props: {
     value: String,
     removable: {type: Boolean, default: true}
   },
   methods: {
     _input(val: string): void {
       this.$emit('input', val);
       this.$emit('change', val);
     },
     onChange: _.debounce(
       function(this: any, val: string) {
         this._input(val)
       }, 300),
     destroy(): void {
       this.$emit('destroy', 'search-box');
     }
  }
 })
</script>
