type MaybePromise<T> = T | Promise<T>;
type MaybeAsyncIterable<T> = Iterable<T> | AsyncIterable<T>;

export type BaseDataPipelineDatabase<SourceRow, ReportBaseWriteInput> = {
  findHikrOrgPostsForClimbingPreprocessing: () => MaybePromise<MaybeAsyncIterable<SourceRow>>;
  upsertReportBase: (input: ReportBaseWriteInput) => MaybePromise<void>;
};
