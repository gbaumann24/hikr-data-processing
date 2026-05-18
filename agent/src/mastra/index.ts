
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { climbingSubActivityAgent } from './agents/climbing-subactivity-agent';

export const mastra = new Mastra({
  agents: { climbingSubActivityAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
