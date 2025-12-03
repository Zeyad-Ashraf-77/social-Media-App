import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";
import userFields from "../users/graphql/user.fields";



export const schemaGql = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'query',
      fields: {
       ...userFields.query(),
      },
    }),
  });
  
