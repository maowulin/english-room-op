import {
  mockAuditLog,
  mockOverviewMetrics,
  mockRooms,
  mockScoringTasks,
  mockStabilitySummary,
} from '../data/mock-ops-data';
import type { AdminLoginResult, OpsApiClient, RetryScoringResult } from './types';

/** Mock adapter — reads from `src/data/mock-ops-data.ts` only. */
export class MockOpsApiClient implements OpsApiClient {
  async login(username: string): Promise<AdminLoginResult> {
    return {
      accessToken: 'mock-session-token',
      tokenType: 'Bearer',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      username,
      role: 'admin',
    };
  }

  async getCurrentAdmin() {
    return { username: 'demo-admin', role: 'admin', authType: 'mock' };
  }

  async logout(): Promise<void> {}

  async getHealth() {
    return { status: 'ok' as const, generatedAt: new Date().toISOString() };
  }

  async getOverviewMetrics() {
    return { ...mockOverviewMetrics };
  }

  async getStabilitySummary() {
    return { ...mockStabilitySummary };
  }

  async listRooms() {
    return {
      ...mockRooms,
      rooms: mockRooms.rooms.map((room) => ({ ...room })),
    };
  }

  async listScoringTasks() {
    return {
      ...mockScoringTasks,
      tasks: mockScoringTasks.tasks.map((task) => ({ ...task })),
    };
  }

  async retryScoringTask(taskId: string): Promise<RetryScoringResult> {
    return {
      taskId,
      status: 'mock_accepted',
      message: '演示模式：未调用 /admin/v1/scoring/*/retry，仅展示 UI 反馈。',
    };
  }

  async listAuditLog() {
    return {
      ...mockAuditLog,
      entries: mockAuditLog.entries.map((entry) => ({ ...entry })),
    };
  }
}
