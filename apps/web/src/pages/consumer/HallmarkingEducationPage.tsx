// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Hallmarking Educational Intelligence Page
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Gem,
  ShieldCheck,
  ArrowLeft,
  Award,
  Search,
} from 'lucide-react';

export const HallmarkingEducationPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Understand Hallmarking</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                <Gem className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Indian Gold & Silver Hallmarking Intelligence</h1>
                <p className="text-xs text-slate-600 mt-1">
                  Authoritative explanation of IS 1417 (Gold) and IS 2112 (Silver), 6-digit HUID codes, and consumer rights.
                </p>
              </div>
            </div>
            <Link
              to="/consumer/huid"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Verify a Hallmark Code
            </Link>
          </div>
        </div>

        {/* 3 Mandatory Signs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">The 3 Mandatory Marks on Gold Jewellery</h2>
          <p className="text-xs text-slate-600 mb-6">
            Under the mandatory hallmarking order enforced by the Bureau of Indian Standards, every hallmarked gold article must bear exactly these 3 marks:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sign 1 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base mb-3">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">BIS Triangular Logo</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Official triangular mark certifying conformity with Indian Standards.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-blue-700 font-medium">
                Clause 4.1, Hallmarking Scheme
              </div>
            </div>

            {/* Sign 2 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base mb-3">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Purity & Fineness Grade</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Indicates purity karat and parts per thousand, e.g. <span className="font-bold text-amber-900">22K916</span>,{' '}
                  <span className="font-bold text-amber-900">18K750</span>, <span className="font-bold text-amber-900">14K585</span>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-amber-800 font-medium">
                IS 1417:2016 Clause 5.2
              </div>
            </div>

            {/* Sign 3 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base mb-3">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">6-Digit HUID Code</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unique laser-engraved alphanumeric code (e.g. <span className="font-mono font-bold">AZ1234</span>) verifiable on the BIS CARE App.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-emerald-700 font-medium">
                Gazette S.O. 1541(E)
              </div>
            </div>
          </div>
        </div>

        {/* Purity Karats Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Permissible Gold & Silver Fineness Grades</h2>
          <p className="text-xs text-slate-600 mb-6">
            Indian Standards specify standardized purity tiers with exact permissible metal content.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gold IS 1417 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Gold Grades (IS 1417)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Karat</th>
                      <th className="py-2.5 px-3">Fineness (ppt)</th>
                      <th className="py-2.5 px-3">Typical Application</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">24 Karat</td>
                      <td className="py-2 px-3 font-mono">999 / 995</td>
                      <td className="py-2 px-3 text-slate-500">Gold coins, bullion bars</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="py-2 px-3 font-bold text-amber-950">22 Karat</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-900">916</td>
                      <td className="py-2 px-3 text-amber-900 font-medium">Traditional Indian jewellery</td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="py-2 px-3 font-bold text-amber-950">18 Karat</td>
                      <td className="py-2 px-3 font-mono font-bold text-amber-900">750</td>
                      <td className="py-2 px-3 text-slate-600">Diamond and gemstone-studded items</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">14 Karat</td>
                      <td className="py-2 px-3 font-mono">585</td>
                      <td className="py-2 px-3 text-slate-500">Contemporary lightweight wear</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">9 Karat</td>
                      <td className="py-2 px-3 font-mono">375</td>
                      <td className="py-2 px-3 text-slate-500">Affordable fashion jewellery</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Silver IS 2112 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Silver Grades (IS 2112)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Fineness (ppt)</th>
                      <th className="py-2.5 px-3">Standard Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="bg-slate-50/80">
                      <td className="py-2 px-3 font-bold text-slate-900">Sterling Silver</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">925</td>
                      <td className="py-2 px-3 text-slate-600 font-medium">Fine silverware & jewellery</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">Fine Silver</td>
                      <td className="py-2 px-3 font-mono">990</td>
                      <td className="py-2 px-3 text-slate-500">Bullion bars & coins</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">Coin Silver</td>
                      <td className="py-2 px-3 font-mono">900</td>
                      <td className="py-2 px-3 text-slate-500">Traditional silver articles</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-900">Standard Silver</td>
                      <td className="py-2 px-3 font-mono">835 / 800</td>
                      <td className="py-2 px-3 text-slate-500">Utensils and artefacts</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Consumer Rights & Testing at AHC */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl p-6 md:p-8 text-white shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-800/80">
              <ShieldCheck className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Your Statutory Right to Consumer Testing</h2>
              <p className="text-xs text-blue-200">Legal protections under the BIS Act and Hallmarking Regulations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-lg bg-white/10 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-amber-300">Nominal ₹45 Testing Fee</h4>
              <p className="text-blue-100 leading-relaxed">
                Any consumer can take hallmarked gold jewellery to any BIS-recognized Assaying Centre (AHC) for independent testing.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/10 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-emerald-300">Mandatory Jeweller Compensation</h4>
              <p className="text-blue-100 leading-relaxed">
                If the jewellery article fails the purity test, the registered jeweller is legally required to refund the purity difference plus testing costs.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/10 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-purple-300">Mandatory Itemized Invoice</h4>
              <p className="text-blue-100 leading-relaxed">
                The jeweller must provide a bill listing gross weight, net weight, purity karat, and individual 6-digit HUID numbers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
