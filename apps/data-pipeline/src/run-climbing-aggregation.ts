import { PrismaClient } from '@hikr/db';
import { mastra } from 'agent/mastra';
import {
  runClimbingTourAggregationService,
  type ClimbingTourAggregationProgressEvent,
} from './climbing-aggregation';
import { createMastraClimbingTourAggregationSummarizer } from './climbing-aggregation/agent-caller';

const prisma = new PrismaClient();

try {
  const agent = mastra.getAgent('climbing-tour-aggregation-agent');
  const summarize = createMastraClimbingTourAggregationSummarizer(agent);

  console.log('Running climbing tour aggregation');
  const result = await runClimbingTourAggregationService({
    prisma,
    summarize,
    onProgress: logProgress,
  });

  console.log('\nDone.');
  console.log(`Routes seen: ${result.totalRoutes}`);
  console.log(`Aggregated: ${result.aggregatedRoutes}`);
  console.log(`Skipped: ${result.skippedRoutes}`);
  console.log(`Stale deleted: ${result.staleDeleted}`);
} finally {
  await prisma.$disconnect();
}

function logProgress(event: ClimbingTourAggregationProgressEvent): void {
  if (event.type === 'route-aggregated') {
    console.log(
      `Aggregated route ${event.routeId.toString()} from ${event.sourceReportCount} report(s); agent=${event.agentStatus}`,
    );
    return;
  }

  if (event.type === 'route-skipped') {
    console.log(
      `Skipped route ${event.routeId.toString()} from ${event.sourceReportCount} report(s); reason=${event.reason}`,
    );
    return;
  }

  console.log(`Deleted ${event.count} stale aggregate row(s)`);
}
