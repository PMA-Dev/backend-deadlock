import Joi from 'joi';

export interface CommonResponse {
    error?: Error | Joi.ValidationError | string;
}
