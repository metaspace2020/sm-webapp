<template>
  <div class="dataset-item" :class="disabledClass">

    <el-dialog title="Provided metadata" :visible.sync="showMetadataDialog">
      <dataset-info :metadata="metadata"
        :expandedKeys="['Sample information', 'Sample preparation']">
      </dataset-info>
    </el-dialog>

    <div class="opt-image">
      <router-link :to="opticalImageAlignmentHref" v-if="opticalImageSmall && haveEditAccess && dataset.status != 'STARTED'" title="Edit Optical Image">
        <div class="edit-opt-image">
            <img class="opt-image-thumbnail" :src="opticalImageSmall" width="100px" height="100px" alt="edit_optical_image"/>
        </div>
      </router-link>
      <router-link :to="opticalImageAlignmentHref" v-else-if="haveEditAccess && dataset.status != 'STARTED'" title="Add Optical Image">
        <div class="no-opt-image" >
            <img src="../assets/empty_rect_100_100.png" width="100px" height="100px" alt="edit_optical_image"/>
        </div>
      </router-link>
      <div class="edit-opt-image-guest" v-else-if="dataset.status != 'STARTED'">
        <img v-if="opticalImageSmall" :src="opticalImageSmall" width="100px" height="100px" alt="optical_image"/>
        <img v-else src="../assets/empty_rect_100_100.png" width="100px" height="100px" alt="optical_image"/>
      </div>
    </div>

    <div class="ds-info">
      <div>
        <b>{{ formatDatasetName }}</b>
      </div>

      <div style="color: darkblue;">
        <span class="ds-add-filter"
              title="Filter by species"
              @click="addFilter('organism')">
          {{ formatOrganism }}</span>,
        <span class="ds-add-filter"
              title="Filter by organism part"
              @click="addFilter('organismPart')">
          {{ formatOrganismPart }}</span>

        <span class="ds-add-filter"
              title="Filter by condition"
              @click="addFilter('condition')">
          ({{ formatCondition }})</span>
      </div>

      <div>
        <span class="ds-add-filter"
              title="Filter by ionisation source"
              @click="addFilter('ionisationSource')">
          {{ dataset.ionisationSource }}</span> +
        <span class="ds-add-filter"
              title="Filter by analyzer type"
              @click="addFilter('analyzerType')">
          {{ dataset.analyzer.type }}</span>,
        <span class="ds-add-filter"
              title="Filter by polarity"
              @click="addFilter('polarity')">
          {{ dataset.polarity.toLowerCase() }} mode</span>,
        resolving power {{ formatResolvingPower }}
      </div>

      <div style="font-size: 15px;">
        Submitted <span class="s-bold">{{ formatDate }}</span>
        at {{ formatTime }} by
        <span class="ds-add-filter"
              title="Filter by submitter"
              @click="addFilter('submitter')">
          {{ formatSubmitter }}</span>,
        <span class="s-inst ds-add-filter"
              v-html="formatInstitution"
              title="Filter by this lab"
              @click="addFilter('institution')"></span>
      </div>
      <div v-if="dataset.status != 'STARTED'">
        <span>{{formatFdr.n}} annotations @ FDR {{formatFdr.level}}%</span>
      </div>
    </div>

    <div class="ds-actions">
      <span v-if="dataset.status == 'FINISHED'">
        <i class="el-icon-picture"></i>
        <el-popover trigger="hover" placement="top">
          <div class="db-link-list">
            Select a database:
            <div v-for="database in metaboliteDatabases" >
              <router-link :to="resultsHref(database)">
                {{ database }}
              </router-link>
            </div>
          </div>
          <a slot="reference">Browse annotations</a>
        </el-popover>
        <br/>
      </span>

      <span v-if="dataset.status == 'STARTED'">
        <div class="striped-progressbar processing" title="Processing is under way"></div>
      </span>

      <span v-if="dataset.status == 'QUEUED'">
        <div class="striped-progressbar queued" title="Waiting in the queue"></div>
      </span>

      <i class="el-icon-view"></i>
      <a @click="showMetadata" class="metadata-link">Show full metadata</a>

      <div v-if="haveEditAccess && dataset.status != 'STARTED'">
        <i class="el-icon-edit"></i>
        <router-link :to="editHref">Edit metadata</router-link>
      </div>

      <div v-if="haveEditAccess && dataset.status != 'STARTED'"
           class="ds-delete">
        <i class="el-icon-delete"></i>
        <a @click="openDeleteDialog">Delete dataset</a>
      </div>
    </div>
  </div>
</template>

<script>
 import DatasetInfo from './DatasetInfo.vue';
 import capitalize from 'lodash/capitalize';
 import {deleteDatasetQuery} from '../api/dataset';
 import {getJWT} from '../util';
 import gql from 'graphql-tag';

 function removeUnderscores(str) {
   return str.replace(/_/g, ' ');
 }

 export default {
   name: 'dataset-item',
   props: ['dataset'],
   components: {
     DatasetInfo
   },

   computed: {
     opticalImageAlignmentHref() {
         return {
             name: 'add-optical-image',
             params: {dataset_id: this.dataset.id}
         };
     },

     formatSubmitter() {
       const { name, surname } = this.dataset.submitter;
       return name + " " + surname;
     },

     formatInstitution() {
       return this.dataset.institution.replace(/\s/g, '&nbsp;');
     },

     formatDatasetName() {
       return this.dataset.name;
     },

     analyzerType() {
       return this.dataset.analyzer.type;
     },

     uploadedDateTime() {
       const unknown = {date: '????-??-??', time: '??:??'};
       if (!this.dataset.id)
         return unknown;

       const fields = this.dataset.id.split('_');
       if (fields.length < 2)
         return unknown;

       const date = fields[0];
       const time = fields[1].split('m')[0].replace('h', ':');
       return {
         date,
         time
       }
     },

     formatDate() {
       return this.uploadedDateTime.date;
     },

     formatTime() {
       return this.uploadedDateTime.time;
     },

     metadata() {
       return JSON.parse(this.dataset.metadataJson);
     },

     metaboliteDatabases() {
       const dbs = this.metadata.metaspace_options.Metabolite_Database;
       if (typeof dbs === 'string')
         return [dbs];
       else
         return dbs;
     },

     formatOrganism() {
       return removeUnderscores(this.dataset.organism);
     },

     formatCondition() {
       return removeUnderscores(this.dataset.condition).toLowerCase();
     },

     formatOrganismPart() {
       return removeUnderscores(this.dataset.organismPart).toLowerCase();
     },

     formatResolvingPower() {
       const rp = this.metadata.MS_Analysis.Detector_Resolving_Power;
       const {mz, Resolving_Power} = rp;
       return (Resolving_Power / 1000).toFixed(0) + 'k @ ' + mz;
     },

     haveEditAccess() {
       const {user} = this.$store.state;
       if (!user)
         return false;
       if (user.role == 'admin')
         return true;
       if (user.email == this.dataset.submitter.email)
         return true;
       return false;
     },

     editHref() {
       return {
         name: 'edit-metadata',
         params: {dataset_id: this.dataset.id}
       };
     },

     disabledClass() {
       return this.disabled ? "ds-item-disabled" : "";
     },

     formatFdr() {
       return JSON.parse(this.dataset.fdrCounts)[1];
     }
   },
   data() {
     return {
       showMetadataDialog: false,
       opticalImageSmall: null,
       disabled: false
     };
   },

   mounted() {
     this.$apollo.query({
       query: gql`query getOpticalImage($id: String!, $zoom: Float) { opticalImageUrl(datasetId: $id, zoom: $zoom) }`,
       variables: {
           id: this.dataset.id,
           zoom: 1.
       },
       fetchPolicy: 'network-only'
     }).then((res) => {
       this.opticalImageSmall = res.data.opticalImageUrl;
     })
   },

   methods: {
     resultsHref(databaseName) {
       return {
         path: '/annotations',
         query: {ds: this.dataset.id, db: databaseName}
       };
     },

     showMetadata() {
       this.showMetadataDialog = true;
     },

     addFilter(field) {
       let filter = Object.assign({}, this.$store.getters.filter);
       if (field == 'polarity')
         filter['polarity'] = capitalize(this.dataset.polarity);
       else if (field == 'submitter') {
         const {name, surname} = this.dataset.submitter;
         filter[field] = {name, surname};
       } else
         filter[field] = this.dataset[field] || this[field];
       this.$store.commit('updateFilter', filter);
     },

     openDeleteDialog() {
       this.$confirm("Are you sure you want to delete " +
                     this.formatDatasetName + "?")
         .then(_ => {
           getJWT().then(jwt => {
             this.disabled = true;
             return this.$apollo.mutate({
               mutation: deleteDatasetQuery,
               variables: {
                 jwt,
                 id: this.dataset.id
             }});
           })
           .then(resp => resp.data.deleteDataset)
           .then(status => {
             if (status != 'success') {
               this.$message({
                 message: "Deletion failed :( Contact us: contact@metaspace2020.eu" + "(error: " + status + ")",
                 type: 'error',
                 duration: 0,
                 showClose: true
               });
               this.disabled = false;
             }
           });
         }).catch(_ => {});
     }
   }
 }
</script>

<style>
  .no-opt-image {
    position: relative;
    display: block;
    width: 100px;
    height: 100px;
    border: 1px solid rgba(0, 0, 0, 0.6);
    border-style: dotted;
    cursor: pointer;
  }

  .no-opt-image::before {
    position: absolute;
    content: '';
    display: block;
    width: 30px;
    height: 30px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: .6;
    background-image: url('../assets/add_opt_image.png');
    background-size: contain;
    cursor: pointer;
  }

  .no-opt-image:hover::before{
    opacity: 1;
  }

  .edit-opt-image, .edit-opt-image-guest {
    position: relative;
    display: block;
    width: 100px;
    height: 100px;
    z-index: 0;
  }

  .edit-opt-image:hover::before {
    position: absolute;
    content: '';
    display: block;
    width: 30px;
    height: 30px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background-image: url('../assets/edit_opt_image.png');
    background-size: contain;
  }

  .edit-opt-image:hover {
    cursor: pointer;
  }

  .opt-image-thumbnail:hover {
    opacity: 0.2;
  }

 .dataset-item {
   border-radius: 5px;
   width: 100%;
   max-width: 800px;
   margin: 3px;
   padding: 0px;
   border: 1px solid #cce4ff;
   display: flex;
   flex-direction: row;
   justify-content: space-between;
 }

 .ds-status {
   display: flex;
   padding-left: 5px;
   flex-direction: column;
   justify-content: center;
 }

 .opt-image {
   padding: 10px 0 10px 10px;
   margin: 0px;
 }

 .ds-info{
   padding: 10px;
   margin: 0px;
   width: 60%;
 }

 .ds-actions {
   padding: 10px 15px 10px 0px;
   margin: 0px;
 }

 .metadata-link, .ds-delete > a {
   text-decoration: underline;
 }

 .metadata-link, .ds-add-filter, .ds-delete > a {
   cursor: pointer;
 }

 .s-bold {
   font-weight: bold;
 }

 .s-inst {
   color: sienna;
 }

 .striped-progressbar {
   height: 12px;
   border-radius: 2px;
   margin-bottom: 3px;
   width: 100%;
   background-size: 30px 30px;
   background-image: linear-gradient(135deg,
     rgba(255, 255, 255, .30) 25%, transparent 25%, transparent 50%,
     rgba(255, 255, 255, .30) 50%,
     rgba(255, 255, 255, .30) 75%, transparent 75%, transparent);

   animation: animate-stripes 3s linear infinite;
 }

 @keyframes animate-stripes {
   0% {background-position: 0 0;} 100% {background-position: 60px 0;}
 }

 .processing {
   background-color: lightgreen;
 }

 .queued {
   background-color: lightblue;
 }

 .db-link-list {
   font-size: initial;
 }

 .ds-delete, .ds-delete > a {
   color: #a00;
 }

 .ds-item-disabled {
   pointer-events: none;
   opacity: 0.5;
 }

</style>
