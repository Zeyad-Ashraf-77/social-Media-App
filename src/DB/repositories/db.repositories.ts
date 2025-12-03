import mongoose, {
  FilterQuery,
  ProjectionType,
  RootFilterQuery,
  UpdateQuery,
} from "mongoose";
import { HydratedDocument, Model, QueryOptions } from "mongoose";

export class DBRepositories<TDocument> {
  constructor(protected model: Model<TDocument>) {}

  create = async (
    data: Partial<TDocument>
  ): Promise<HydratedDocument<TDocument>> => {
    return await this.model.create(data as TDocument);
  };

  findOne = async (
    {
    filter,
    select,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }
  ): Promise<HydratedDocument<TDocument> | null> => {
    return await this.model.findOne(filter,select,options);
  };

  findMany = async (
    {
    filter,
    select,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }
  ): Promise<HydratedDocument<TDocument>[]> => {
    return await this.model.find(filter,select,options);
  };
  findById = async (
    id: string
  ): Promise<HydratedDocument<TDocument> | null> => {
    return await this.model.findById(new mongoose.Types.ObjectId(id));
  };
  findOneAndUpdate = async (
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> => {
    return await this.model.findOneAndUpdate(
      filter as FilterQuery<TDocument>,
      update as UpdateQuery<TDocument>,
      { new: true }
    );
  };
  findOneAndDelete = async (
    filter: RootFilterQuery<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> => {
    return await this.model.findOneAndDelete(filter as FilterQuery<TDocument>);
  };

  async find(
  {
    filter,
    select,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument>;
    options?: QueryOptions<TDocument>;
  }): Promise<HydratedDocument<TDocument>[]> {
    return await this.model.find(filter, select, options);
  }
  async paginate(
  {
    filter,
    select,
    query,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument>;
    query:{page:number,limit:number},
    options?: QueryOptions<TDocument>;
  }) {
    let{page,limit}=query
      if(page<1) page = 1
    page = page * 1 || 1
    const skip=(page-1)*limit
    const finalOption = {
      ...options,
      skip,
      limit
    }
    const countDocs = await this.model.countDocuments({deletedAt:{$exists:false},...filter} as FilterQuery<TDocument>);
    const post = await this.model.find(filter, select, finalOption);
    const numberOfPages = Math.ceil(countDocs / limit) || 1;
    return {pageNumber:page, post , totalDocs:countDocs , numberOfPages};
  }

  updateOne = async (
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>
  ): Promise<any> => {
    return await this.model.updateOne(
      filter as FilterQuery<TDocument>,
      update as UpdateQuery<TDocument>
    );
  };
}
