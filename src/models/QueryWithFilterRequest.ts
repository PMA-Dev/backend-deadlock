import { CommonResponse } from '@/common/CommonResponse';
import Joi from 'joi';
import { Filter, Document } from 'mongodb';

export interface QueryWithFilterRequest extends CommonResponse {
    filter: Filter<Document>;
}

export const queryWithFilterRequestSchema = Joi.object({
    filter: Joi.object().required(),
});
