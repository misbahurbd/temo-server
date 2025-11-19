import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { TaskResponseDto } from './dto/task-response.dto';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Request } from 'express';
import { SessionUser } from '../auth/serializers/session.serializer';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiSuccessResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async createTask(
    @Req() req: Request & { user: SessionUser },
    @Body() createTaskDto: CreateTaskDto,
  ) {
    const task = await this.tasksService.createTask(req.user.id, createTaskDto);
    return {
      message: 'Task created successfully',
      data: task,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Tasks fetched successfully',
    type: TaskResponseDto,
    isArray: true,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTasks(
    @Req() req: Request & { user: SessionUser },
    @Query() query: TaskQueryDto,
  ) {
    const tasks = await this.tasksService.getTasks(req.user.id, query);
    return {
      message: 'Tasks fetched successfully',
      data: tasks.data,
      meta: tasks.meta,
    };
  }
}
