import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { Prisma } from 'generated/prisma/client';
import { Meta } from 'src/common/interfaces/response.interface';

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
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{
    data: Prisma.TeamGetPayload<{
      include: { members: true };
    }>[];
    meta: Meta;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: {
        createdById: string;
        isActive?: boolean;
        OR?: Array<{
          name?: { contains: string; mode?: 'insensitive' };
          description?: { contains: string; mode?: 'insensitive' };
        }>;
      } = {
        createdById: userId,
        isActive: true,
      };

      // Add search filter if provided
      if (search) {
        where.OR = [
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
      const total = await this.prisma.team.count({ where });

      // Get paginated teams
      const teams = await this.prisma.team.findMany({
        where,
        include: {
          members: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
}
