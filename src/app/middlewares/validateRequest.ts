import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

const validateRequest = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            params: req.params,
            query: req.query,
            cookies: req.cookies
        });
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.params !== undefined) req.params = parsed.params;
        if (parsed.query !== undefined) req.query = parsed.query;
        if (parsed.cookies !== undefined) req.cookies = parsed.cookies;
        next();
    } catch (error) {
        next(error);
    }
}
export default validateRequest;