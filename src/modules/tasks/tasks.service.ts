import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTask(userId: string, createTaskDto: CreateTaskDto) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: createTaskDto.projectId, createdById: userId },
      });

      if (!project) {
        throw new ForbiddenException(
          'You are not allowed to create a task for this project',
        );
      }

      const task = await this.prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            ...createTaskDto,
            userId,
          },
        });

        if (createTaskDto.assigneeId) {
          await tx.activity.create({
            data: {
              taskId: task.id,
              userId,
              assigneeToId: createTaskDto.assigneeId,
            },
          });
        }

        return task;
      });

      return task;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTasks(userId: string, query: TaskQueryDto) {
    const page = query.page ? query.page : 1;
    const limit = query.limit ? query.limit : 10;
    const skip = (page - 1) * limit;
    const orderBy = query.sortBy ? query.sortBy : 'createdAt';
    const order = query.sortOrder ? query.sortOrder : 'desc';
    const search = query.search ? query.search : '';
    const projectId = query.projectId ? query.projectId : '';
    const assigneeId = query.assigneeId ? query.assigneeId : '';
    const status = query.status ? query.status : '';
    const priority = query.priority ? query.priority : '';
    const dueDateFrom = query.dueDateFrom ? query.dueDateFrom : '';
    const dueDateTo = query.dueDateTo ? query.dueDateTo : '';

    const filterCondition: Prisma.TaskWhereInput = {
      userId,
    };

    if (search) {
      filterCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { assignee: { name: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (projectId) {
      filterCondition.projectId = projectId;
    }

    if (assigneeId) {
      filterCondition.assigneeId = assigneeId;
    }

    if (status) {
      filterCondition.status = status;
    }

    if (priority) {
      filterCondition.priority = priority;
    }

    if (dueDateFrom && dueDateTo) {
      filterCondition.dueDate = { gte: dueDateFrom, lte: dueDateTo };
    }

    const total = await this.prisma.task.count({ where: filterCondition });

    const tasks = await this.prisma.task.findMany({
      where: filterCondition,
      orderBy: {
        [orderBy]: order,
      },
      skip,
      take: limit,
    });

    return {
      data: tasks,
      meta: {
        page,
        limit,
        skip,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
