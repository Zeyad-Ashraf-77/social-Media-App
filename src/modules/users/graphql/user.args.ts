import { GraphQLString } from "graphql";



export const createUserArgs = {
          fullName: { type: GraphQLString },
          email: { type: GraphQLString },
          password: { type: GraphQLString },
          cPassword: { type: GraphQLString },
          age: { type: GraphQLString },
          gender: { type: GraphQLString },
          phone: { type: GraphQLString },
          address: { type: GraphQLString },
        }
    
