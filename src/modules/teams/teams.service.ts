import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';

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

  async getAllTeams(userId: string) {
    try {
      const teams = await this.prisma.team.findMany({
        where: { createdById: userId },
      });

      return teams;
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
            createMany: {
              data: memberNeedToCreate.map((member) => ({
                name: member.name,
                role: member.role,
                capacity: member.capacity,
                createdById: userId,
                teamId: teamId,
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
            deleteMany: {
              id: {
                notIn: memberNeedToUpdate.map((member) => member.id ?? ''),
              },
              createdById: userId,
              teamId: teamId,
            },
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
