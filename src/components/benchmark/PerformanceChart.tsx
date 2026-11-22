import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlgorithmMetrics, MultiScaleSortRow } from '../../types';

interface PerformanceChartProps {
  sortMetrics: AlgorithmMetrics[];
  multiScaleResults: MultiScaleSortRow[];
}

const BAR_COLORS = ['#064E3B', '#1E3A8A', '#D97706'];

const THEORETICAL_COMPLEXITY: Record<
  string,
  { best: string; avg: string; worst: string }
> = {
  'Quick Sort': { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)' },
  'Merge Sort': { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)' },
  'Insertion Sort': { best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)' },
};

export function PerformanceChart({
  sortMetrics,
  multiScaleResults,
}: PerformanceChartProps) {
  const timeData = sortMetrics.map((m) => ({
    name: m.algorithmName,
    waktuMs: m.executionTimeMs,
  }));

  const comparisonData = sortMetrics.map((m) => ({
    name: m.algorithmName,
    perbandingan: m.comparisonsCount,
  }));

  const multiScaleTimeData = multiScaleResults.map((row) => ({
    scale: `${row.scale.toLocaleString('id-ID')} Buku`,
    quickSort: row.quickSort.executionTimeMs,
    mergeSort: row.mergeSort.executionTimeMs,
    insertionSort: row.insertionSort.executionTimeMs,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Execution Time Chart */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="font-serif text-sm font-bold text-slate-900">
              Kecepatan Eksekusi Sorting (ms)
            </h4>
            <p className="text-xs text-slate-500">
              Nilai lebih kecil menunjukkan eksekusi lebih cepat pada skala aktif.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(3)} ms`, 'Waktu']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="waktuMs" radius={[6, 6, 0, 0]}>
                  {timeData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparisons Count Chart */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="font-serif text-sm font-bold text-slate-900">
              Jumlah Operasi Perbandingan (Comparisons)
            </h4>
            <p className="text-xs text-slate-500">
              Bukti empiris pertumbuhan operasi O(n log n) vs O(n²).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString('id-ID'),
                    'Perbandingan',
                  ]}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="perbandingan" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Single-Scale Metrics Table */}
      <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Algoritma</th>
                <th className="px-4 py-3">Best Case</th>
                <th className="px-4 py-3">Average Case</th>
                <th className="px-4 py-3">Worst Case</th>
                <th className="px-4 py-3 text-right">Data (N)</th>
                <th className="px-4 py-3 text-right">Waktu (ms)</th>
                <th className="px-4 py-3 text-right">Comparisons</th>
                <th className="px-4 py-3 text-right">Swaps / Moves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {sortMetrics.map((metric) => {
                const theory = THEORETICAL_COMPLEXITY[metric.algorithmName] || {
                  best: '-',
                  avg: '-',
                  worst: '-',
                };
                return (
                  <tr key={metric.algorithmName} className="hover:bg-parchment-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {metric.algorithmName}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-700">
                      {theory.best}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{theory.avg}</td>
                    <td className="px-4 py-3 font-mono text-amber-700">{theory.worst}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {metric.itemCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                      {metric.executionTimeMs.toFixed(3)} ms
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {metric.comparisonsCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {(metric.swapsCount ?? 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Scale Growth Curve Section (1.000 vs 5.000 vs 10.000) */}
      {multiScaleResults.length > 0 && (
        <div className="space-y-4 rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Hasil Multi-Scale Benchmark
            </p>
            <h4 className="font-serif text-base font-bold text-slate-900">
              Kurva Pertumbuhan Waktu Eksekusi (1.000 vs 5.000 vs 10.000 Buku)
            </h4>
            <p className="text-xs text-slate-500">
              Memperlihatkan lonjakan kuadratik Insertion Sort dibandingkan stabilitas
              Quick Sort &amp; Merge Sort seiring pertumbuhan N.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={multiScaleTimeData}
                margin={{ top: 10, right: 20, left: 4, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="scale" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  unit=" ms"
                />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(3)} ms`}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="quickSort"
                  name="Quick Sort"
                  stroke="#064E3B"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="mergeSort"
                  name="Merge Sort"
                  stroke="#1E3A8A"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="insertionSort"
                  name="Insertion Sort"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Skala Dataset</th>
                  <th className="px-3 py-2.5 text-right">Quick Sort (ms / cmp)</th>
                  <th className="px-3 py-2.5 text-right">Merge Sort (ms / cmp)</th>
                  <th className="px-3 py-2.5 text-right">Insertion Sort (ms / cmp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100 font-mono">
                {multiScaleResults.map((row) => (
                  <tr key={row.scale}>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      N = {row.scale.toLocaleString('id-ID')} ({row.condition})
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-800">
                      {row.quickSort.executionTimeMs.toFixed(2)} ms ·{' '}
                      {row.quickSort.comparisonsCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2.5 text-right text-indigo-800">
                      {row.mergeSort.executionTimeMs.toFixed(2)} ms ·{' '}
                      {row.mergeSort.comparisonsCount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-amber-700">
                      {row.insertionSort.executionTimeMs.toFixed(2)} ms ·{' '}
                      {row.insertionSort.comparisonsCount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
