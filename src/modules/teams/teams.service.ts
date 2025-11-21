import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { Prisma, TaskStatus } from 'generated/prisma/client';
import { Meta } from 'src/common/interfaces/response.interface';
import { TeamQueryDto } from './dto/team-query.dto';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTeam(userId: string, createTeamDto: CreateTeamDto) {
    try {
      const team = await this.prisma.team.create({
        data: {
          name: createTeamDto.name,
          description: createTeamDto.description,
          createdById: userId,
          members: {
            createMany: {
              data: createTeamDto.members.map((member) => ({
                name: member.name,
                role: member.role,
                capacity: member.capacity,
                createdById: userId,
              })),
              skipDuplicates: true,
            },
          },
        },
      });

      return team;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAllTeams(
    userId: string,
    query: TeamQueryDto,
  ): Promise<{
    data: Prisma.TeamGetPayload<{
      include: { members: true };
    }>[];
    meta: Meta;
  }> {
    try {
      const { page, limit, sortBy, sortOrder, search } = query;
      const skip = (query.page - 1) * query.limit;
      const orderBy = sortBy || 'createdAt';
      const order = sortOrder || 'asc';

      const filterCondition: Prisma.TeamWhereInput = {
        createdById: userId,
      };

      // Add search filter if provided
      if (search) {
        filterCondition.OR = [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Get total count for pagination
      const total = await this.prisma.team.count({ where: filterCondition });

      // Get paginated teams
      const teams = await this.prisma.team.findMany({
        where: filterCondition,
        include: {
          members: true,
        },
        skip,
        take: limit,
        orderBy: {
          [orderBy]: order,
        },
      });

      return {
        data: teams,
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

  async getTeamsSelectList(userId: string) {
    try {
      const teams = await this.prisma.team.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return teams.map((team) => ({
        id: team.id,
        name: team.name,
        membersCount: team._count.members,
      }));
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTeamById(userId: string, teamId: string) {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId, createdById: userId },
        include: {
          members: true,
        },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      if (!team.isActive) {
        throw new NotFoundException('Team is not active');
      }

      return team;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async updateTeam(
    userId: string,
    teamId: string,
    updateTeamDto: UpdateTeamDto,
  ) {
    try {
      const { members, ...teamData } = updateTeamDto;

      const memberNeedToCreate = members.filter((member) => !member.id);
      const memberNeedToUpdate = members.filter((member) => member.id);

      const team = await this.prisma.team.update({
        where: { id: teamId, createdById: userId },
        data: {
          ...teamData,
          members: {
            deleteMany: {
              id: {
                notIn: memberNeedToUpdate.map((member) => member.id ?? ''),
              },
              createdById: userId,
              teamId: teamId,
            },
            createMany: {
              data: memberNeedToCreate.map((member) => ({
                name: member.name,
                role: member.role,
                capacity: member.capacity,
                createdById: userId,
              })),
            },
            updateMany: memberNeedToUpdate.map((member) => ({
              where: { id: member.id },
              data: {
                name: member.name,
                role: member.role,
                capacity: member.capacity,
              },
            })),
          },
        },
        include: {
          members: true,
        },
      });

      return team;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async updateTeamPartial(
    userId: string,
    teamId: string,
    updateTeamDto: Partial<
      Pick<UpdateTeamDto, 'name' | 'description' | 'isActive'>
    >,
  ) {
    try {
      const team = await this.prisma.team.update({
        where: { id: teamId, createdById: userId },
        data: updateTeamDto,
      });

      return team;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async deleteTeam(userId: string, teamId: string) {
    try {
      await this.prisma.team.delete({
        where: { id: teamId, createdById: userId },
        include: {
          members: true,
        },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTeamMembers(userId: string, teamId: string) {
    try {
      const members = await this.prisma.teamMember.findMany({
        where: { teamId: teamId, createdById: userId },
      });

      return members;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async createTeamMember(
    userId: string,
    teamId: string,
    createTeamMemberDto: CreateTeamMemberDto,
  ) {
    try {
      const member = await this.prisma.teamMember.create({
        data: {
          ...createTeamMemberDto,
          createdById: userId,
          teamId: teamId,
        },
      });

      return member;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async deleteTeamMember(userId: string, teamId: string, memberId: string) {
    try {
      await this.prisma.teamMember.delete({
        where: { id: memberId, createdById: userId, teamId: teamId },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getTeamMemberById(userId: string, teamId: string, memberId: string) {
    try {
      const member = await this.prisma.teamMember.findUnique({
        where: { id: memberId, createdById: userId, teamId: teamId },
      });

      if (!member) {
        throw new NotFoundException('Member not found');
      }

      if (!member.isActive) {
        throw new NotFoundException('Member is not active');
      }

      return member;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getMembersListWithCapacity(userId: string) {
    try {
      const members = await this.prisma.teamMember.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          name: true,
          capacity: true,
          _count: {
            select: {
              tasks: {
                where: {
                  status: { not: TaskStatus.DONE },
                  assigneeId: { not: null },
                  assignee: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          capacity: 'desc',
        },
      });

      return members.map((member) => ({
        ...member,
        tasksCount: member._count.tasks,
      }));
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async memberSelectList(userId: string) {
    try {
      const members = await this.prisma.teamMember.findMany({
        where: { createdById: userId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      return members;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
