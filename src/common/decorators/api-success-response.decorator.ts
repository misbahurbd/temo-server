import { applyDecorators, Type as DtoType } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import {
  SuccessResponseDto,
  SuccessResponseWithMetaDto,
} from '../dto/api-success-response.dto';

export const ApiSuccessResponse = <
  TDataDto extends DtoType<unknown>,
>(options?: {
  type?: TDataDto;
  status?: number;
  description?: string;
  withMeta?: boolean;
  isArray?: boolean;
}) => {
  const {
    status = 200,
    description = 'Success',
    withMeta = false,
    isArray = false,
    type: dataDto,
  } = options || {};

  const ResponseDto = withMeta
    ? SuccessResponseWithMetaDto
    : SuccessResponseDto;

  // Build ApiResponse config
  const apiResponseConfig: {
    status: number;
    description: string;
    schema: {
      allOf: Array<{ $ref: string } | { properties: { data: object } }>;
    };
    example?: object;
  } = {
    status,
    description,
    schema: {
      allOf: dataDto
        ? [
            { $ref: getSchemaPath(ResponseDto) },
            {
              properties: {
                data: isArray
                  ? {
                      type: 'array',
                      items: { $ref: getSchemaPath(dataDto) },
                    }
                  : {
                      $ref: getSchemaPath(dataDto),
                    },
              },
            },
          ]
        : [{ $ref: getSchemaPath(ResponseDto) }],
    },
  };

  const decorators = dataDto
    ? [
        ApiExtraModels(ResponseDto, dataDto),
        ApiResponse(apiResponseConfig as Parameters<typeof ApiResponse>[0]),
      ]
    : [
        ApiExtraModels(ResponseDto),
        ApiResponse(apiResponseConfig as Parameters<typeof ApiResponse>[0]),
      ];

  return applyDecorators(...decorators);
};
