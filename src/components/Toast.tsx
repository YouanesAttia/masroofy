interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

export default function Toast({ message, type, visible }: ToastProps) {
  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[200]
        px-5 py-2.5 rounded-2xl shadow-xl
        text-white text-sm font-semibold
        transition-all duration-300 ease-out
        ${type === "success" ? "bg-green-500" : "bg-red-500"}
        ${visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
        }
      `}
    >
      {message}
    </div>
  );
}