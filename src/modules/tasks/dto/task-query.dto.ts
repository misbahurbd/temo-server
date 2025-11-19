import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

export class TaskQueryDto {
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
    description: 'Search term to filter tasks by name or description',
    example: 'developers',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'The project ID to filter tasks by',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'The assignee ID to filter tasks by',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({
    description: 'The status to filter tasks by',
    example: TaskStatus.PENDING,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({
    description: 'The priority to filter tasks by',
    example: TaskPriority.MEDIUM,
    required: false,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    description: 'The due date from to filter tasks by',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  dueDateFrom?: Date;

  @ApiProperty({
    description: 'The due date to to filter tasks by',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  dueDateTo?: Date;
}
