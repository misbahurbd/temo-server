import { ApiProperty } from '@nestjs/swagger';

export class TeamResponseDto {
  @ApiProperty({
    description: 'The ID of the team',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the team',
    example: 'Team Developers',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The description of the team',
    example: 'Team for developers',
    required: false,
  })
  description?: string;

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

export class TeamMemberResponseDto {
  @ApiProperty({
    description: 'The ID of the team member',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the team member',
    example: 'John Doe',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The role of the team member',
    example: 'Developer',
    required: true,
  })
  role: string;

  @ApiProperty({
    description: 'The capacity of the team member',
    example: 1,
    required: true,
  })
  capacity: number;

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

export class TeamResponseWithMembersDto extends TeamResponseDto {
  @ApiProperty({
    description: 'The members of the team',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'Developer',
        capacity: 1,
        teamId: '123e4567-e89b-12d3-a456-426614174000',
        createdById: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ],
    required: true,
  })
  members: TeamMemberResponseDto[];
}

export class TeamSelectListResponseDto {
  @ApiProperty({
    description: 'The ID of the team',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the team',
    example: 'Team Developers',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'The number of members in the team',
    example: 1,
    required: true,
  })
  membersCount: number;
}

export class TeamMemberSelectListResponseDto {
  @ApiProperty({
    description: 'The ID of the team member',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The name of the team member',
    example: 'John Doe',
    required: true,
  })
  name: string;
}
