import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
    PORT: Joi.number().default(3000),
    API_PREFIX: Joi.string().default('api/v1'),
    DATABASE_URL: Joi.string().required().messages({
        'any.required': 'La variable de entorno DATABASE_URL es obligatoria para conectar con PostgreSQL.',
    }),
    OPEN_FOOD_FACTS_API_URL: Joi.string().uri().required(),
    OCR_PROVIDER_API_KEY: Joi.string().required(),
});