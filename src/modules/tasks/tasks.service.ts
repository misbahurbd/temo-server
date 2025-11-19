import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { Prisma, TaskPriority, TaskStatus } from 'generated/prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';

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
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            capacity: true,
            _count: {
              select: {
                tasks: {
                  where: {
                    status: { not: TaskStatus.DONE },
                  },
                },
              },
            },
          },
        },
      },
      skip,
      take: limit,
    });

    return {
      data: tasks.map((task) => ({
        ...task,
        project: {
          id: task.project.id,
          name: task.project.name,
        },
        assignee: task.assignee
          ? {
              id: task.assignee?.id,
              name: task.assignee?.name,
              capacity: task.assignee?.capacity,
              tasksCount: task.assignee?._count.tasks,
            }
          : null,
      })),
      meta: {
        page,
        limit,
        skip,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTaskById(userId: string, taskId: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId, userId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return task;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async updateTask(
    userId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
  ) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId, userId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const updatedTask = await this.prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
          where: { id: taskId, userId },
          data: {
            ...updateTaskDto,
            dueDate: updateTaskDto.dueDate
              ? new Date(updateTaskDto.dueDate)
              : undefined,
          },
        });

        if (updateTaskDto.assigneeId) {
          await tx.activity.create({
            data: {
              taskId: taskId,
              userId,
              assigneeFromId: task.assigneeId,
              assigneeToId: updateTaskDto.assigneeId,
            },
          });
        }

        return updatedTask;
      });

      return updatedTask;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async deleteTask(userId: string, taskId: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId, userId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.task.delete({
          where: { id: taskId, userId },
        });

        await tx.activity.deleteMany({
          where: { taskId: taskId },
        });
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async reassignTasks(userId: string, projectId: string) {
    try {
      // Verify project ownership
      const project = await this.prisma.project.findUnique({
        where: { id: projectId, createdById: userId },
        include: {
          team: {
            include: {
              members: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Get all tasks for this project (excluding DONE tasks)
      const allTasks = await this.prisma.task.findMany({
        where: {
          projectId,
          status: { not: TaskStatus.DONE },
          assigneeId: { not: null },
        },
        include: {
          assignee: true,
        },
      });

      // Calculate current task count per member
      const memberTaskCounts = new Map<string, number>();
      const memberCapacity = new Map<string, number>();
      const memberTasks = new Map<string, typeof allTasks>();

      // Initialize maps with team members
      project.team.members.forEach((member) => {
        memberTaskCounts.set(member.id, 0);
        memberCapacity.set(member.id, member.capacity);
        memberTasks.set(member.id, []);
      });

      // Count tasks per member
      allTasks.forEach((task) => {
        if (task.assigneeId) {
          const currentCount = memberTaskCounts.get(task.assigneeId) || 0;
          memberTaskCounts.set(task.assigneeId, currentCount + 1);
          memberTasks.get(task.assigneeId)?.push(task);
        }
      });

      // Find overloaded members (tasks > capacity)
      const overloadedMembers: Array<{
        memberId: string;
        currentTasks: number;
        capacity: number;
        excessTasks: number;
      }> = [];

      memberTaskCounts.forEach((taskCount, memberId) => {
        const capacity = memberCapacity.get(memberId) || 0;
        if (taskCount > capacity) {
          overloadedMembers.push({
            memberId,
            currentTasks: taskCount,
            capacity,
            excessTasks: taskCount - capacity,
          });
        }
      });

      // If no overloaded members, return early
      if (overloadedMembers.length === 0) {
        return {
          message:
            'No overloaded members found. All tasks are within capacity.',
          reassignments: [],
        };
      }

      // Find members with free capacity
      const availableMembers: Array<{
        memberId: string;
        currentTasks: number;
        capacity: number;
        freeCapacity: number;
      }> = [];

      memberTaskCounts.forEach((taskCount, memberId) => {
        const capacity = memberCapacity.get(memberId) || 0;
        const freeCapacity = capacity - taskCount;
        if (freeCapacity > 0) {
          availableMembers.push({
            memberId,
            currentTasks: taskCount,
            capacity,
            freeCapacity,
          });
        }
      });

      // Sort available members by free capacity (descending) to prioritize members with more free space
      availableMembers.sort((a, b) => b.freeCapacity - a.freeCapacity);

      // Collect all reassignments to perform
      const taskUpdates: Array<{
        taskId: string;
        newAssigneeId: string;
        task: (typeof allTasks)[0];
        fromMemberId: string;
        fromMemberName: string;
        toMemberId: string;
        toMemberName: string;
      }> = [];

      // First pass: collect all reassignments
      for (const overloaded of overloadedMembers) {
        const tasks = memberTasks.get(overloaded.memberId) || [];

        // Filter to only LOW and MEDIUM priority tasks (keep HIGH priority with current assignee)
        const movableTasks = tasks.filter(
          (task) =>
            task.priority === TaskPriority.LOW ||
            task.priority === TaskPriority.MEDIUM,
        );

        // Sort tasks by priority (LOW first, then MEDIUM) to move less critical tasks first
        movableTasks.sort((a, b) => {
          if (
            a.priority === TaskPriority.LOW &&
            b.priority === TaskPriority.MEDIUM
          ) {
            return -1;
          }
          if (
            a.priority === TaskPriority.MEDIUM &&
            b.priority === TaskPriority.LOW
          ) {
            return 1;
          }
          return 0;
        });

        const tasksToMove = Math.min(
          overloaded.excessTasks,
          movableTasks.length,
        );

        for (let i = 0; i < tasksToMove && availableMembers.length > 0; i++) {
          const task = movableTasks[i];
          const assignee = task.assignee;

          // Find the best available member (one with free capacity)
          const availableMemberIndex = availableMembers.findIndex(
            (m) => m.freeCapacity > 0,
          );

          if (availableMemberIndex === -1) {
            // No more available members
            break;
          }

          const availableMember = availableMembers[availableMemberIndex];
          const newAssignee = project.team.members.find(
            (m) => m.id === availableMember.memberId,
          );

          if (!newAssignee) {
            continue;
          }

          // Collect task update
          taskUpdates.push({
            taskId: task.id,
            newAssigneeId: availableMember.memberId,
            task,
            fromMemberId: task.assigneeId!,
            fromMemberName: assignee?.name || 'Unknown',
            toMemberId: availableMember.memberId,
            toMemberName: newAssignee.name,
          });

          // Update counts for next iteration
          memberTaskCounts.set(
            overloaded.memberId,
            memberTaskCounts.get(overloaded.memberId)! - 1,
          );
          memberTaskCounts.set(
            availableMember.memberId,
            memberTaskCounts.get(availableMember.memberId)! + 1,
          );

          // Update available capacity
          availableMember.currentTasks += 1;
          availableMember.freeCapacity -= 1;

          // Remove member from available list if capacity is full
          if (availableMember.freeCapacity === 0) {
            availableMembers.splice(availableMemberIndex, 1);
          } else {
            // Re-sort available members
            availableMembers.sort((a, b) => b.freeCapacity - a.freeCapacity);
          }
        }
      }

      // Group task updates by new assigneeId for batch updateMany operations
      const taskUpdatesByAssignee = new Map<string, string[]>();
      taskUpdates.forEach((update) => {
        const taskIds = taskUpdatesByAssignee.get(update.newAssigneeId) || [];
        taskIds.push(update.taskId);
        taskUpdatesByAssignee.set(update.newAssigneeId, taskIds);
      });

      // Prepare activity creates array
      const activityCreates = taskUpdates.map((update) => ({
        taskId: update.taskId,
        userId,
        assigneeFromId: update.fromMemberId,
        assigneeToId: update.toMemberId,
      }));

      // Perform all updates in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Batch update tasks grouped by new assigneeId
        await Promise.all(
          Array.from(taskUpdatesByAssignee.entries()).map(
            ([newAssigneeId, taskIds]) =>
              tx.task.updateMany({
                where: {
                  id: { in: taskIds },
                },
                data: { assigneeId: newAssigneeId },
              }),
          ),
        );

        // Batch create all activities
        if (activityCreates.length > 0) {
          await tx.activity.createMany({
            data: activityCreates,
          });
        }
      });

      // Build reassignments response
      const reassignments = taskUpdates.map((update) => ({
        taskId: update.taskId,
        taskName: update.task.name,
        fromMemberId: update.fromMemberId,
        fromMemberName: update.fromMemberName,
        toMemberId: update.toMemberId,
        toMemberName: update.toMemberName,
        priority: update.task.priority,
      }));

      return {
        message: `Successfully reassigned ${reassignments.length} task(s)`,
        reassignments,
        summary: {
          overloadedMembersCount: overloadedMembers.length,
          tasksReassigned: reassignments.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in reassignTasks:', error);
      throw error;
    }
  }

  async getTaskActivityLog(userId: string) {
    try {
      const activityLog = await this.prisma.activity.findMany({
        where: {
          userId,
          assigneeFromId: { not: '' },
          assigneeToId: { not: '' },
        },
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          task: {
            select: {
              id: true,
              name: true,
            },
          },
          assigneeFrom: {
            select: {
              id: true,
              name: true,
            },
          },
          assigneeTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return activityLog;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTaskAndProjectCount(userId: string) {
    try {
      const taskCount = await this.prisma.task.count({ where: { userId } });
      const projectCount = await this.prisma.project.count({
        where: { createdById: userId },
      });
      return {
        taskCount,
        projectCount,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
