import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { CreateTeamMemberDto } from 'src/modules/teams/dto/create-team-member.dto';

export class CreateTeamDto {
  @ApiProperty({
    description: 'The name of the team',
    example: 'Team Developers',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the team',
    example: 'Team for developers',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The array of team members',
    example: [
      {
        name: 'John Doe',
        role: 'Developer',
        capacity: 5,
      },
      {
        name: 'Jane Doe',
        role: 'Developer',
        capacity: 10,
      },
      {
        name: 'Jim Doe',
        role: 'Developer',
        capacity: 7,
      },
    ],
    required: true,
  })
  @IsArray()
  @IsNotEmpty()
  members: Omit<CreateTeamMemberDto, 'teamId'>[];
}
