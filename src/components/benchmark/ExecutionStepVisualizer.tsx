import { ArrowLeft, ArrowRight, CheckCircle2, Search, XCircle } from 'lucide-react';
import { SearchBenchmarkComparison } from '../../algorithms/benchmarkRunner';
import { SearchPositionBenchmarkRow } from '../../types';
import { Badge } from '../common/Badge';

interface ExecutionStepVisualizerProps {
  comparison: SearchBenchmarkComparison | null;
  positionRows: SearchPositionBenchmarkRow[];
}

export function ExecutionStepVisualizer({
  comparison,
  positionRows,
}: ExecutionStepVisualizerProps) {
  return (
    <div className="space-y-4">
      {/* 4-Scenario Position Matrix (Start, Middle, End/Worst-Case, Not Found) */}
      {positionRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
          <div className="border-b border-parchment-200 px-5 py-3.5">
            <h4 className="font-serif text-sm font-bold text-slate-900">
              Matriks Uji Pencarian Multi-Posisi: Linear Search O(n) vs Binary Search O(log
              n)
            </h4>
            <p className="text-xs text-slate-500">
              Menguji posisi awal, tengah, akhir (worst-case Linear Search), dan target
              tidak ditemukan pada skala dataset aktif.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Skenario Posisi</th>
                  <th className="px-4 py-3 text-right">Linear (ms / langkah)</th>
                  <th className="px-4 py-3 text-right">Jump √n (ms / langkah)</th>
                  <th className="px-4 py-3 text-right">Binary (ms / langkah)</th>
                  <th className="px-4 py-3 text-center">Indeks Binary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {positionRows.map((row) => (
                  <tr key={row.scenario} className="hover:bg-parchment-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{row.label}</p>
                      <p className="max-w-xs truncate font-mono text-[11px] text-slate-400">
                        Target: {row.targetQuery}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      {row.linear.executionTimeMs.toFixed(3)} ms ·{' '}
                      <strong>
                        {row.linear.comparisonsCount.toLocaleString('id-ID')}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-700">
                      {row.jump ? (
                        <>
                          {row.jump.executionTimeMs.toFixed(3)} ms ·{' '}
                          <strong>
                            {row.jump.comparisonsCount.toLocaleString('id-ID')}
                          </strong>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {row.binary.executionTimeMs.toFixed(3)} ms ·{' '}
                      <strong>
                        {row.binary.comparisonsCount.toLocaleString('id-ID')}
                      </strong>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      {row.binary.foundIndex !== -1 ? (
                        <Badge variant="emerald">#{row.binary.foundIndex}</Badge>
                      ) : (
                        <Badge variant="rose">-1</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!comparison ? (
        <div className="rounded-xl border border-dashed border-parchment-300 bg-white p-10 text-center text-xs text-slate-500">
          Masukkan kata kunci dan klik &ldquo;Bandingkan Linear vs Binary Search&rdquo;
          untuk melihat perbandingan kustom beserta jejak langkah pointer low-mid-high.
        </div>
      ) : (
        <>
          {/* Side-by-side custom keyword cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[comparison.linear, comparison.jump, comparison.binary]
              .filter(Boolean)
              .map((res) => (
              <div
                key={res.algorithm}
                className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-slate-700" />
                    <h4 className="font-serif text-sm font-bold text-slate-900">
                      {res.algorithmName}
                    </h4>
                  </div>
                  {res.foundIndex !== -1 ? (
                    <Badge variant="emerald">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Ditemukan (Indeks {res.foundIndex})</span>
                    </Badge>
                  ) : (
                    <Badge variant="rose">
                      <XCircle className="h-3 w-3" />
                      <span>Tidak Ditemukan (-1)</span>
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-parchment-100 bg-parchment-50/70 p-3 text-center">
                  <div>
                    <p className="text-[11px] text-slate-500">Waktu</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-emerald-700">
                      {res.executionTimeMs.toFixed(3)} ms
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Perbandingan</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">
                      {res.comparisonsCount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Cocok</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-indigo-700">
                      {res.matchedBooks.length} buku
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Jejak Indeks Diproses ({res.visitedIndices.length} sampel tercatat)
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {res.visitedIndices.slice(0, 24).map((idx, stepIdx) => {
                      const isHit =
                        res.algorithm === 'binary'
                          ? idx === res.foundIndex
                          : res.steps[stepIdx]?.matched;
                      return (
                        <span
                          key={`${res.algorithm}-${stepIdx}-${idx}`}
                          className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                            isHit
                              ? 'bg-emerald-700 text-white'
                              : 'bg-parchment-100 text-slate-700'
                          }`}
                        >
                          #{idx}
                        </span>
                      );
                    })}
                    {res.visitedIndices.length > 24 && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                        +{res.visitedIndices.length - 24} indeks lainnya
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Binary Search Low-Mid-High Pointer Trace */}
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-serif text-sm font-bold text-slate-900">
                  Visualisasi Langkah Pointer Binary Search (Low · Mid · High)
                </h4>
                <p className="text-xs text-slate-500">
                  Menunjukkan bagaimana O(log n) membelah ruang pencarian dari{' '}
                  {comparison.binary.itemCount.toLocaleString('id-ID')} entri hanya dalam{' '}
                  {comparison.binary.steps.length} langkah.
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500">
                Total langkah: <strong>{comparison.binary.steps.length}</strong>
              </span>
            </div>

            {comparison.binary.steps.length === 0 ? (
              <p className="text-xs text-slate-500">
                Masukkan kata kunci pencarian untuk menelusuri langkah pembagian pointer.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2">Langkah</th>
                      <th className="px-3 py-2 font-mono">Low</th>
                      <th className="px-3 py-2 font-mono">Mid</th>
                      <th className="px-3 py-2 font-mono">High</th>
                      <th className="px-3 py-2">Nilai di Mid</th>
                      <th className="px-3 py-2">Keputusan Pointer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {comparison.binary.steps.map((step) => (
                      <tr
                        key={step.step}
                        className={
                          step.matched ? 'bg-emerald-50/70' : 'hover:bg-parchment-50'
                        }
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">
                          #{step.step}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {step.low ?? step.left}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">
                          {step.mid}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {step.high ?? step.right}
                        </td>
                        <td className="max-w-xs truncate px-3 py-2 font-medium text-slate-800">
                          {step.value}
                        </td>
                        <td className="px-3 py-2">
                          {step.matched ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Cocok ditemukan di mid={step.mid}</span>
                            </span>
                          ) : step.direction === 'right' ? (
                            <span className="inline-flex items-center gap-1 text-indigo-700">
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>Geser Low ke {step.mid + 1}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <ArrowLeft className="h-3.5 w-3.5" />
                              <span>Geser High ke {step.mid - 1}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
