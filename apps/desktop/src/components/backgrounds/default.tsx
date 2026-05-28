export default function DefaultBackground({
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className="absolute inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#af0f0f_100%)]"
      {...props}
    />
  );
}
