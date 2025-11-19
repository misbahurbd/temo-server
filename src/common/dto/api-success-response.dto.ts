import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty({
    description: 'The page of the response',
    example: 1,
    required: true,
  })
  page: number;

  @ApiProperty({
    description: 'The limit of the response',
    example: 10,
    required: true,
  })
  limit: number;

  @ApiProperty({
    description: 'The skip of the response',
    example: 0,
    required: true,
  })
  skip: number;

  @ApiProperty({
    description: 'The total of the response',
    example: 100,
    required: true,
  })
  total: number;

  @ApiProperty({
    description: 'The total pages of the response',
    example: 100,
    required: true,
  })
  totalPages: number;
}

export class SuccessResponseDto<T = unknown> {
  @ApiProperty({
    description: 'The message of the response',
    example: 'Success',
    required: true,
  })
  message: string;

  @ApiProperty({
    description: 'The data of the response',
    required: true,
  })
  data: T;
}

export class SuccessResponseWithMetaDto<
  T = unknown,
> extends SuccessResponseDto<T> {
  @ApiProperty({
    description: 'The meta of the response',
    required: true,
    type: MetaDto,
  })
  meta: MetaDto;
}
