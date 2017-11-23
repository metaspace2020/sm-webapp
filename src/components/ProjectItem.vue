<template>
  <div class="project-item"
       @drop="onDrop"
       @dragover="onDragOver"
  >
    Project name: {{ name }}
    <br/>
    <span style="color:red">FIXME: make this component nicer </span>

    <ul>
      <li v-for="ds in datasets">
        {{ ds.name }}
      </li>
    </ul>
  </div>
</template>

<script>
 import gql from 'graphql-tag';

 const addDatasetMutation = gql`
   mutation AddDatasetToProject($projectId: String!, $datasetId: String!) {
     addDatasetToProject(datasetId: $datasetId, projectId: $projectId) {
       success
       errorMessage
     }
   }`;

 export default {
   props: {
     id: String,
     name: String
   },
   apollo: {
     datasets: {
       query: gql`
         query GetProjectDatasets($projectId: String!) {
           project(id: $projectId) {
             datasets {
               id
               name
             }
           }
         }`,
       variables() {
         return {
           projectId: this.id
         }
       },
       update: data => data.project.datasets
     }
   },
   methods: {
     onDrop(event) {
       event.preventDefault();
       const datasetId = event.dataTransfer.getData('text');
       this.addDataset(datasetId);
     },

     onDragOver(event) {
       event.preventDefault();
       event.dataTransfer.dropEffect = 'link';
     },

     addDataset(datasetId) {
       this.$apollo.mutate({
         mutation: addDatasetMutation,
         variables: {
           projectId: this.id,
           datasetId: datasetId
         }}).then(() => {
           // FIXME: check return status
           this.$apollo.queries.datasets.refetch();
         });
     }
   }
 }
</script>

<style>
 .project-item {
   min-height: 100px;
   border: 1px solid black;
   border-radius: 2px;
   align-self: center;
   margin: 10px;
 }
</style>
