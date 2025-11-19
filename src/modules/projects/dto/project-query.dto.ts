import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProjectQueryDto {
  @ApiProperty({
    description: 'The page number',
    example: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: 'The limit number',
    example: 10,
    required: false,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit: number = 10;

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
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Search term to filter projects by name or description',
    example: 'developers',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
