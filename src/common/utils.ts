import { Request, Response } from 'express';
import Joi from 'joi';

export const validateAndSendIfFail = (
    req: Request,
    res: Response,
    model: Joi.ObjectSchema<any>
) => {
    const { error } = model.validate(req.body);

    if (error) {
        res.status(400).send({ error: error });
        return;
    }
};
