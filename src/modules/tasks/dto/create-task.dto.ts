import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'generated/prisma/client';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The name of the task',
    example: 'Task 1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the task',
    example: 'Task 1 description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The status of the task',
    example: TaskStatus.PENDING,
    required: true,
  })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: TaskStatus;

  @ApiProperty({
    description: 'The priority of the task',
    example: TaskPriority.MEDIUM,
    required: true,
  })
  @IsEnum(TaskPriority)
  @IsNotEmpty()
  priority: TaskPriority;

  @ApiProperty({
    description: 'The due date of the task',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiProperty({
    description: 'The assignee ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiProperty({
    description: 'The project ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}
