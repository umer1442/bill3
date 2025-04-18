"use client"

import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface ChartData {
  name: string
  total: number
}

interface ChartProps {
  data: ChartData[]
}

export function LineChart({ data }: ChartProps) {
  const colors = {
    accent: "#00FFFF",
    background: "#000000",
    text: "#FFFFFF",
    grid: "#444444",
    glow: "rgba(0, 255, 255, 0.2)",
    tooltipBg: "#1a1a1a"
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Amount",
        data: data.map((item) => item.total),
        borderColor: colors.accent,
        backgroundColor: colors.accent,
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: colors.background,
        pointBorderColor: colors.accent,
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: colors.background,
        pointHoverBorderColor: colors.accent,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: colors.text,
          font: {
            weight: 500,
          },
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.accent,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`,
        },
        titleFont: {
          weight: 500,
        },
        bodyFont: {
          weight: 400,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        ticks: {
          color: colors.text,
          font: {
            weight: 500,
          },
          padding: 8,
          callback: (value) => `₹${value.toLocaleString()}`,
        },
        grid: {
          color: colors.grid,
          lineWidth: 0.5,
        },
      },
      x: {
        border: {
          display: false,
        },
        ticks: {
          color: colors.text,
          font: {
            weight: 500,
          },
          padding: 8,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="rounded-xl bg-black border border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.2)] p-4">
      <Line data={chartData} options={options} />
    </div>
  )
}

export function BarChart({ data }: ChartProps) {
  const colors = {
    accent: "#00FFFF",
    background: "#000000",
    text: "#FFFFFF",
    grid: "#444444",
    glow: "rgba(0, 255, 255, 0.2)",
    tooltipBg: "#1a1a1a",
    bars: [
      "#00FFFF",
      "#00E5E5",
      "#00CCCC",
      "#00B3B3",
      "#009999",
      "#008080",
      "#006666",
      "#004C4C",
    ],
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: "Total Revenue",
        data: data.map((item) => item.total),
        backgroundColor: colors.bars,
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 6,
        hoverBackgroundColor: colors.accent,
        maxBarThickness: 40,
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: colors.text,
          font: {
            weight: 500,
          },
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.accent,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => `₹ ${context.parsed.y.toLocaleString()}`,
        },
        titleFont: {
          weight: 500,
        },
        bodyFont: {
          weight: 400,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        ticks: {
          color: colors.text,
          font: {
            weight: 500,
          },
          padding: 8,
          callback: (value) => `₹${value.toLocaleString()}`,
        },
        grid: {
          color: colors.grid,
          lineWidth: 0.5,
        },
      },
      x: {
        border: {
          display: false,
        },
        ticks: {
          color: colors.text,
          font: {
            weight: 500,
          },
          padding: 8,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="rounded-xl bg-black border border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.2)] p-4">
      <Bar data={chartData} options={options} />
    </div>
  )
}
