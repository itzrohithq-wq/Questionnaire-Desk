"""Build the demo's data from the existing deterministic prototype (secq-poc). Run with the secq-poc venv:
  C:/Users/Rohit Kakade/OneDrive/Documents/Claude/secq-poc/.venv/Scripts/python.exe scripts/build-data.py
Reads secq-poc/fixtures_out (synthetic policies + questionnaire). Writes src/data/evidence.json, src/data/golden.json,
public/sample/Northwind-Security-Questionnaire.xlsx. Invented data only. Version labels below are fictional."""
import json, shutil, sys
from pathlib import Path

POC = Path("C:/Users/Rohit Kakade/OneDrive/Documents/Claude/secq-poc")
sys.path.insert(0, str(POC))
import secq  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FIX = POC / "fixtures_out"
META = {  # fictional document metadata for the demo
    "access-control": ("Access Control Policy", "v2.1", "2026-08-14", "Current"),
    "encryption": ("Encryption Standard", "v1.4", "2026-07-02", "Current"),
    "incident-response": ("Incident Response Plan", "v3.0", "2026-06-20", "Current"),
    "backup-dr": ("Backup and Recovery Policy", "v1.8", "2026-05-30", "Current"),
    "assurance": ("Assurance Summary", "v1.1", "2026-09-01", "Current, SOC 2 audit in progress"),
    "vendor-hr-change": ("Vendor, HR and Change Policies", "v1.3", "2026-04-12", "Current"),
}

sents = secq.load_policies(FIX / "policies")
counters, passages, pid = {}, [], {}
for doc, section, text in sents:
    stem = doc[:-3]
    counters[stem] = counters.get(stem, 0) + 1
    p = f"{stem}-{counters[stem]}"
    pid[(doc, text)] = p
    passages.append({"id": p, "doc": stem, "section": section, "text": text})
docs = [{"id": s, "file": s + ".md", "title": t, "version": v, "reviewed": d, "status": st} for s, (t, v, d, st) in META.items()]

review = ROOT / "scripts" / "_review.json"
items = secq.ingest(FIX / "questionnaire.xlsx", FIX / "policies", review)
review.unlink()
golden = []
for i, it in enumerate(items, 1):
    cite = it["citation"]
    passage = None
    if cite:
        doc = cite.split(" > ")[0]
        quote = cite.split('"', 1)[1].rsplit('"', 1)[0]
        passage = pid[(doc, quote)]
    golden.append({"id": f"Q{i}", "row": it["row"], "question": it["question"], "status": it["status"], "answer": it["answer"], "passage": passage, "note": it["note"]})

out = ROOT / "src" / "data"
out.mkdir(parents=True, exist_ok=True)
(out / "evidence.json").write_text(json.dumps({"company": "Northwind Synthetic Ltd", "documents": docs, "passages": passages}, indent=1), encoding="utf-8")
(out / "golden.json").write_text(json.dumps(golden, indent=1), encoding="utf-8")
dest = ROOT / "public" / "sample"
dest.mkdir(parents=True, exist_ok=True)
shutil.copy(FIX / "questionnaire.xlsx", dest / "Northwind-Security-Questionnaire.xlsx")
print(f"{len(docs)} documents, {len(passages)} passages, {len(golden)} questions")
