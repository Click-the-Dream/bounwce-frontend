import { DollarSign, Eye, UserPlus } from "lucide-react";
import MetricCard from "../../../_components/MetriCard";

const Metrics = () => {
  const metrics = [
    {
      title: "TOTAL SIGNUPS",
      value: "400",
      icon: UserPlus,
    },
    {
      title: "TOTAL REVENUE",
      value: "N1,000,000",
      icon: DollarSign,
    },
    {
      title: "VIEWS",
      value: "4000",
      icon: Eye,
    },
  ];

  return (
    <div className="mb-3.5 grid grid-cols-1 gap-6 md:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
        />
      ))}
    </div>
  );
};

export default Metrics;
