import { cn } from "@magnidev/tailwindcss-utils";

export default function DotsBackground({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("relative h-full w-full", className)} {...props}>
      <div className="mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] absolute h-full w-full bg-[radial-gradient(var(--color-muted)_2px,transparent_2px)] bg-size-[16px_16px]" />
    </div>
  );
}
