"""Generates guide.html (A4 landscape, print-ready) for the Questionnaire desk demo.
Run: python docs/guide/build.py && node docs/guide/render.mjs
Screens in img/ are captured from the running app by capture.mjs. The export table is read from a real exported workbook."""
import html, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
APP = 'http://localhost:3100/'
VERSION, DATE = '0.1.0', '2026-10-15'
EXPORT = os.environ.get('EXPORT_XLSX', '')

def e(s): return html.escape(s, quote=True)

# ---- Feature pages: (anchor, title, location, purpose, images, caption, success, steps, note) ----
# images: list of (file, css-class) ; classes: '' full-width, 'crop-top' fixed-height crop, 'narrow'
F = [
 dict(id='welcome', title='Start from the welcome screen', where='First page you see when the app opens.',
  purpose='Explains what the demo is and lets you try the key idea (a suggestion is not an answer until a person approves it) before you open the questionnaire.',
  imgs=[('welcome-hero', 'tall'), ('welcome-card', 'tall')], row=True, cap='Left: the headline and the two buttons. Right: a small interactive example, not part of your questionnaire.',
  ok='The headline reads “Security questionnaires answered from your approved policies”, and the example card shows a dashed “Software suggestion, not yet reviewed” box.',
  steps=['Read the notes under the example card: the demo runs in your browser, matching is keyword matching and not AI, you act as the reviewer, and real company files must not be loaded.',
         'Select “Approve this suggestion” in the example card. The dashed box turns into a solid green-edged “Approved by the reviewer” box. Select “Undo approval” to return.',
         'Select “Start the interactive demo” to open the questionnaire. “Download the sample questionnaire” saves the fictional Excel file.'],
  note='Cost: none. Nothing is uploaded; the sample file is served from the same place as the app.'),
 dict(id='questions', title='Choose a question from the list', where='Workspace, left column “Questionnaire”.',
  purpose='Shows all 21 questions of the sample workbook with a status for each, so you can see what needs a person.',
  imgs=[('question-list', 'tall'), ('question-list-reviewed', 'tall')], row=True, cap='Left: the first questions before any review. Right: the same rows after reviewing. A selected row has a dark border and a lime bar; each row shows a written status.',
  ok='The row you chose is outlined and the centre and right columns show that question. Statuses are always written out, never colour only.',
  steps=['Select any question. You can also focus the list and press the Down and Up arrow keys, Home or End to move between questions.',
         'Read the status chip. “Suggested, needs review” means the software drafted an answer. “Needs your judgment” and “No supporting evidence” mean it drafted nothing.',
         'Work through the list in any order. Your choices are kept for the rest of this browser tab session.'],
  note='In the sample, 5 questions have a suggestion, 2 need your judgment and 14 have no supporting evidence. This is deliberate and shows the matcher’s limits.'),
 dict(id='progress', title='Track review progress', where='Workspace, centre column, above the question.',
  purpose='Counts how many answers you have approved, how many are still waiting, and how many you have held back.',
  imgs=[('stats-reviewed', 'fit')], cap='Progress after approving three answers, rejecting one and holding one. The strip shows one tick per question.',
  ok='“Approved” goes up when you approve, “Held back” counts rejected and needs-more-evidence items, and the sentence below reads “N approved, M of 21 reviewed”.',
  steps=['Approve, reject or hold a question (see the next pages).',
         'Watch the three tiles update. “Awaiting review” is everything not yet approved, rejected or held back.',
         'Use the tick strip as a quick map: green ticks are approved, red are rejected, amber are held back, grey are untouched.'],
  note='The numbers describe this session only. They are not metrics from a real customer.'),
 dict(id='suggestion', title='Read a software suggestion', where='Workspace, centre column, the large answer box.',
  purpose='Shows what the software proposes and, just as important, that nobody has reviewed it yet.',
  imgs=[('question-head', 'fit'), ('answer-suggested', 'fit')], cap='Question 3. The dashed, hatched edge means “software suggestion, not yet reviewed”. The line under the answer names the policy it cites.',
  ok='You see an answer such as “Yes”, the title “Software suggestion, not yet reviewed”, and “Cites Encryption Standard v1.4, Encryption.”',
  steps=['Select Question 3, “Is customer data encrypted at rest?”.',
         'Read the answer and the citation line. The suggestion exists only because a policy passage matched the question.',
         'Do not treat it as final. The next pages show how to check the passage and approve it.'],
  note='The suggestion is software output from keyword matching. It is not AI and has not been reviewed by an expert.'),
 dict(id='flags', title='When the software drafts nothing', where='Workspace, centre column, above the answer box.',
  purpose='Explains why some questions have no suggested answer, so a gap is never filled with an invented control.',
  imgs=[('flag-needs-human', 'fit'), ('flag-no-evidence', 'fit')], cap='Top: Question 2 has a closest passage that is negative, partial or conditional. Bottom: Question 1 has no matching passage.',
  ok='The answer box reads “No suggested answer” and “Nothing to approve yet.”, and the Approve button is disabled.',
  steps=['Select Question 1 or Question 2.',
         'Read the note. “Needs your judgment” points you to the closest passage in Cited evidence. “No supporting evidence” means the matcher found nothing and may have missed different wording.',
         'If a policy does cover it, write the answer yourself (see “Edit and cite your own answer”).'],
  note='This is intentional: the demo prefers a blank to a guess.'),
 dict(id='evidence', title='Check the cited evidence', where='Workspace, right column, “Cited evidence”.',
  purpose='Shows the exact policy passage behind a suggestion, with the document name, version, review date and status.',
  imgs=[('evidence-cited', 'fit')], cap='Evidence for Question 3. The yellow highlight is the exact source sentence, set in a serif face to mark it as source text.',
  ok='A card names the document (for example Encryption Standard, v1.4), its status and section, and highlights the passage.',
  steps=['Select a question that has a suggestion, such as Question 3.',
         'Read the highlighted sentence and compare it with the question. Check the version and the “Status” line.',
         'If the passage does not really answer the question, do not approve. Reject it or mark it as needing more evidence.'],
  note='All documents are fictional. Source text is shown as written; generated text is never mixed into it.'),
 dict(id='library', title='Browse the evidence library', where='Workspace, right column, “Evidence library”.',
  purpose='Lists all six fictional policies and their passages so you can find support that the matcher missed.',
  imgs=[('library', 'fit')], cap='The library with the Encryption Standard open. The passage cited by the current question has a yellow background.',
  ok='Each policy opens to show its version, review date, status and numbered passages. The document that is cited stays open.',
  steps=['Select a policy name to expand it.',
         'Read its passages. They are fixed source text and cannot be edited in the demo.',
         'When you find a passage that answers a question the software missed, note its wording and use it in “Edit and cite your own answer”.'],
  note='The library holds 6 documents with 18 passages in total. It is part of the build, not uploaded by you.'),
 dict(id='approve', title='Approve a suggestion', where='Workspace, right column, “Reviewer actions”.',
  purpose='Records that you checked the answer and its evidence. Only approved answers can be exported.',
  imgs=[('actions', 'fit'), ('answer-approved', 'fit')], cap='The reviewer actions, and the answer box after approval: solid green edge and the note that it will be written to the Excel file.',
  ok='The title changes to “Approved answer”, the chip reads “Approved”, and “Export Excel (N approved)” counts it.',
  steps=['Select Question 3 and check its cited evidence.',
         'Select “Approve”. The button is disabled when there is no answer, or when a dropdown question has a value outside Yes, No or N/A.',
         'Select “Restore the original suggestion” if you want to undo your changes and return to the software’s first suggestion.'],
  note='Approval is a person’s decision. In this demo that person is you; the demo does not claim any expert reviewed the answer.'),
 dict(id='hold', title='Reject or hold an answer', where='Workspace, right column, “Reviewer actions”.',
  purpose='Keeps weak or unsupported answers out of the export.',
  imgs=[('answer-rejected', 'fit')], cap='A rejected answer. The cell stays blank in the export.',
  ok='The chip reads “Rejected, will not export” or “More evidence needed”, and the answer box says the cell stays blank.',
  steps=['Select a question whose evidence does not support the answer.',
         'Select “Reject” to discard the suggestion, or “Needs more evidence” if you need a better policy passage first.',
         'You can still change your mind: select “Approve” later, or edit the answer first.'],
  note='Rejected and held answers are never exported.'),
 dict(id='edit', title='Edit and cite your own answer', where='Reviewer actions, “Edit answer”.',
  purpose='Lets you answer a question the software missed, or correct a suggestion, and tie the answer to a policy passage.',
  imgs=[('edit-form', 'fit')], cap='The edit form for a dropdown question. “Cited evidence” offers every passage in the library.',
  ok='After “Save edit” the chip reads “Edited, needs approval” and the answer box is dashed again, titled “Your edit, waiting for your approval”.',
  steps=['Select “Edit answer”. Choose Yes, No or N/A (the workbook cell is a dropdown) and optionally type a comment.',
         'Choose the supporting passage in “Cited evidence”. Choosing “No evidence cited” is allowed but is recorded as such.',
         'Select “Save edit”, then select “Approve” as a separate step.'],
  note='Every edit withdraws an earlier approval. If you approve with no cited passage, the export says “Source: none cited; answer entered by the reviewer.”'),
 dict(id='export', title='Export the reviewed Excel file', where='Header, top right: “Export Excel (N approved)”.',
  purpose='Writes only approved answers into a copy of the sample workbook and keeps its formatting.',
  imgs=[('header-export', 'wide')], cap='Top: the export button. Below: the first rows of a real exported file in which only Question 3 and Question 9 were approved.', table=True,
  ok='A file named Northwind-Security-Questionnaire-reviewed.xlsx downloads. Approved rows have an answer and a “Source:” line in the comments column; every other row is blank.',
  steps=['Approve at least one answer. The button is disabled while the count is 0.',
         'Select “Export Excel (N approved)”. Your browser saves the file; nothing is sent anywhere.',
         'Open the file in Excel and check the Response and Comments columns against what you approved.'],
  note='Sheet order, hidden sheets, widths, heights, merges, basic formatting, dropdowns, conditional formatting and freeze panes were checked on the sample only. Images, charts and macros are not supported.'),
 dict(id='tour', title='Take the guided tour', where='Left sidebar, compass icon “Guided tour” (on phones: the “Guided tour” button in the header).',
  purpose='A five-step walkthrough that moves to the right place and outlines each area.',
  imgs=[('tour', 'fit'), ('sidebar', 'tall')], row=True, cap='Left: the tour card, which stays out of your way at the bottom right. Right: the sidebar tools with their tooltip.',
  ok='A card titled “Review the questionnaire” appears, “Step 1 of 5”, and the question list is outlined.',
  steps=['Select “Guided tour”.',
         'Use “Next” and “Back”. The steps cover the list, the evidence, a suggestion, the actions and the export button.',
         'Select “Finish” on step 5, or “End the guide” (or press Escape) at any time.'],
  note='From step 2 the tour opens Question 3 for you. It does not reset your review choices.'),
 dict(id='limits', title='Read what the demo can and cannot do', where='Left sidebar, info icon “Limits” (on phones: the “Limits” button).',
  purpose='States the export support list, the matching method and the data handling in one place.',
  imgs=[('limits', 'crop-top')], cap='The top of the Limits dialog. It continues with the unsupported list, matching and data notes.',
  ok='A dialog titled “What this demo can and cannot do” opens and focus moves into it.',
  steps=['Select “Limits”.',
         'Read “The Excel export keeps” and “The Excel export does not support”.',
         'Select “Close”, press Escape, or select outside the dialog.'],
  note='Fidelity is checked on the sample workbook only, not promised for every file.'),
 dict(id='mobile', title='Use the demo on a phone or tablet', where='Any screen narrower than a laptop.',
  purpose='The three columns become three tabs so each screen stays readable.',
  imgs=[('mobile-questions', 'phone')], cap='A 390 pixel wide screen. The tabs along the bottom switch between Questions, Answer, and Evidence and review.',
  ok='A pill-shaped tab bar sits at the bottom and “Guided tour”, “Limits” and “Reset demo” appear as labelled buttons under the title.',
  steps=['Select a question. The app switches to the Answer tab.',
         'Select the “Evidence and review” tab to see cited evidence and the reviewer actions.',
         'Select “Export Excel (N approved)” in the header when you are done.'],
  note='There is no horizontal scrolling at phone width. Tested at 390 pixels wide in an automated browser, not on physical devices.'),
 dict(id='reset', title='Reset the demo and what is remembered', where='Left sidebar, circular-arrow icon “Reset demo”.',
  purpose='Clears every approval, rejection, edit and hold so you can run the demo again.',
  imgs=[('sidebar', 'tall')], cap='The three sidebar tools: Guided tour, Limits and Reset demo. The tooltip names a tool when you point at it.',
  ok='A short message says “Demo reset. All review choices were cleared.” and all counts return to 0 approved, 21 awaiting review.',
  steps=['Select “Reset demo”.',
         'Check that “Export Excel (0 approved)” is disabled again.',
         'To start fully fresh, close the browser tab. Choices are kept only in that tab’s session storage.'],
  note='Review choices are not saved on a server and are not shared between tabs or devices.'),
]

def img(name, cls):
    return f'<img class="shot {cls}" src="img/{name}.png" alt="{e(name.replace("-", " "))}">'

def export_table():
    if not EXPORT or not os.path.exists(EXPORT): return ''
    import openpyxl
    ws = openpyxl.load_workbook(EXPORT)['Questionnaire']
    rows = [r for r in range(2, 12) if ws.cell(r, 3).value or r in (2, 3)]
    out = ['<table class="sheet"><tr><th>ID</th><th>Question</th><th>Response</th><th>Comments / Evidence</th></tr>']
    for r in rows[:5]:
        c = [ws.cell(r, i).value or '' for i in range(1, 5)]
        com = c[3] if len(c[3]) < 150 else c[3][:147] + '…'
        out.append(f'<tr><td>{e(str(c[0]))}</td><td>{e(str(c[1]))}</td><td>{e(str(c[2]))}</td><td>{e(com)}</td></tr>')
    out.append('</table>')
    return ''.join(out)

pages = []
def add(pid, label, body, extra_cls=''):
    pages.append((pid, label, f'<section class="page {extra_cls}" id="{pid}">{body}<footer><a href="#index">Back to index</a><span>Questionnaire desk guide · version {VERSION} · page {{n}}</span></footer></section>'))

LOGO = '<span class="logo" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="m9.2 14.6 2.2 2.2 4.1-4.4"/></svg></span>'

def steps_html(steps):
    return '<ol class="steps">' + ''.join(f'<li><span class="n">{i}</span><p>{e(s)}</p></li>' for i, s in enumerate(steps, 1)) + '</ol>'

def feature(f, num):
    imgs = ''.join(img(n, c) for n, c in f['imgs'])
    tbl = export_table() if f.get('table') else ''
    body = f'''<h2>{e(f["title"])}</h2>
<p class="where"><strong>Where:</strong> {e(f["where"])} <span class="sep"></span> <strong>Purpose:</strong> {e(f["purpose"])}</p>
<div class="cols"><div class="left"><div class="shots n{len(f["imgs"])}{" row" if f.get("row") else ""}">{imgs}</div>{tbl}<p class="cap">{e(f["cap"])}</p>
<div class="ok"><strong>What you should see</strong><p>{e(f["ok"])}</p></div></div>
<div class="right">{steps_html(f["steps"])}<p class="note">{e(f["note"])}</p><a class="open" href="{APP}">Open this part of the app</a><p class="hint">Works while the app is running locally at {APP}</p></div></div>'''
    add(f['id'], f['title'], body, 'feature')

# 1 Cover
add('cover', 'Cover', f'''<div class="cover"><div class="cl"><div class="brand">{LOGO}<span>Questionnaire desk</span></div>
<h1>Review security questionnaires with evidence in front of you.</h1>
<p class="lead">A hands-on guide to the Questionnaire desk demo: see suggested answers, check the policy behind each one, approve what is right, and export a reviewed Excel file.</p>
<ul class="labels"><li>Suggested answers</li><li>Cited evidence</li><li>Human review</li><li>Excel export</li><li>Guided tour</li></ul>
<p class="meta">Demo with fictional data (Northwind Synthetic Ltd) · Runs locally at <a href="{APP}">{APP}</a> · Version {VERSION} · Verified {DATE}</p>
<p class="meta">Not deployed publicly. Keyword matching, not AI. No expert has reviewed any answer in this demo.</p></div>
<div class="cr"><img class="shot" src="img/workspace-q3.png" alt="The Questionnaire desk workspace"></div></div>''', 'coverpage')

# 2 Index
order = ['cover', 'index', 'prereq', 'launch', 'first'] + [f['id'] for f in F] + ['dev', 'upload', 'trouble', 'ready']
pageno = {i: k for k, i in enumerate(order, 1)}
sections = [('prereq', 'Before you start'), ('launch', 'Launch the app for the first time'), ('first', 'Your first review, end to end')] + [(f['id'], f['title']) for f in F] + [('dev', 'For developers: run the tests and rebuild data'), ('upload', 'For developers: the local-only upload switch'), ('trouble', 'Troubleshooting'), ('ready', 'Readiness checklist')]
half = (len(sections) + 1) // 2
def col(items, start):
    return '<ol class="idx" style="counter-reset: n %d">' % (start - 1) + ''.join(f'<li><a href="#{i}">{e(t)}</a><span class="pg">{pageno[i]}</span></li>' for i, t in items) + '</ol>'
add('index', 'Index', f'''<h2>Contents</h2><p class="where">Select a title to jump to it. New to the demo? Read pages 3 to 5 first, then follow the feature pages in order; they follow the same path as a real review.</p>
<div class="two">{col(sections[:half], 1)}{col(sections[half:], half + 1)}</div>
<div class="ok wide"><strong>Reading recommendation for beginners</strong><p>Before you start → Launch → Your first review → Read a software suggestion → Check the cited evidence → Approve a suggestion → Export. Everything else is reference.</p></div>''')

# 3 Prerequisites
add('prereq', 'Before you start', f'''<h2>Before you start</h2><p class="where">This demo has no accounts, sign-in or API keys. What you need depends on how you open it.</p>
<div class="cards">
<div class="card"><h3>To use the demo</h3><p><strong>What it is:</strong> a web browser (the demo was tested in Chromium only) and the demo running at {APP}.</p><p><strong>Where you get it:</strong> the project folder <code>secq-demo</code>, started with the steps on the next page.</p><p><strong>Where you use it:</strong> in the browser address bar.</p></div>
<div class="card"><h3>To run it yourself</h3><p><strong>What it is:</strong> Node.js with npm (the project was built with Node 24).</p><p><strong>Where you get it:</strong> nodejs.org, or your organisation’s software portal.</p><p><strong>Where you use it:</strong> in a terminal opened in the <code>secq-demo</code> folder.</p></div>
<div class="card"><h3>To regenerate the data (developers only)</h3><p><strong>What it is:</strong> the Python prototype <code>secq-poc</code> with its virtual environment.</p><p><strong>Where you use it:</strong> <code>npm run data</code>. Normal use does not need it, because the generated data is already in the project.</p></div></div>
<div class="ok wide"><strong>What you do not need</strong><p>No workspace login, no model-provider key, no integration token, no cloud account and no payment. The demo makes no external calls and uses no AI service. Never put real company files or secrets into it.</p></div>''')

# 4 Launch
add('launch', 'Launch the app for the first time', f'''<h2>Launch the app for the first time</h2><p class="where"><strong>Where:</strong> a terminal in the <code>secq-demo</code> folder, then your browser. <span class="sep"></span> <strong>Purpose:</strong> get the demo running on your own computer.</p>
<div class="cols"><div class="left"><pre class="code">npm install
npm run build
npm run serve
# the terminal prints:  http://localhost:3100</pre>
<p class="cap">Run the three commands in order. Leave the terminal open while you use the demo. For development, <code>npm run dev</code> serves the same address.</p>
<div class="ok"><strong>How you confirm it worked</strong><p>The terminal prints the address, and opening it in your browser shows the welcome screen with the headline “Security questionnaires answered from your approved policies”.</p></div></div>
<div class="right">{steps_html(["Open a terminal in the secq-demo folder and run npm install once. Then run npm run build.","Run npm run serve. It starts a small local web server on port 3100.","Open http://localhost:3100/ in your browser and select “Start the interactive demo”."])}<p class="note">If the address does not open, see Troubleshooting. Nothing here costs money or sends data off your computer.</p><a class="open" href="{APP}">Open this part of the app</a><p class="hint">Works while the app is running locally.</p></div></div>''')

# 5 First workflow
add('first', 'Your first review, end to end', f'''<h2>Your first review, end to end</h2><p class="where"><strong>Goal:</strong> approve two answers and download an Excel file that contains only those two. About four minutes. <strong>Cost:</strong> none.</p>
<div class="cols"><div class="left"><div class="shots n2 row">{img("evidence-cited", "tall")}{img("actions", "tall")}</div><p class="cap">Left: the evidence for Question 3, with the exact sentence highlighted. Right: the reviewer actions, where you select Approve.</p>
<div class="ok"><strong>Expected result</strong><p>“Export Excel (2 approved)” is enabled and the downloaded workbook has an answer in the Response column for exactly those two questions. Every other row is blank.</p></div></div>
<div class="right">{steps_html(["Select “Start the interactive demo”, then Question 3. Check that the highlighted evidence says customer data at rest is encrypted with AES-256, then select “Approve”.","Select Question 9, “Do you test restores from backups?”. Check its cited passage, then select “Approve”.","Select “Export Excel (2 approved)”, then open the downloaded file and confirm only those two rows have answers and a “Source:” line."])}<p class="note"><strong>Common mistakes:</strong> approving without reading the passage; expecting answers for every question (most have none by design); looking for the file before the browser finished downloading.</p><a class="open" href="{APP}">Open this part of the app</a><p class="hint">Works while the app is running locally.</p></div></div>''')

num = 6
for f in F:
    feature(f, num); num += 1

# Developer pages
add('dev', 'Run the tests and rebuild data', f'''<h2>For developers: run the tests and rebuild data</h2><p class="where"><strong>Where:</strong> a terminal in the <code>secq-demo</code> folder. <span class="sep"></span> <strong>Purpose:</strong> prove the demo still behaves as described. There is no graphical interface for this; these are commands.</p>
<div class="cols"><div class="left"><pre class="code">npm run test:unit   # matcher parity with the Python engine, review rules,
                    # export + fidelity check
npm run test:e2e    # browser tests, desktop and mobile
npm run data        # rebuild src/data from secq-poc (needs its venv)</pre>
<p class="cap">The unit tests compare every suggestion with the Python prototype’s saved results and run the prototype’s fidelity checker on an exported workbook. The browser tests use an already-installed Chromium; set CHROMIUM_PATH to use another.</p>
<div class="ok"><strong>What you should see</strong><p>Vitest lists 35 passing tests. Playwright lists passing desktop and mobile tests; three desktop-only tests are skipped by design on mobile.</p></div></div>
<div class="right">{steps_html(["Run npm run build, then npm run test:unit.","Run npm run test:e2e. The test configuration starts the static server for you.","Only if the policies or sample workbook change, run npm run data and rebuild."])}<p class="note">Last run before this guide was published: 35 unit tests and 23 browser tests passed, with 3 browser tests skipped by design. The suite also checks that sidebar tooltips are not covered by page content.</p></div></div>''')

add('upload', 'The local-only upload switch', f'''<h2>For developers: the local-only upload switch</h2><p class="where"><strong>Where:</strong> a build-time setting. <span class="sep"></span> <strong>Purpose:</strong> let a developer test the importer with their own fictional .xlsx. The default and public build has no upload control.</p>
<div class="cols"><div class="left"><pre class="code"># PowerShell, local testing only, fictional files only
$env:NEXT_PUBLIC_ALLOW_UPLOAD = "1"
npm run build
npm run serve</pre>
<p class="cap">With the setting, a file chooser appears under the title in the workspace. Without it, no file chooser exists (an automated test checks this).</p>
<div class="ok"><strong>What you should see</strong><p>“Local testing only, fictional files only:” followed by a file chooser. Loading a workbook shows a message “Loaded &lt;file name&gt; for local testing.”</p></div></div>
<div class="right">{steps_html(["Set the variable and rebuild. The setting is read at build time, so a running app will not pick it up.","Choose a fictional .xlsx whose header row contains a question column and a response or answer column.","Run npm run build again without the variable before sharing the build with anyone."])}<p class="note"><strong>Limit:</strong> never load a real customer questionnaire. Real-file handling has not been reviewed or approved. Uploaded workbooks are matched against the same six fictional policies only.</p></div></div>''')

# Troubleshooting
tr = [
 ('The address does not open', 'The server is not running, or port 3100 is in use.', 'Run npm run build, then npm run serve, and keep that terminal open. Set the PORT environment variable to pick another port.'),
 ('“Start the interactive demo” shows an error', 'The sample file could not be fetched.', 'Check that public/sample/Northwind-Security-Questionnaire.xlsx exists in the build (out/sample) and rebuild.'),
 ('Approve is disabled', 'There is no answer yet, or the answer is not Yes, No or N/A for a dropdown question.', 'Select “Edit answer”, choose a value, save, then approve.'),
 ('“Export Excel (0 approved)” is disabled', 'Nothing is approved. Edited, rejected and held answers do not count.', 'Approve at least one answer.'),
 ('An approved answer disappeared from the count', 'You edited it. Every edit withdraws approval.', 'Select “Approve” again after saving.'),
 ('The export has an unexpected “none cited” line', 'The approved answer cites no policy passage.', 'Edit the answer, choose a passage in “Cited evidence”, save and approve again.'),
 ('Choices vanished', 'You pressed “Reset demo” or closed the tab. Choices live in that tab’s session storage only.', 'Redo the review. There is no server copy.'),
 ('Tests cannot launch a browser', 'The Playwright browser revision does not match the installed one.', 'Set CHROMIUM_PATH to an installed Chromium, or install the matching browser with your approval.'),
 ('There is no sign-in, permission or integration to fix', 'The demo has none. If you expected them, you may be thinking of the full product, which does not exist yet.', 'Nothing to configure.'),
]
rows = ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td></tr>' for a, b, c in tr)
add('trouble', 'Troubleshooting', f'<h2>Troubleshooting</h2><p class="where">Find the symptom, check the likely cause, then apply the fix.</p><table class="tt"><tr><th>Symptom</th><th>Likely cause</th><th>What to do</th></tr>{rows}</table>')

# Readiness
add('ready', 'Readiness checklist', f'''<h2>Readiness checklist</h2><p class="where">Check these before you show the demo to anyone.</p>
<div class="three"><div class="card"><h3>Before real use</h3><ul class="check"><li>The app opens at {APP} and the welcome screen loads.</li><li>You can approve, reject, edit and restore a question.</li><li>An export with 2 approvals has exactly 2 answers.</li><li>You told the viewer it is keyword matching, not AI.</li><li>No real company files are loaded.</li></ul></div>
<div class="card"><h3>What this guide covers</h3><ul><li>Every control in the workspace and the welcome screen.</li><li>Launch, first review, export, tour, limits, phone layout and reset.</li><li>Developer commands for tests, data and the local upload switch.</li></ul><h3>Still needs external setup</h3><ul><li>Public hosting: not done. Needs an account and your approval.</li><li>Real-file handling, accounts and billing: not built.</li><li>Human expert review: not part of the software.</li></ul></div>
<div class="card"><h3>Known limits and verification boundaries</h3><ul><li>Matching is keyword matching. In the sample, 5 of 21 questions get a suggestion.</li><li>Export fidelity was checked on the sample workbook with the prototype’s checker, which cannot see images, charts or macros.</li><li>Tested in an automated Chromium on desktop and a 390 px phone profile; not on physical devices or other browsers.</li><li>Screens in this guide are real captures of the running app with fictional data.</li><li>This is not a Tango export.</li></ul><h3>Links</h3><p><a href="{APP}">{APP}</a> (local only)</p></div></div>''')

by = {p[0]: p for p in pages}
body = ''.join(by[i][2].replace('{n}', str(k)) for k, i in enumerate(order, 1))

css = open(os.path.join(HERE, 'guide.css'), encoding='utf8').read()
open(os.path.join(HERE, 'guide.html'), 'w', encoding='utf8').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Questionnaire desk user guide</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head><body>{body}</body></html>')
print(len(order), 'pages')
