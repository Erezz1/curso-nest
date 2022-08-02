import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
    @IsOptional()
    @IsPositive()
    // Transform limit to number
    @Type( () => Number )
    limit?: number;

    @IsOptional()
    @Min(0)
    // Transform limit to number
    @Type( () => Number )
    offset?: number;
}
