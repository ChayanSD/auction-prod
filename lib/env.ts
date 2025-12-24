import { z } from 'zod';

const r = z.string().nonempty("Its Empty")

const envSchema = z.object({
    NEXT_PUBLIC_API_BASE_URL: r,
    DATABASE_URL: r,
    UPSTASH_REDIS_REST_URL: r,
    UPSTASH_REDIS_REST_TOKEN: r,
    STRIPE_PUBLISHABLE_KEY: r,
    STRIPE_SECRET_KEY: r,
    SESSION_SECRET: r,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: r,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: r,
})



const result = envSchema.safeParse(process.env);


if (!result.success) {
    const errors = result.error.flatten().fieldErrors;

    const tableData = Object.entries(errors).map(([key, messages]) => ({
        Variable: key,
        Error: messages?.join(', '),
    }));

    console.error('Invalid environment variables:\n');
    console.table(tableData);
    process.exit(1);
}


declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> { }
    }
}