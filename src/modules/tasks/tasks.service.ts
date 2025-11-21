import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import {
  ActivityType,
  Prisma,
  Task,
  TaskPriority,
  TaskStatus,
} from 'generated/prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskActivityQueryDto } from './dto/task-activity-query.dto';

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
            assigneeId: createTaskDto.assigneeId || null,
            userId,
          },
        });

        await tx.activity.create({
          data: {
            taskId: task.id,
            userId,
            assigneeToId: createTaskDto.assigneeId || null,
            activityType: ActivityType.TASK_CREATED,
          },
        });

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
    const filterCondition = this.buildTaskFilterCondition(userId, query);

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
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              capacity: true,
              _count: {
                select: {
                  tasks: {
                    where: { status: { not: TaskStatus.DONE } },
                  },
                },
              },
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          activities: {
            include: {
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
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      return {
        ...task,
        assignee: {
          ...task.assignee,
          tasksCount: task.assignee?._count.tasks,
        },
      };
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

        const payload = this.getActivityPayload(task, updateTaskDto);

        await tx.activity.create({
          data: payload,
        });

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
      const projectWithTasks = await this.prisma.project.findUnique({
        where: {
          id: projectId,
          createdById: userId,
        },
        include: {
          tasks: {
            where: {
              status: { not: TaskStatus.DONE },
            },
            select: {
              id: true,
              name: true,
              priority: true,
              assigneeId: true,
              assignee: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          team: {
            include: {
              members: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  capacity: true,
                  tasks: {
                    where: {
                      status: { not: TaskStatus.DONE },
                    },
                    select: {
                      id: true,
                      name: true,
                      priority: true,
                      assigneeId: true,
                      assignee: {
                        select: {
                          id: true,
                          name: true,
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

      if (!projectWithTasks) {
        throw new NotFoundException('Project not found');
      }

      const tasks = projectWithTasks.tasks;
      const teamMembers = projectWithTasks.team.members;

      // Calculate workload using all team members
      const { overloaded, available } = this.calculateMemberWorkload(
        tasks,
        teamMembers,
      );

      if (overloaded.length === 0) {
        return {
          message:
            'No overloaded members found. All tasks are within capacity.',
          data: {
            overloadedMembersCount: 0,
            tasksReassigned: 0,
          },
        };
      }

      type TaskWithAssignee = (typeof tasks)[0];

      const taskUpdates: Array<{
        taskId: string;
        newAssigneeId: string;
        task: TaskWithAssignee;
        fromMemberId: string;
        toMemberId: string;
      }> = [];

      for (const member of overloaded) {
        // Skip HIGH priority tasks - only move LOW and MEDIUM
        const movableTasks = this.filterMovableTasks(member.tasks, false);
        const tasksToMove = Math.min(member.excessTasks, movableTasks.length);

        for (let i = 0; i < tasksToMove && available.length > 0; i++) {
          const task = movableTasks[i];
          const availableMember = available.find((m) => m.freeCapacity > 0);

          if (!availableMember) break;

          const newAssignee = teamMembers.find(
            (m) => m.id === availableMember.memberId,
          );
          if (!newAssignee) continue;

          taskUpdates.push({
            taskId: task.id,
            newAssigneeId: availableMember.memberId,
            task,
            fromMemberId: task.assigneeId!,
            toMemberId: availableMember.memberId,
          });

          // Update available capacity
          availableMember.currentTasks += 1;
          availableMember.freeCapacity -= 1;

          // Remove if full, otherwise re-sort
          if (availableMember.freeCapacity === 0) {
            const index = available.indexOf(availableMember);
            available.splice(index, 1);
          } else {
            available.sort((a, b) => b.freeCapacity - a.freeCapacity);
          }
        }
      }

      // Execute reassignments
      await this.executeReassignments(
        taskUpdates.map((u) => ({
          taskId: u.taskId,
          newAssigneeId: u.newAssigneeId,
          fromMemberId: u.fromMemberId,
          toMemberId: u.toMemberId,
        })),
        userId,
      );

      return {
        message: `Successfully reassigned ${taskUpdates.length} task(s)`,
        data: {
          overloadedMembersCount: overloaded.length,
          tasksReassigned: taskUpdates.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in reassignTasks:', error);
      throw error;
    }
  }

  async reassignAllOverloadedTasks(userId: string) {
    try {
      // Get all projects for the user
      const projects = await this.prisma.project.findMany({
        where: { createdById: userId },
        include: {
          team: {
            include: {
              members: {
                where: { isActive: true },
                select: { id: true, name: true, capacity: true },
              },
            },
          },
        },
      });

      if (projects.length === 0) {
        return {
          message: 'No projects found for this user.',
          reassignments: [],
          summary: {
            projectsProcessed: 0,
            overloadedMembersCount: 0,
            tasksReassigned: 0,
          },
        };
      }

      type TaskUpdate = {
        taskId: string;
        newAssigneeId: string;
        task: {
          id: string;
          name: string;
          priority: TaskPriority;
          assigneeId: string | null;
          assignee: { name: string } | null;
        };
        fromMemberId: string;
        fromMemberName: string;
        toMemberId: string;
        toMemberName: string;
        projectId: string;
        projectName: string;
      };

      const allTaskUpdates: TaskUpdate[] = [];

      let totalOverloadedMembers = 0;

      // Process each project
      for (const project of projects) {
        if (!project.team || project.team.members.length === 0) {
          continue;
        }

        // Get all active tasks for this project
        const tasks = await this.prisma.task.findMany({
          where: {
            projectId: project.id,
            status: { not: TaskStatus.DONE },
            assigneeId: { not: null },
          },
          select: {
            id: true,
            name: true,
            priority: true,
            assigneeId: true,
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Get ALL team members of the project's team (both active and inactive) for accurate counting
        const allTeamMembers = await this.prisma.teamMember.findMany({
          where: {
            teamId: project.team.id,
          },
          select: {
            id: true,
            name: true,
            capacity: true,
            isActive: true,
            tasks: {
              where: {
                status: { not: TaskStatus.DONE },
              },
              select: {
                id: true,
                name: true,
                priority: true,
                assigneeId: true,
                assignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Calculate workload using all team members
        const { overloaded, available } = this.calculateMemberWorkload(
          tasks,
          allTeamMembers,
        );

        if (overloaded.length === 0) {
          continue;
        }

        totalOverloadedMembers += overloaded.length;

        // Filter available members to only active ones for reassignment
        const activeAvailableMembers = available.filter((m) => {
          const member = allTeamMembers.find((tm) => tm.id === m.memberId);
          return member?.isActive === true;
        });

        type TaskWithAssignee = (typeof tasks)[0];
        const projectTaskUpdates: Array<{
          taskId: string;
          newAssigneeId: string;
          task: TaskWithAssignee;
          fromMemberId: string;
          fromMemberName: string;
          toMemberId: string;
          toMemberName: string;
        }> = [];

        // Process each overloaded member in this project
        for (const member of overloaded) {
          // Skip HIGH priority tasks - only move LOW and MEDIUM
          const movableTasks = this.filterMovableTasks(member.tasks, false);
          // Move only excess tasks (not all tasks)
          const tasksToMove = Math.min(member.excessTasks, movableTasks.length);

          for (
            let i = 0;
            i < tasksToMove && activeAvailableMembers.length > 0;
            i++
          ) {
            const task = movableTasks[i];
            const availableMember = activeAvailableMembers.find(
              (m) => m.freeCapacity > 0,
            );

            if (!availableMember) break;

            const newAssignee = allTeamMembers.find(
              (m) => m.id === availableMember.memberId,
            );
            if (!newAssignee) continue;

            projectTaskUpdates.push({
              taskId: task.id,
              newAssigneeId: availableMember.memberId,
              task,
              fromMemberId: task.assigneeId!,
              fromMemberName: task.assignee?.name || 'Unknown',
              toMemberId: availableMember.memberId,
              toMemberName: newAssignee.name,
            });

            // Update available capacity
            availableMember.currentTasks += 1;
            availableMember.freeCapacity -= 1;

            // Remove if full, otherwise re-sort
            if (availableMember.freeCapacity === 0) {
              const index = activeAvailableMembers.indexOf(availableMember);
              activeAvailableMembers.splice(index, 1);
            } else {
              activeAvailableMembers.sort(
                (a, b) => b.freeCapacity - a.freeCapacity,
              );
            }
          }
        }

        // Add project info to task updates
        allTaskUpdates.push(
          ...projectTaskUpdates.map(
            (u): TaskUpdate => ({
              taskId: u.taskId,
              newAssigneeId: u.newAssigneeId,
              task: {
                id: u.task.id,
                name: u.task.name,
                priority: u.task.priority,
                assigneeId: u.task.assigneeId,
                assignee: u.task.assignee,
              },
              fromMemberId: u.fromMemberId,
              fromMemberName: u.fromMemberName,
              toMemberId: u.toMemberId,
              toMemberName: u.toMemberName,
              projectId: project.id,
              projectName: project.name,
            }),
          ),
        );
      }

      if (allTaskUpdates.length === 0) {
        return {
          message:
            'No overloaded tasks found across all projects. All tasks are within capacity.',
          reassignments: [],
          summary: {
            projectsProcessed: projects.length,
            overloadedMembersCount: totalOverloadedMembers,
            tasksReassigned: 0,
          },
        };
      }

      // Execute all reassignments in a single transaction
      await this.executeReassignments(
        allTaskUpdates.map((u) => ({
          taskId: u.taskId,
          newAssigneeId: u.newAssigneeId,
          fromMemberId: u.fromMemberId,
          toMemberId: u.toMemberId,
        })),
        userId,
      );

      const reassignments = allTaskUpdates.map((u) => ({
        taskId: u.taskId,
        taskName: u.task.name,
        projectId: u.projectId,
        projectName: u.projectName,
        fromMemberId: u.fromMemberId,
        fromMemberName: u.fromMemberName,
        toMemberId: u.toMemberId,
        toMemberName: u.toMemberName,
        priority: u.task.priority,
      }));

      return {
        message: `Successfully reassigned ${reassignments.length} task(s) across ${projects.length} project(s) (HIGH priority tasks kept with current assignee)`,
        reassignments,
        summary: {
          projectsProcessed: projects.length,
          overloadedMembersCount: totalOverloadedMembers,
          tasksReassigned: reassignments.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in reassignAllOverloadedTasks:', error);
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

  async getTaskActivityWithPagination(
    userId: string,
    query: TaskActivityQueryDto,
  ) {
    try {
      const page = query.page ? query.page : 1;
      const limit = query.limit ? query.limit : 10;
      const skip = (page - 1) * limit;
      const orderBy = query.sortBy ? query.sortBy : 'createdAt';
      const order = query.sortOrder ? query.sortOrder : 'desc';

      const filterCondition: Prisma.ActivityWhereInput = {
        userId,
      };

      if (query.search) {
        filterCondition.OR = [
          { task: { name: { contains: query.search, mode: 'insensitive' } } },
          {
            assigneeFrom: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            assigneeTo: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            task: {
              project: {
                name: { contains: query.search, mode: 'insensitive' },
              },
            },
          },
          {
            task: {
              assignee: {
                name: { contains: query.search, mode: 'insensitive' },
              },
            },
          },
        ];
      }

      const total = await this.prisma.activity.count({
        where: filterCondition,
      });

      const activityLog = await this.prisma.activity.findMany({
        where: filterCondition,
        skip,
        take: limit,
        orderBy: {
          [orderBy]: order,
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

      return {
        data: activityLog,
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

  async getOverloadedMemberCount(userId: string) {
    try {
      const members = await this.prisma.teamMember.findMany({
        where: {
          createdById: userId,
        },
        select: {
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
      });

      return members.filter((m) => m.capacity < m._count.tasks).length;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async getProjectWithTeam(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId, createdById: userId },
      include: {
        team: {
          include: {
            members: {
              where: { isActive: true },
              select: { id: true, name: true, capacity: true },
            },
          },
        },
      },
    });

    if (!project || !project.team) {
      throw new NotFoundException('Project not found');
    }

    return {
      id: project.id,
      team: {
        id: project.team.id,
        members: project.team.members,
      },
    };
  }

  private calculateMemberWorkload<
    T extends {
      id: string;
      name: string;
      assigneeId: string | null;
      priority: TaskPriority;
    },
  >(
    tasks: T[],
    members: Array<{
      id: string;
      capacity: number;
      tasks: T[];
    }>,
  ) {
    const taskCounts = new Map<string, number>();
    const memberCapacity = new Map<string, number>();
    const memberProjectTasks = new Map<string, T[]>();

    // Initialize with team members and count ALL tasks (from all projects)
    members.forEach((member) => {
      // Count ALL tasks assigned to this member (from any project)
      const allTaskCount = member.tasks.length;
      taskCounts.set(member.id, allTaskCount);
      memberCapacity.set(member.id, member.capacity);
      memberProjectTasks.set(member.id, []);
    });

    // Collect project tasks per member (only tasks from current project)
    tasks.forEach((task) => {
      if (task.assigneeId && memberProjectTasks.has(task.assigneeId)) {
        memberProjectTasks.get(task.assigneeId)?.push(task);
      }
    });

    // Find overloaded members (based on ALL tasks across all projects)
    const overloaded = Array.from(taskCounts.entries())
      .filter(([memberId, count]) => count > memberCapacity.get(memberId)!)
      .map(([memberId, count]) => ({
        memberId,
        currentTasks: count, // Total tasks across all projects
        capacity: memberCapacity.get(memberId)!,
        excessTasks: count - memberCapacity.get(memberId)!,
        tasks: memberProjectTasks.get(memberId) || [], // Only project tasks (can be moved)
      }));

    // Find available members (based on ALL tasks across all projects)
    const available = Array.from(taskCounts.entries())
      .map(([memberId, count]) => ({
        memberId,
        currentTasks: count, // Total tasks across all projects
        capacity: memberCapacity.get(memberId)!,
        freeCapacity: memberCapacity.get(memberId)! - count,
      }))
      .filter((m) => m.freeCapacity > 0)
      .sort((a, b) => b.freeCapacity - a.freeCapacity);

    return { overloaded, available, taskCounts };
  }

  private filterMovableTasks<T extends { priority: TaskPriority }>(
    tasks: T[],
    includeHighPriority: boolean = false,
  ): T[] {
    const movable = includeHighPriority
      ? tasks
      : tasks.filter(
          (t) =>
            t.priority === TaskPriority.LOW ||
            t.priority === TaskPriority.MEDIUM,
        );

    return movable.sort((a, b) => {
      const priorityOrder = {
        [TaskPriority.LOW]: 1,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.HIGH]: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async executeReassignments(
    taskUpdates: Array<{
      taskId: string;
      newAssigneeId: string;
      fromMemberId: string;
      toMemberId: string;
    }>,
    userId: string,
  ) {
    if (taskUpdates.length === 0) return;

    // Group by assignee for batch updates
    const updatesByAssignee = new Map<string, string[]>();
    taskUpdates.forEach((update) => {
      const taskIds = updatesByAssignee.get(update.newAssigneeId) || [];
      taskIds.push(update.taskId);
      updatesByAssignee.set(update.newAssigneeId, taskIds);
    });

    await this.prisma.$transaction(async (tx) => {
      // Batch update tasks
      await Promise.all(
        Array.from(updatesByAssignee.entries()).map(([assigneeId, taskIds]) =>
          tx.task.updateMany({
            where: { id: { in: taskIds } },
            data: { assigneeId },
          }),
        ),
      );

      // Create activity logs
      await tx.activity.createMany({
        data: taskUpdates.map((update) => ({
          taskId: update.taskId,
          userId,
          assigneeFromId: update.fromMemberId,
          assigneeToId: update.toMemberId,
          fromValue: update.fromMemberId,
          toValue: update.toMemberId,
          activityType: ActivityType.TASK_REASSIGNED,
        })),
      });
    });
  }

  buildTaskFilterCondition(
    userId: string,
    query: TaskQueryDto,
  ): Prisma.TaskWhereInput {
    const filterCondition: Prisma.TaskWhereInput = { userId };

    if (!query) return filterCondition;

    if (query.projectId) {
      filterCondition.projectId = query.projectId;
    }

    if (query.search) {
      filterCondition.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { assignee: { name: { contains: query.search, mode: 'insensitive' } } },
        { project: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.assigneeId) {
      filterCondition.assigneeId = query.assigneeId;
    }

    if (query.status) {
      filterCondition.status = query.status;
    }

    if (query.priority) {
      filterCondition.priority = query.priority;
    }

    if (query.dueDateFrom && query.dueDateTo) {
      filterCondition.dueDate = {
        gte: query.dueDateFrom,
        lte: query.dueDateTo,
      };
    }

    return filterCondition;
  }

  private getActivityPayload(
    task: Task,
    updateTaskDto: UpdateTaskDto,
  ): Prisma.ActivityUncheckedCreateInput {
    const hasAssigned =
      updateTaskDto.assigneeId &&
      task.assigneeId === null &&
      updateTaskDto.assigneeId !== null;
    const hasUnassigned =
      updateTaskDto.assigneeId === null &&
      task.assigneeId !== null &&
      updateTaskDto.assigneeId === null;
    const hasChangedAssignee =
      updateTaskDto.assigneeId && task.assigneeId !== updateTaskDto.assigneeId;
    const hasChangedStatus =
      updateTaskDto.status && task.status !== updateTaskDto.status;
    const hasChangedPriority =
      updateTaskDto.priority && task.priority !== updateTaskDto.priority;
    const hasChangedDueDate =
      updateTaskDto.dueDate && task.dueDate !== updateTaskDto.dueDate;

    const payload: Prisma.ActivityUncheckedCreateInput = {
      taskId: task.id,
      userId: task.userId,
      assigneeToId: updateTaskDto.assigneeId || null,
      assigneeFromId: task.assigneeId || null,
    };

    if (hasAssigned) {
      payload.activityType = ActivityType.TASK_ASSIGNED;
      payload.fromValue = null;
      payload.toValue = updateTaskDto.assigneeId;

      return payload;
    }

    if (hasUnassigned) {
      payload.activityType = ActivityType.TASK_UNASSIGNED;
      payload.fromValue = task.assigneeId;
      payload.toValue = null;

      return payload;
    }

    if (hasChangedStatus) {
      payload.activityType = ActivityType.TASK_STATUS_UPDATED;
      payload.fromValue = task.status || null;
      payload.toValue = updateTaskDto.status || null;

      return payload;
    }

    if (hasChangedPriority) {
      payload.activityType = ActivityType.TASK_PRIORITY_UPDATED;
      payload.fromValue = task.priority || null;
      payload.toValue = updateTaskDto.priority || null;

      return payload;
    }

    if (hasChangedDueDate) {
      payload.activityType = ActivityType.TASK_DUE_DATE_UPDATED;
      payload.fromValue = String(task.dueDate) || null;
      payload.toValue = String(updateTaskDto.dueDate) || null;

      return payload;
    }

    if (hasChangedAssignee) {
      payload.activityType = ActivityType.TASK_REASSIGNED;
      payload.fromValue = task.assigneeId;
      payload.toValue = updateTaskDto.assigneeId;

      return payload;
    }

    return payload;
  }
}
