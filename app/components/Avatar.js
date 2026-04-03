import { initial } from "@/lib/utils";

const SIZE = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-xl",
};

export default function Avatar({ username = "?", size = "sm" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-800 font-medium text-zinc-300 ${SIZE[size]}`}
    >
      {initial(username)}
    </span>
  );
}
