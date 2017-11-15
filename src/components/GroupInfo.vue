<template>
  <div v-if="errorMessage" style="color: red; text-align:center; width:100%;">
    {{ errorMessage }}
  </div>

  <div class="group-info__page" v-else>

    <div class="group-info__header">
      <div v-if="info"><b>{{ info.name }}</b> <span style="color: #888;">| group information</span> </div>
    </div>

    <el-tabs type="border-card" @tab-click="onTabClick" :value="tab">
      <el-tab-pane label="General" v-if="info" name="info">
        <div>Institution: {{ info.institutionName }}</div>
        <div>Group leader: <b>{{ info.manager.name }}</b></div>

        <div class="group-info__settings" v-if="currentUserIsGroupLeader">
          <el-form :inline="true" :model="invitationForm" ref="invitationFormRef">
            Invite a new member:
            <el-form-item size="small"
                          prop="email"
                          :rules="[{required: true},{ type: 'email', message: 'Please input correct email address', trigger: 'blur,change' }]">
              <el-input type="text" v-model="invitationForm.email" placeholder="enter e-mail"></el-input>
            </el-form-item>

            <el-button type="primary" size="small" @click="sendInvitation">Send an invitation</el-button>
          </el-form>

          <div style="font-size: 10px; color: #888;">
            If you want to change the institution name or the group leader, please drop us an e-mail on
            <a href="mailto:contact@metaspace2020.eu">contact@metaspace2020.eu</a>
          </div>
        </div>

      </el-tab-pane>

      <el-tab-pane :label="userTabLabel" v-if="info" name="members">
        <el-table :data="info.members" size="medium">
          <el-table-column prop="name" label="Name" width="300" ></el-table-column>
          <el-table-column label="Role" width="150">
            <template slot-scope="props" >
              {{ memberRole(props.row) }}
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="150" v-if="currentUserIsGroupLeader">
            <template slot-scope="props">
              <el-button icon="el-icon-remove" type="danger" size="mini"
                         v-show="!isGroupLeader(props.row)"
                         @click="removeUser(props.row.id)">
                Remove
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane :label="datasetTabLabel" v-if="info" name="datasets">
        <router-link :to="datasetListHref">Open in Datasets tab</router-link>
        <div class="dataset-list">
          <dataset-item v-for="(dataset, i) in info.datasets"
                        :dataset="dataset" :key="dataset.id"
                        :class="[i%2 ? 'even': 'odd']">
          </dataset-item>
        </div>
      </el-tab-pane>
    </el-tabs>

  </div>
</template>

<script>
 import gql from 'graphql-tag';
 import DatasetItem from './DatasetItem.vue';
 import tokenAutorefresh from '../tokenAutorefresh';
 import {groupInfoQuery, removeUserQuery} from '../api/group';
 import {statusPopup, graphqlErrorPopup} from '../util';

 export default {
   name: 'group-info',
   props: {
     groupId: String,
     tab: String
   },
   components: {
     DatasetItem
   },
   computed: {
     userTabLabel() {
       return `Members (${this.info.members.length})`;
     },

     datasetTabLabel() {
       return `Datasets (${this.info.datasets.length})`;
     },

     datasetListHref() {
       // TODO: specify gid instead of institution name once it's implemented;
       // for the time being we can treat institution name <-> group as a bijection
       return {
         path: '/datasets',
         query: {
           lab: this.info.institutionName
         }
       }
     },

     currentUserIsGroupLeader() {
       return tokenAutorefresh.payload.sub == this.info.manager.id;
     }
   },
   data() {
     return {
       errorMessage: null,
       invitationForm: {email: ''}
     }
   },
   apollo: {
     info: {
       query: groupInfoQuery,
       fetchPolicy: 'network-only',
       variables() { return {id: this.groupId}; },
       update: data => {
         console.log("Manager id:", data.group.manager.id)
         return data.group;
       },
       error(err) {
         if (err.graphQLErrors)
           this.errorMessage = err.graphQLErrors[0].message;
         else
           this.errorMessage = err.message;
       }
     }
   },
   methods: {
     isGroupLeader(user) {
       return user.id == this.info.manager.id
     },

     memberRole(user) {
       return this.isGroupLeader(user) ? "Group leader" : "Group member";
     },

     removeUser(id) {
       this.$confirm("This user will be removed from your group and lose access to all group datasets but their own. Are you sure?")
           .then(() => {
             return this.$apollo.mutate({
               mutation: removeUserQuery,
               variables: {userId: id, groupId: this.groupId}
             })
           })
           .catch(graphqlErrorPopup)
           .then(resp => resp.data.removeUserFromGroup)
           .then(statusPopup)
           .then(() => { this.$apollo.queries.info.refetch(); })
     },

     onTabClick(tab) {
       const path = `/group/${this.groupId}/${tab.name}`;
       this.$router.push({path});
     },

     sendInvitation() {
       this.$refs.invitationFormRef.validate(valid => {
         if (!valid)
           return false;
         else {
           // TODO call GraphQL
         }
       });
     }
   }
 }
</script>

<style>
 .group-info__page {
   padding: 10px 20px;
 }

 .group-info__header {
   font-size: larger;
   padding: 10px 0;
 }

 .group-info__settings {
   padding: 20px 0;
 }
</style>
