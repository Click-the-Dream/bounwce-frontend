import { UserPlus, DollarSign, Eye } from "lucide-react";

const Metrics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-3.5">
      {/* Metric 1 */}
      <div
        className="bg-white py-3 px-4 rounded-[8.25px] border-[0.3px] border-black/20 relative"
        style={{ boxShadow: " 0px 0px 0px 0px #00000040" }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-black uppercase">
            TOTAL SIGNUPS
          </span>
          <div className="p-1 bg-gray-200 rounded-md text-white">
            <UserPlus className="w-3 h-3" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-black mb-3">400</p>
        <div className="w-12 h-[1.65px] bg-gray-200 rounded-full" />
      </div>

      {/* Metric 2 */}
      <div
        className="bg-white py-3 px-4 rounded-[8.25px] border-[0.3px] border-black/20 relative"
        style={{ boxShadow: " 0px 0px 0px 0px #00000040" }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-medium text-black uppercase">
            TOTAL REVENUE
          </span>
          <div className="p-1 bg-gray-200 rounded-md text-white">
            <DollarSign className="w-3 h-3" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-black mb-3">N1,000,000</p>
        <div className="w-12 h-[1.65px] bg-gray-200 rounded-full" />
      </div>

      {/* Metric 3 */}
      <div
        className="bg-white py-3 px-4 rounded-[8.25px] border-[0.3px] border-black/20 relative"
        style={{ boxShadow: " 0px 0px 0px 0px #00000040" }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-medium text-black uppercase">
            VIEWS
          </span>
          <div className="p-1 bg-gray-200 rounded-md text-white">
            <Eye className="w-3 h-3" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-black mb-3">4000</p>
        <div className="w-12 h-[1.65px] bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};

export default Metrics;
