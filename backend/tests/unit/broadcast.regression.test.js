import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';

const source = path => fileURLToPath(new URL(`../../src/${path}`, import.meta.url));
const BroadcastMessage = { find: jest.fn(), updateOne: jest.fn(), findById: jest.fn() };
const AlertLog = { create: jest.fn() };
const User = { find: jest.fn() };
const sendNotification = jest.fn();
const sendNotificationWithTemplate = jest.fn();
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

for (const [name, model] of Object.entries({ BroadcastMessage, AlertLog, User })) {
  jest.unstable_mockModule(source(`models/${name}.js`), () => ({ default: model }));
}
jest.unstable_mockModule(source('config/logger.js'), () => ({ default: logger }));
jest.unstable_mockModule(source('services/communication.service.js'), () => ({
  sendNotification, sendNotificationWithTemplate, sendMultiChannelNotification: jest.fn(),
}));
const { processScheduledBroadcasts } = await import('../../src/services/broadcast.service.js');

let scheduled;
let current;
let savedStates;

beforeEach(() => {
  jest.resetAllMocks();
  savedStates = [];
  scheduled = {
    _id: 'broadcast-1', institutionId: 'school-1', createdBy: 'teacher-1',
    recipients: { type: 'all' }, channels: ['email'], type: 'general',
    title: 'Practice drill', message: 'Follow your teacher', status: 'scheduled',
    save: jest.fn().mockResolvedValue(undefined),
  };
  current = {
    ...scheduled, status: 'sending', metadata: {},
    save: jest.fn(async () => savedStates.push({ status: current.status, stats: { ...current.stats } })),
  };
  BroadcastMessage.find.mockResolvedValue([scheduled]);
  BroadcastMessage.updateOne.mockResolvedValue({ modifiedCount: 1 });
  BroadcastMessage.findById.mockResolvedValue(current);
  AlertLog.create.mockResolvedValue({ _id: 'incident-1' });
  User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'student-1', name: 'Student', email: 'student@example.test' }]) });
  sendNotification.mockResolvedValue({ success: true });
});

describe('A17 scheduled broadcast completion', () => {
  it('successful delivery stays sent after incident logging and final diagnostic logging', async () => {
    const result = await processScheduledBroadcasts();
    expect(result).toEqual({ success: true, processed: 1 });
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(current.status).toBe('sent');
    expect(savedStates.map(state => state.status)).toEqual(['sent', 'sent']);
    expect(current.stats).toMatchObject({ totalRecipients: 1, sent: 1, failed: 0, pending: 0, skipped: 0 });
    expect(AlertLog.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ stats: expect.objectContaining({ successful: 1, failed: 0, skipped: 0 }) }) }));
    expect(current.metadata.incidentLogId).toBe('incident-1');
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Scheduled broadcast processed: broadcast-1 (1 successful, 0 failed, 0 skipped)');
  });

  it('mixed notification outcomes retain exact success/failure/skip counts', async () => {
    User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([
      { _id: 'student-1', email: 'a@example.test' }, { _id: 'student-2', email: 'b@example.test' }, { _id: 'student-3', email: 'c@example.test' },
    ]) });
    sendNotification.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('Provider failed')).mockResolvedValueOnce({ skipped: true });
    await processScheduledBroadcasts();
    expect(current.status).toBe('sent');
    expect(current.stats).toMatchObject({ totalRecipients: 3, sent: 1, failed: 1, skipped: 1, pending: 0 });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('an all-failed delivery is actually marked failed', async () => {
    sendNotification.mockResolvedValue({ success: false });
    await processScheduledBroadcasts();
    expect(current.status).toBe('failed');
    expect(current.stats).toMatchObject({ sent: 0, failed: 1 });
  });

  it('all-skipped (no push token, push-only) is failed — not sent', async () => {
    scheduled.channels = ['push'];
    current.channels = ['push'];
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: 'student-1', name: 'Student', email: 'student@example.test' }, // no fcmToken
      ]),
    });
    await processScheduledBroadcasts();
    expect(sendNotification).not.toHaveBeenCalled();
    expect(current.status).toBe('failed');
    expect(current.stats.skippedNoToken).toBeGreaterThan(0);
  });

  it('does not silently add email when push has no token', async () => {
    scheduled.channels = ['push'];
    current.channels = ['push'];
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: 'student-1', email: 'student@example.test' },
      ]),
    });
    await processScheduledBroadcasts();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('a scheduler that loses the atomic claim sends nothing', async () => {
    BroadcastMessage.updateOne.mockResolvedValue({ modifiedCount: 0 });
    await processScheduledBroadcasts();
    expect(sendNotification).not.toHaveBeenCalled();
    expect(BroadcastMessage.findById).not.toHaveBeenCalled();
    expect(current.save).not.toHaveBeenCalled();
  });
});

describe('WD10 channel resolution', () => {
  it('honors explicit channels without admin override defaults', async () => {
    const { resolveEffectiveChannels, deriveBroadcastSendStatus } = await import(
      '../../src/services/broadcast.service.js'
    );
    expect(resolveEffectiveChannels(['email', 'push', 'email'])).toEqual(['email', 'push']);
    expect(resolveEffectiveChannels(undefined)).toEqual([]);
    expect(deriveBroadcastSendStatus({ successful: 0 })).toBe('failed');
    expect(deriveBroadcastSendStatus({ successful: 2 })).toBe('sent');
  });
});
