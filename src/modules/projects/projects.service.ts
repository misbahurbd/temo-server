import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { Prisma, TaskStatus } from 'generated/prisma/client';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TaskQueryDto } from '../tasks/dto/task-query.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    try {
      const project = await this.prisma.project.create({
        data: {
          ...createProjectDto,
          createdById: userId,
        },
      });

      return project;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getProjects(userId: string, query: ProjectQueryDto) {
    try {
      const { page, limit, sortBy, sortOrder, search } = query;
      const skip = (query.page - 1) * query.limit;
      const orderBy = sortBy || 'createdAt';
      const order = sortOrder || 'desc';

      const filterCondition: Prisma.ProjectWhereInput = {
        createdById: userId,
      };
      if (search) {
        filterCondition.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const total = await this.prisma.project.count({ where: filterCondition });

      const projects = await this.prisma.project.findMany({
        where: filterCondition,
        include: {
          tasks: true,
          team: true,
        },
        orderBy: {
          [orderBy]: order,
        },
        skip,
        take: limit,
      });

      return {
        data: projects,
        meta: {
          page,
          limit,
          skip,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getProjectById(userId: string, projectId: string) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId, createdById: userId },
        include: {
          tasks: true,
          team: true,
          createdby: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              photo: true,
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (!project.isActive) {
        throw new NotFoundException('Project is not active');
      }

      return project;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getProjectListWithMembers(userId: string) {
    try {
      const project = await this.prisma.project.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          name: true,
          team: {
            select: {
              members: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  capacity: true,
                  _count: {
                    select: {
                      tasks: {
                        where: {
                          NOT: {
                            status: TaskStatus.DONE,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return project.map((project) => {
        const { team, ...projectData } = project;

        return {
          ...projectData,
          members: team.members.map((member) => {
            const { _count, ...memberData } = member;

            return {
              ...memberData,
              tasksCount: _count.tasks,
            };
          }),
        };
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async updateProjectById(
    userId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    try {
      const project = await this.prisma.project.update({
        where: { id: projectId, createdById: userId },
        data: updateProjectDto,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      return project;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async projectByIdWithTasks(
    userId: string,
    projectId: string,
    query: TaskQueryDto,
  ) {
    try {
      const page = query.page ? query.page : 1;
      const limit = query.limit ? query.limit : 10;
      const skip = (page - 1) * limit;
      const orderBy = query.sortBy ? query.sortBy : 'createdAt';
      const order = query.sortOrder ? query.sortOrder : 'desc';
      const filterCondition = this.tasksService.buildTaskFilterCondition(
        userId,
        {
          ...query,
          projectId,
        },
      );

      const total = await this.prisma.task.count({ where: filterCondition });

      const project = await this.prisma.project.findUnique({
        where: { id: projectId, createdById: userId },
        include: {
          tasks: {
            where: filterCondition,
            orderBy: {
              [orderBy]: order,
            },
            skip,
            take: limit,
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  capacity: true,
                  _count: {
                    select: {
                      tasks: { where: { status: { not: TaskStatus.DONE } } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      return {
        data: {
          ...project,
          tasks: project.tasks.map((task) => ({
            ...task,
            assignee: task.assignee
              ? {
                  id: task.assignee.id,
                  name: task.assignee.name,
                  capacity: task.assignee.capacity,
                  tasksCount: task.assignee._count.tasks,
                }
              : null,
          })),
        },
        meta: {
          page,
          limit,
          skip,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async projectSelectList(userId: string) {
    try {
      const projects = await this.prisma.project.findMany({
        where: { createdById: userId },
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' },
      });

      return projects;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
