export function cx(...classNames: Array<false | null | string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
