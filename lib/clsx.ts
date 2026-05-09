// 가벼운 className 유틸 (clsx 패키지 대체)
export default function clsx(
  ...args: Array<string | false | null | undefined>
): string {
  return args.filter(Boolean).join(" ");
}
