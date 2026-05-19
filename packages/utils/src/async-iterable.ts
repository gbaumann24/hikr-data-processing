import type { MaybeAsyncIterable } from '@hikr/types';

export async function* toAsyncIterable<T>(source: MaybeAsyncIterable<T>): AsyncIterable<T> {
  if (Symbol.asyncIterator in source) {
    yield* source;
    return;
  }

  yield* source;
}
