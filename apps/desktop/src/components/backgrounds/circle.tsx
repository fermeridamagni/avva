import { cn } from "tailwind-variants";

export default function CircleBackground({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("absolute inset-0 -z-10", className)} {...props}>
      <div className="absolute top-0 right-0 bottom-auto left-auto h-100 w-100 translate-x-[-50%] translate-y-[20%] rounded-full bg-primary opacity-50 blur-[80px]" />
    </div>
  );
}
