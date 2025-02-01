import GoldChartTH from "./components/charts/goldChartTH";
import ChartTabs from "./components/charts/chartTabs";
import GoldChart from "./components/charts/goldChart";
// import ChartCard from "./components/charts/chartCard";
import './App.css';

export default function App() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full">
        {/* <GoldChart /> */}
        <ChartTabs />
        {/* <ChartCard /> */}
        {/* <GoldChartTH /> */}
      </div>
    </div>
  );
}
