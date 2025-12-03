
import { hash , compare} from "bcrypt";

export const Hash = async(planText:string, saltRounds:number = Number(process.env.SALT_ROUNDS)):Promise<string> => {
    return await hash(planText,saltRounds)
}

export const Compare = async(planText:string, hashText:string):Promise<boolean> => {
    return await compare(planText,hashText)
}