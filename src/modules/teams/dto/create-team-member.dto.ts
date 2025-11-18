import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTeamMemberDto {
  @ApiProperty({
    description: 'The name of the team member',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The role of the team member',
    example: 'Developer',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'The capacity of the team member',
    example: 1,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @ApiProperty({
    description: 'The team ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
