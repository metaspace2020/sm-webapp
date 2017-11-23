import {getJWT, decodePayload} from '../util';

import apolloClient from '../graphqlClient';
import gql from 'graphql-tag';

const userProfileQuery = gql`
query UserProfile($id: String!) {
  user(id: $id) {
    id
    name
    email
    groups {
      id
      name
      manager {
        id
      }
    }
    projects {
      id
      name
      manager {
        id
      }
      datasets {
        id
        name
      }
    }
  }
}`;

export default {
  async login({dispatch}) {
    try {
      const jwt = await getJWT();
      const {sub, role} = decodePayload(jwt);
      if (role == 'anonymous') {
        return;
      }

      dispatch('syncProfile', sub);
    } catch(err) {
      console.error(err);
    }
  },

  async logout({commit}) {
    console.log('logout');
    await fetch('/logout', {credentials: 'include'});
    commit('logout');
  },

  async syncProfile({commit}, userId) {
    if (!userId)
      return;

    const {data} = await apolloClient.query({
      query: userProfileQuery,
      variables: {id: userId},
      fetchPolicy: 'network-only'
    });

    commit('updateUserData', data.user);
  }
};
