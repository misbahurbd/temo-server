import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'The page number',
    example: 1,
    required: false,
    default: 1,
  })
  page: number;

  @ApiProperty({
    description: 'The limit number',
    example: 10,
    required: false,
    default: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'The field to sort by',
    example: 'createdAt',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'The order to sort by',
    example: 'asc',
    required: false,
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
