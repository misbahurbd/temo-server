import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ApiCookieAuth, ApiOperation } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { Request } from 'express';
import { SessionUser } from '../auth/serializers/session.serializer';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ProjectListWithMembersResponseDto,
  ProjectResponseDto,
} from './dto/project-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiSuccessResponse({
    type: ProjectResponseDto,
    status: 201,
    description: 'Project created successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async createProject(
    @Req() req: Request & { user: SessionUser },
    @Body() createProjectDto: CreateProjectDto,
  ) {
    const project = await this.projectsService.createProject(
      req.user.id,
      createProjectDto,
    );

    return {
      message: 'Project created successfully',
      data: project,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiSuccessResponse({
    type: ProjectResponseDto,
    description: 'Projects fetched successfully',
    isArray: true,
    withMeta: true,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getProjects(
    @Req() req: Request & { user: SessionUser },
    @Query() query: ProjectQueryDto,
  ) {
    const result = await this.projectsService.getProjects(req.user.id, query);
    return {
      message: 'Projects fetched successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('list-with-members')
  @ApiOperation({ summary: 'Get all projects with members' })
  @ApiSuccessResponse({
    type: ProjectListWithMembersResponseDto,
    description: 'Projects with members fetched successfully',
    isArray: true,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getProjectListWithMembers(@Req() req: Request & { user: SessionUser }) {
    const result = await this.projectsService.getProjectListWithMembers(
      req.user.id,
    );

    return {
      message: 'Projects with members fetched successfully',
      data: result,
    };
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiSuccessResponse({
    type: ProjectResponseDto,
    description: 'Project fetched successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getProjectById(
    @Req() req: Request & { user: SessionUser },
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.getProjectById(
      req.user.id,
      projectId,
    );

    return {
      message: 'Project fetched successfully',
      data: project,
    };
  }

  @Get(':projectId/tasks')
  @ApiOperation({ summary: 'Get a project by ID with its tasks' })
  @ApiSuccessResponse({
    type: ProjectResponseDto,
    description: 'Project fetched successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getProjectByIdWithTasks(
    @Req() req: Request & { user: SessionUser },
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.projectByIdWithTasks(
      req.user.id,
      projectId,
    );
    return {
      message: 'Project fetched successfully',
      data: project,
    };
  }

  @Put(':projectId')
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiSuccessResponse({
    type: ProjectResponseDto,
    description: 'Project updated successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async updateProjectById(
    @Req() req: Request & { user: SessionUser },
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.projectsService.updateProjectById(
      req.user.id,
      projectId,
      updateProjectDto,
    );
    return {
      message: 'Project updated successfully',
      data: project,
    };
  }
}
