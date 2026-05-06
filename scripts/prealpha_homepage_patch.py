from pathlib import Path

p = Path("app/page.tsx")
text = p.read_text()

text = text.replace("import ExecutionSignals from '@/components/ExecutionSignals';\n", "")
text = text.replace("  Users, \n", "")
text = text.replace("  Eye,\n  CheckCircle,\n  XCircle,\n  HelpCircle,\n  Shield\n", "")
text = text.replace("""interface CapabilityMatch {
  profileCode: string;
  summary: string;
  matchExplanation: string;
}

""", "")
text = text.replace("""        {/* SECTION A: EXECUTION SIGNALS - PATTERN PULSE */}
           <section className="mb-12">
             <ExecutionSignals />
           </section>

           {/* SECTION B: ACTIVE SITUATIONS */}
        <section className="mb-12">
""", """        {/* SECTION A: ACTIVE SITUATIONS */}
        <section className="mb-12">
""")
text = text.replace("""      {/* CTA Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition-colors">
          Have you seen this?
        </button>
        <button className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-300 transition-colors">
          What actually worked?
        </button>
      </div>

      {/* Matching Section */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-3">Who has dealt with this?</p>
        <div className="space-y-2">
          {getMockMatches().slice(0, 3).map((match, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-slate-500 font-mono">{match.profileCode}</span>
              <span className="text-slate-400">{match.matchExplanation}</span>
            </div>
          ))}
        </div>
      </div>
""", """      {/* Private-alpha context */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">
          Anonymous context only. No profiles, public counts, or popularity mechanics.
        </p>
      </div>
""")
start = text.find("\nfunction getMockMatches():")
if start != -1:
    text = text[:start].rstrip() + "\n"

p.write_text(text)
print("updated app/page.tsx")