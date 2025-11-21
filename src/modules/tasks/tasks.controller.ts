import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskActivityQueryDto } from './dto/task-activity-query.dto';

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

  @Get('count')
  @ApiOperation({ summary: 'Get task and project count' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Task and project count fetched successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTaskAndProjectCount(@Req() req: Request & { user: SessionUser }) {
    const { taskCount, projectCount } =
      await this.tasksService.getTaskAndProjectCount(req.user.id);
    return {
      message: 'Task and project count fetched successfully',
      data: { taskCount, projectCount },
    };
  }

  @Get('activity-log')
  @ApiOperation({ summary: 'Get task activity log' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Activity log fetched successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTaskActivityLog(@Req() req: Request & { user: SessionUser }) {
    const activityLog = await this.tasksService.getTaskActivityLog(req.user.id);
    return {
      message: 'Activity log fetched successfully',
      data: activityLog,
    };
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get task activities with pagination' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Task activities fetched successfully',
    isArray: true,
    withMeta: true,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTaskActivityLogWithPagination(
    @Req() req: Request & { user: SessionUser },
    @Query() query: TaskActivityQueryDto,
  ) {
    const activityLog = await this.tasksService.getTaskActivityWithPagination(
      req.user.id,
      query,
    );
    return {
      message: 'Activity log fetched successfully',
      data: activityLog.data,
      meta: activityLog.meta,
    };
  }

  @Get('overloaded-member-count')
  @ApiOperation({ summary: 'Get overloaded member count' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Overloaded member count fetched successfully',
    type: Number,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getOverloadedMemberCount(@Req() req: Request & { user: SessionUser }) {
    const count = await this.tasksService.getOverloadedMemberCount(req.user.id);
    return {
      message: 'Overloaded member count fetched successfully',
      data: count,
    };
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Task fetched successfully',
    type: TaskResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTask(
    @Req() req: Request & { user: SessionUser },
    @Param('taskId') taskId: string,
  ) {
    const task = await this.tasksService.getTaskById(req.user.id, taskId);
    return {
      message: 'Task fetched successfully',
      data: task,
    };
  }

  @Put(':taskId')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async updateTask(
    @Req() req: Request & { user: SessionUser },
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.updateTask(
      req.user.id,
      taskId,
      updateTaskDto,
    );
    return {
      message: 'Task updated successfully',
      data: task,
    };
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Task deleted successfully',
    type: TaskResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async deleteTask(
    @Req() req: Request & { user: SessionUser },
    @Param('taskId') taskId: string,
  ) {
    await this.tasksService.deleteTask(req.user.id, taskId);
    return {
      message: 'Task deleted successfully',
    };
  }

  @Post('reassign/:projectId')
  @ApiOperation({ summary: 'Auto reassign tasks for a project' })
  @ApiSuccessResponse({
    status: 200,
    description: 'Tasks reassigned successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async reassignTasks(
    @Req() req: Request & { user: SessionUser },
    @Param('projectId') projectId: string,
  ) {
    const result = await this.tasksService.reassignTasks(
      req.user.id,
      projectId,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('reassign-all')
  @ApiOperation({
    summary: 'Auto reassign all overloaded tasks across all projects',
  })
  @ApiSuccessResponse({
    status: 200,
    description: 'All overloaded tasks reassigned successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async reassignAllOverloadedTasks(
    @Req() req: Request & { user: SessionUser },
  ) {
    console.log(req.user.id);
    const result = await this.tasksService.reassignAllOverloadedTasks(
      req.user.id,
    );
    return {
      message: result.message,
      data: result.reassignments,
      meta: result.summary,
    };
  }
}
