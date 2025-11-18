import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateTeamMemberDto } from './create-team-member.dto';

export class UpdateTeamDto {
  @ApiProperty({
    description: 'The name of the team',
    example: 'Team Developers',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the team',
    example: 'Team for developers',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the team is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;

  @ApiProperty({
    description: 'The array of team members',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        role: 'Developer',
        capacity: 5,
      },
    ],
    required: false,
  })
  @IsArray()
  @IsNotEmpty()
  members: [CreateTeamMemberDto & { id?: string }];
}
