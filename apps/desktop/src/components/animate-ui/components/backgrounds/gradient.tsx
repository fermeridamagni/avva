import { type HTMLMotionProps, motion } from "motion/react";
import { cn } from "tailwind-variants";

type GradientBackgroundProps = HTMLMotionProps<"div">;

function GradientBackground({
  className,
  transition = {
    duration: 15,
    ease: "easeInOut",
    repeat: Number.POSITIVE_INFINITY,
  },
  ...props
}: GradientBackgroundProps) {
  return (
    <motion.div
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      className={cn(
        "size-full bg-linear-to-br bg-size-[400%_400%] from-blue-500 via-purple-500 to-pink-500",
        className
      )}
      data-slot="gradient-background"
      transition={transition}
      {...props}
    />
  );
}

export { GradientBackground, type GradientBackgroundProps };
