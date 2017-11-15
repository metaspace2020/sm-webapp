import gql from 'graphql-tag';
const groupInfoQuery = gql`
  query GroupInfoQuery($id: String!) {
    group(id: $id) {
      name
      institutionName
      manager {
        id
        name
        email
      }

      members {
        id
        name
      }

      datasets {
        id
        name
        institution
        submitter {
          name
          surname
          email
        }
        polarity
        ionisationSource
        analyzer {
          type
          resolvingPower(mz: 400)
        }
        organism
        organismPart
        condition
        growthConditions
        metadataJson
        status
      }
    }
}`;

const removeUserQuery = gql`
  mutation ($userId: String!, $groupId: String!) {
    removeUserFromGroup(userId: $userId, groupId: $groupId) {
      success
      errorMessage
    }
  }
`;

export {
  groupInfoQuery,
  removeUserQuery
}
