from pathlib import Path

def replace(path: str, replacements: dict[str, str]) -> None:
    p = Path(path)
    text = p.read_text()
    original = text
    for old, new in replacements.items():
        text = text.replace(old, new)
    if text == original:
        print(f"no changes: {path}")
    else:
        p.write_text(text)
        print(f"updated: {path}")

replace("app/situations/new/page.tsx", {
    "Analyzing against similar execution signals...": "Comparing against similar anonymous context...",
    "Your situation has been translated into structured intelligence.": "Your situation has been turned into anonymous, structured context.",
    "This is being analyzed against similar execution signals from other operators.": "This is being compared with similar anonymous context from other operators.",
    "Early signal: this may relate to": "Early indication: this may relate to",
})

replace("app/situations/[id]/page.tsx", {
    "helper: 'Adds attempted-action signal'": "helper: 'Adds attempted-action context'",
    "Add anonymous operator signal": "Add anonymous operator context",
})

replace("app/insights/reflection/[id]/page.tsx", {
    "responseSignals: string[];": "responseSignals: string[];",
    "opportunitySignal: string | null;": "opportunitySignal: string | null;",
    "low: { label: 'Early signals'": "low: { label: 'Early indications'",
    "strong: { label: 'Strong signal'": "strong: { label: 'Strong pattern'",
    "Structured anonymous context appeared after your original submission. The reflection below now includes that signal without exposing identity, count, or timing details.": "Structured anonymous context appeared after your original submission. The reflection below now includes that context without exposing identity, count, or timing details.",
    "Anonymous operator signals": "Anonymous operator context",
    "responseSignals.map((signal) => (": "responseSignals.map((item) => (",
    "<p key={signal} className=\"text-sm text-slate-300\">· {signal}</p>": "<p key={item} className=\"text-sm text-slate-300\">· {item}</p>",
    "Downstream risk signal": "Downstream risk indication",
    "Micro-opportunity signal": "Possible paid consult fit",
})