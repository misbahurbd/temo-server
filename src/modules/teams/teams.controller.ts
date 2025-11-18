import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import {
  TeamMemberResponseDto,
  TeamResponseDto,
  TeamResponseWithMembersDto,
} from './dto/team-response.dto';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { SessionUser } from '../auth/serializers/session.serializer';
import { UpdateTeamDto } from './dto/update-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({
    status: 201,
    description: 'Team created successfully',
    type: TeamResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async createTeam(
    @Req() req: Request & { user: SessionUser },
    @Body() createTeamDto: CreateTeamDto,
  ) {
    const team = await this.teamsService.createTeam(req.user.id, createTeamDto);

    return {
      message: 'Team created successfully',
      data: team,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({
    status: 200,
    description: 'Teams fetched successfully',
    type: [TeamResponseDto],
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTeams(@Req() req: Request & { user: SessionUser }) {
    const teams = await this.teamsService.getAllTeams(req.user.id);
    return {
      message: 'Teams fetched successfully',
      data: teams,
    };
  }

  @Get(':teamId')
  @ApiOperation({ summary: 'Get a team by ID with its members' })
  @ApiResponse({
    status: 200,
    description: 'Team fetched successfully',
    type: TeamResponseWithMembersDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTeamById(
    @Req() req: Request & { user: SessionUser },
    @Param('teamId') teamId: string,
  ) {
    const team = await this.teamsService.getTeamById(req.user.id, teamId);

    return {
      message: 'Team fetched successfully',
      data: team,
    };
  }

  @Put(':teamId')
  @ApiOperation({ summary: 'Update a team by ID' })
  @ApiResponse({
    status: 200,
    description: 'Team updated successfully',
    type: TeamResponseDto,
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async updateTeam(
    @Req() req: Request & { user: SessionUser },
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    const team = await this.teamsService.updateTeam(
      req.user.id,
      teamId,
      updateTeamDto,
    );

    return {
      message: 'Team updated successfully',
      data: team,
    };
  }

  @Delete(':teamId')
  @ApiOperation({ summary: 'Delete a team by ID' })
  @ApiResponse({
    status: 200,
    description: 'Team deleted successfully',
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async deleteTeam(
    @Req() req: Request & { user: SessionUser },
    @Param('teamId') teamId: string,
  ) {
    await this.teamsService.deleteTeam(req.user.id, teamId);
    return {
      message: 'Team deleted successfully',
    };
  }

  @Get(':teamId/members')
  @ApiOperation({ summary: 'Get all members of a team' })
  @ApiResponse({
    status: 200,
    description: 'Members fetched successfully',
    type: [TeamMemberResponseDto],
  })
  @UseGuards(AuthenticatedGuard)
  @ApiCookieAuth()
  async getTeamMembers(
    @Req() req: Request & { user: SessionUser },
    @Param('teamId') teamId: string,
  ) {
    const members = await this.teamsService.getTeamMembers(req.user.id, teamId);
    return {
      message: 'Members fetched successfully',
      data: members,
    };
  }
}
