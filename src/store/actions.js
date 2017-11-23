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
    }
  }
}`;

export default {
  async login({commit}) {
    try {
      const jwt = await getJWT();
      const {name, email, sub, role} = decodePayload(jwt);
      if (role == 'anonymous') {
        return;
      }

      const {data} = await apolloClient.query({
        query: userProfileQuery,
        variables: {id: sub}
      });

      commit('login', data.user);
    } catch(err) {
      console.error(err);
    }
  },

  async logout({commit}) {
    console.log('logout');
    await fetch('/logout', {credentials: 'include'});
    commit('logout');
  }
};
