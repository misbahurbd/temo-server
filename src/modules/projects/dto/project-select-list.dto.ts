import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProjectSelectListResponseDto {
  @ApiProperty({ description: 'The ID of the project' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The name of the project' })
  @IsString()
  name: string;
}
