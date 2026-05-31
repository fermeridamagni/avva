import { cn } from "tailwind-variants";

export default function BlocksBackground({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)} {...props}>
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[6rem_4rem] bg-white" />
    </div>
  );
}
