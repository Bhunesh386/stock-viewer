"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from "lightweight-charts";
import type { StockCandles } from "@/lib/finnhub";

interface StockChartProps {
  data: StockCandles | null;
  loading: boolean;
  error: string | null;
}

export default function StockChart({ data, loading, error }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#e6edf3',
      },
      grid: {
        vertLines: { color: '#161b22' },
        horzLines: { color: '#161b22' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 1, // Normal mode
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3b3b',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3b3b',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data) return;

    // Transform Finnhub format to TradingView format
    const formattedData = data.t.map((time, index) => ({
      time: time as import("lightweight-charts").Time,
      open: data.o[index],
      high: data.h[index],
      low: data.l[index],
      close: data.c[index],
    }));

    seriesRef.current.setData(formattedData);
    chartRef.current?.timeScale().fitContent();

  }, [data]);

  return (
    <div className="relative w-full h-[400px] border border-gray-800 rounded-lg overflow-hidden bg-[#0d1117]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stockGreen"></div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]">
          <div className="text-stockRed font-mono bg-red-950/30 border border-red-900/50 px-4 py-2 rounded">
            {error}
          </div>
        </div>
      )}
      {!data && !loading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]">
          <div className="text-gray-500 font-mono">No chart data available for this timeframe.</div>
        </div>
      )}
      <div ref={chartContainerRef} className="absolute inset-0" />
    </div>
  );
}
