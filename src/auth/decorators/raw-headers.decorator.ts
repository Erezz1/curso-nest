import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RawHeaders = createParamDecorator(
    ( data: never, ctx: ExecutionContext ) => {
        const request = ctx.switchToHttp().getRequest();
        const { rawHeaders } = request;

        return rawHeaders;
    }
)
