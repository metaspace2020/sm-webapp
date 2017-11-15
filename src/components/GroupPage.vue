<template>
  <div>
    <router-view :groupId="groupId"></router-view>
  </div>
</template>

<script>
 export default {
   name: 'group-page',

   computed: {
     groupId() {
       return this.$store.state.route.params.group_id;
     }
   }
 }
</script>
