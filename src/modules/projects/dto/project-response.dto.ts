import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from 'generated/prisma/enums';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'The ID of the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the project',
    example: 'Project 1',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The description of the project',
    example: 'Project 1 description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The team ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  teamId: string;

  @ApiProperty({
    description: 'The created by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  createdById: string;

  @ApiProperty({
    description: 'The created at timestamp',
    example: '2025-01-01T00:00:00.000Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The updated at timestamp',
    example: '2025-01-01T00:00:00.000Z',
    required: true,
  })
  updatedAt: Date;
}

export class TaskResponseDto {
  @ApiProperty({
    description: 'The ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the task',
    example: 'Task 1',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The description of the task',
    example: 'Task 1 description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'The status of the task',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
    required: true,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'The priority of the task',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    required: true,
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'The due date of the task',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'The assignee ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  assigneeId?: string;

  @ApiProperty({
    description: 'The project ID of the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  projectId: string;

  @ApiProperty({
    description: 'The created at timestamp',
    example: '2025-01-01T00:00:00.000Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The updated at timestamp',
    example: '2025-01-01T00:00:00.000Z',
    required: true,
  })
  updatedAt: Date;
}

export class ProjectMemberResponseDto {
  @ApiProperty({
    description: 'The ID of the member',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the member',
    example: 'John Doe',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The role of the member',
    example: 'Developer',
    required: true,
  })
  role: string;

  @ApiProperty({
    description: 'The capacity of the member',
    example: 1,
    required: true,
  })
  capacity: number;

  @ApiProperty({
    description: 'The tasks count of the member',
    example: 0,
    required: true,
  })
  tasksCount: number;
}

export class ProjectListWithMembersResponseDto {
  @ApiProperty({
    description: 'The ID of the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the project',
    example: 'Project 1',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The members of the project',
    type: ProjectMemberResponseDto,
    isArray: true,
    required: true,
  })
  members: ProjectMemberResponseDto[];
}
