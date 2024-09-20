import { CommonResponse } from '../common/CommonResponse';
import { Document } from 'mongodb';

export interface QueryWithFilterResponse extends CommonResponse {
    data?: Document;
}
