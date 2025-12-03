import { GraphQLString } from "graphql";
import { createUserArgs } from "./user.args";

class UserFields {
  constructor() {}
  query = () => {
    return {
      getOneUser: {
        type: GraphQLString,
        resolve() {
          return "world";
        },
      },
      getAllUsers: {
        type: GraphQLString,
        resolve() {
          return "world";
        },
      },
    };
  };

  mutation = () => {
    return {
      createUser: {
        type: GraphQLString,    
        args: createUserArgs,
        resolve() {
          return "world";
        },
      },
    };
  };
}
export default new UserFields();
