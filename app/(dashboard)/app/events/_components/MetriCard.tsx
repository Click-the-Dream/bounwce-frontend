import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  iconWrapperClassName?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  iconClassName = "w-3 h-3",
  iconWrapperClassName = "bg-gray-200 text-white",
}: MetricCardProps) => {
  return (
    <div
      className="relative rounded-[8.25px] border-[0.3px] border-black/20 bg-white px-4 py-3"
      style={{ boxShadow: "0px 0px 0px 0px #00000040" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-black">
          {title}
        </span>

        <div className={`rounded-md p-1 ${iconWrapperClassName}`}>
          <Icon className={iconClassName} />
        </div>
      </div>

      <p className="mb-3 text-2xl font-semibold text-black">{value}</p>

      <div className="h-[1.65px] w-12 rounded-full bg-gray-200" />
    </div>
  );
};

export default MetricCard;
