"""Generates guide.html (A4 landscape, print-ready) for the Questionnaire desk demo.
Run:  node docs/guide/capture.mjs  ->  python docs/guide/build.py  ->  node docs/guide/render.mjs
Screens in img/ are captured from the live app by capture.mjs. Every picture is scaled to FIT its box (never cropped).
The export table is read from a real file exported from the live app (img/export.xlsx)."""
import html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
LIVE = 'https://questionnaire-desk.vercel.app/'
VERSION, DATE = '0.1.0', '2026-10-15'
IMG = os.path.join(HERE, 'img')

def e(s): return html.escape(s, quote=True)

VIS = json.load(open(os.path.join(HERE, 'vis.json'), encoding='utf8'))
# vector pictures rendered from the demo's real components (see vis.guide.test.tsx); names kept short for the page code below
ALIAS = {'list5': 'list-before', 'list5-reviewed': 'list-after', 'mobile-questions': 'phone-questions', 'mobile-evidence': 'phone-evidence',
         'evidence-cited': 'evidence', 'edit-form': 'answer-edit'}

def pic(name, max_w, max_h, cap=0.30, alt=None):
    """A vector picture. The script in guide.html scales it so the WHOLE picture fits max_w x max_h (mm) and never past `cap` mm per CSS px."""
    key = ALIAS.get(name, name)
    v = VIS[key]
    return (f'<div class="vis" data-w="{v["w"]}" data-maxw="{max_w}" data-maxh="{max_h}" data-cap="{cap}" role="img" aria-label="{e(alt or key.replace("-", " "))}">'
            f'<div class="vis-box"><div class="vis-in"><template>{v["html"]}</template></div></div></div>')

# ---------------- steps and page parts ----------------
def steps(items):
    return '<ol class="steps">' + ''.join(f'<li><span class="n">{i}</span><p>{s}</p></li>' for i, s in enumerate(items, 1)) + '</ol>'

def ok_panel(text, title='What you should see'):
    return f'<div class="ok"><strong>{e(title)}</strong><p>{text}</p></div>'

def open_link(note=''):
    return f'<a class="open" href="{LIVE}">Open Questionnaire desk</a><p class="hint">{LIVE}{(" · " + e(note)) if note else ""}</p>'

pages = []
def add(pid, label, body, cls=''):
    pages.append((pid, label, f'<section class="page {cls}" id="{pid}">{body}<footer><a href="#index">Contents</a><span>Questionnaire desk guide · version {VERSION} · page {{n}}</span></footer></section>'))

def head(title, where, purpose):
    return f'<h2>{e(title)}</h2><dl class="wf"><div><dt>Where</dt><dd>{where}</dd></div><div><dt>What it is for</dt><dd>{purpose}</dd></div></dl>'

def feature(pid, title, where, purpose, visual, caption, ok, how, note, tall=False):
    """Normal page: picture + caption + 'what you should see' on the left, steps on the right.
    Tall page (tall pictures): the picture gets the whole left column; 'what you should see' moves to the right."""
    if tall:
        left = f'<div class="shots tallbox">{visual}</div><p class="cap">{e(caption)}</p>'
        right = f'{steps(how)}{ok_panel(ok)}<p class="note">{e(note)}</p>{open_link()}'
    else:
        left = f'<div class="shots">{visual}</div><p class="cap">{e(caption)}</p>{ok_panel(ok)}'
        right = f'{steps(how)}<p class="note">{e(note)}</p>{open_link()}'
    add(pid, title, head(title, where, purpose) + f'<div class="cols"><div class="left">{left}</div><div class="right">{right}</div></div>', 'feature')

# Picture boxes (mm): left column inner width 145; normal height 84, tall height 118
W1, H1, HT = 145, 84, 118

# ---------------- Cover ----------------
LOGO = ('<svg viewBox="70.2 94.9 160 160.4" width="40" height="40" aria-hidden="true">'
        '<path fill="#a7ff35" d="M76.55 102.02C76.57 101.08 78.36 101.34 79.3 101.39C80.94 101.48 82.59 101.83 84.12 102.46C86.83 103.57 89.6 104.74 91.92 106.54C94.52 108.58 96.77 111.1 98.64 113.82C100.87 117.05 102.6 120.63 104.1 124.25C105.63 127.95 106.76 131.82 107.7 135.7C108.92 140.68 109.9 145.73 110.57 150.81C111.52 158.07 112.18 165.38 112.57 172.69C112.96 179.95 112.42 187.24 112.89 194.5C112.97 195.84 113.52 197.15 114.21 198.3C114.7 199.11 115.5 199.74 116.33 200.2C117.3 200.73 118.39 201.17 119.5 201.21C128.77 201.58 138.07 200.97 147.33 201.44C148 201.47 148.88 202.01 148.91 202.69C149.36 213.55 149.25 224.45 148.71 235.31C148.64 236.84 147.78 238.26 147.09 239.63C146.55 240.69 145.9 241.74 145.03 242.55C143.15 244.31 141.25 246.18 138.91 247.26C136.62 248.33 134.02 248.76 131.5 248.84C118.2 249.24 104.88 249.21 91.58 248.72C89.73 248.65 87.98 247.85 86.27 247.15C85.16 246.7 84.14 246.05 83.19 245.31C82.08 244.45 81.04 243.48 80.15 242.38C79.24 241.26 78.45 240.03 77.86 238.72C77.21 237.27 76.76 235.72 76.44 234.16C76.2 232.96 76.19 231.72 76.19 230.5C76.22 187.67 75.51 144.84 76.55 102.02Z"/>'
        '<path fill="#171717" d="M106.61 101.59C106.29 100.65 108.51 100.87 109.5 100.87C142.17 100.66 174.84 100.31 207.5 100.96C209.94 101.01 212.38 101.83 214.55 102.95C216.65 104.04 218.51 105.66 220.04 107.47C221.46 109.13 222.52 111.13 223.23 113.2C223.91 115.21 224.15 117.38 224.17 119.5C224.47 161.83 224.5 204.17 224.17 246.5C224.17 247.31 223.82 248.24 223.17 248.72C222.44 249.26 221.4 249.21 220.5 249.22C204.83 249.35 189.16 249.68 173.5 249.13C171.28 249.06 169.04 248.39 167.08 247.35C164.79 246.13 162.77 244.39 161 242.49C159.84 241.24 159.05 239.65 158.42 238.06C157.72 236.28 157.11 234.41 157.06 232.5C156.78 222.32 156.64 212.1 157.43 201.94C157.49 201.2 158.75 201.11 159.5 201.09C170.83 200.79 182.17 201.24 193.5 200.97C194.62 200.95 195.78 200.73 196.78 200.23C197.64 199.79 198.57 199.15 198.88 198.24C199.24 197.18 199.14 195.88 198.61 194.9C197.94 193.66 196.69 192.78 195.51 192C194.23 191.16 192.77 190.58 191.31 190.11C187.49 188.88 183.46 188.32 179.71 186.9C179.06 186.65 178.48 185.94 178.45 185.25C178.16 178.91 178.08 172.51 178.76 166.19C178.83 165.53 179.93 165.46 180.6 165.37C182.59 165.1 184.66 165.51 186.63 165.12C187.33 164.99 188.03 164.49 188.34 163.84C188.77 162.92 188.98 161.78 188.66 160.82C188.37 159.93 187.52 159.23 186.68 158.83C185.71 158.36 184.57 158.26 183.5 158.32C176.86 158.73 170.22 159.21 163.64 160.22C158.43 161.02 153.27 162.21 148.23 163.74C141.46 165.78 134.99 168.71 128.27 170.92C127.85 171.06 127.31 170.98 126.94 170.73C126.53 170.46 126.21 169.98 126.16 169.5C125.75 165.29 125.91 161.03 125.56 156.81C125.13 151.7 124.67 146.57 123.83 141.51C122.97 136.31 121.97 131.1 120.45 126.05C119.12 121.61 117.27 117.34 115.3 113.15C114.38 111.19 113.11 109.4 111.8 107.67C110.2 105.54 107.46 104.11 106.61 101.59ZM164 166.48C165.81 166.12 167.66 165.96 169.5 165.85C170.11 165.81 170.75 165.82 171.32 166.03C171.75 166.18 172.32 166.45 172.36 166.89C172.75 172.4 172.7 177.93 172.56 183.45C172.55 184.14 172.6 185.35 171.91 185.42C165.84 186.03 159.7 185.18 153.6 185.36C150.28 185.46 146.95 185.75 143.66 186.26C138.08 187.13 132.61 188.64 127.02 189.49C126.53 189.56 125.65 189.51 125.6 189.01C125.34 185.91 125.68 182.76 126.19 179.69C126.31 178.98 126.8 178.25 127.45 177.94C133.23 175.22 139.11 172.63 145.2 170.72C151.33 168.8 157.7 167.75 164 166.48Z"/></svg>')

add('cover', 'Cover', f'''<div class="cover"><div class="cl"><div class="brand"><span class="logo">{LOGO}</span><span>Questionnaire desk</span></div>
<h1>Review security questionnaires with the evidence in front of you.</h1>
<p class="lead">A short, step-by-step guide to the Questionnaire desk demo. You open a sample questionnaire, check each suggested answer against a policy, approve the ones that are right, and download a finished Excel file.</p>
<ul class="labels"><li>Suggested answers</li><li>Cited evidence</li><li>You approve</li><li>Excel export</li></ul>
<a class="open big" href="{LIVE}">Open Questionnaire desk</a>
<p class="meta">{LIVE} · Version {VERSION} · Checked {DATE}<br>Demo with fictional data. Keyword matching, not AI. Nobody but you reviews the answers.</p></div>
<div class="cr">{pic("workspace", 150, 160, 0.34, "The Questionnaire desk workspace")}</div></div>''', 'coverpage')

# ---------------- Contents ----------------
FEATURES = [
    ('welcome', 'Start from the welcome screen'), ('questions', 'Pick a question from the list'), ('progress', 'Follow your progress'),
    ('suggestion', 'Read a suggested answer'), ('flags', 'When the software drafts nothing'), ('evidence', 'Check the evidence'),
    ('library', 'Browse the policy library'), ('approve', 'Approve an answer'), ('hold', 'Reject, or ask for more evidence'),
    ('edit', 'Write your own answer'), ('export', 'Download the Excel file'), ('tour', 'Take the guided tour'),
    ('limits', 'Read the limits'), ('mobile', 'Use it on a phone'), ('reset', 'Start over'),
]
SECTIONS = [('start', 'Start here'), ('glance', 'The screen at a glance'), ('first', 'Your first review in 4 steps')] + FEATURES + [
    ('dev', 'For developers: run it yourself'), ('trouble', 'If something goes wrong'), ('ready', 'Checklist and limits')]
order = ['cover', 'index'] + [k for k, _ in SECTIONS]
pageno = {k: i for i, k in enumerate(order, 1)}
half = (len(SECTIONS) + 1) // 2
def col(items, start):
    return f'<ol class="idx" style="counter-reset: n {start - 1}">' + ''.join(f'<li><a href="#{i}">{e(t)}</a><span class="pg">{pageno[i]}</span></li>' for i, t in items) + '</ol>'
add('index', 'Contents', f'''<h2>Contents</h2><p class="lede">New here? Read the first three pages, then follow the numbered pages in order. Each one is a single task.</p>
<div class="two">{col(SECTIONS[:half], 1)}{col(SECTIONS[half:], half + 1)}</div>
<div class="ok wide"><strong>The shortest path</strong><p>Page {pageno['start']} (Start here) → page {pageno['first']} (Your first review) → page {pageno['export']} (Download the Excel file). That is about four minutes.</p></div>''')

# ---------------- Start here ----------------
add('start', 'Start here', f'''<h2>Start here</h2><p class="lede">Questionnaire desk is a demo of a simple idea: software suggests an answer, and <strong>you</strong> decide. Nothing goes into the Excel file until you approve it.</p>
<div class="three">
<div class="card"><span class="big-n">1</span><h3>Open the link</h3><p>Use any current web browser on a computer or phone. There is nothing to install and no account to make.</p>{open_link()}</div>
<div class="card"><span class="big-n">2</span><h3>Review the answers</h3><p>A sample questionnaire with 21 questions loads for you. The software suggests an answer where a fictional company policy supports one.</p></div>
<div class="card"><span class="big-n">3</span><h3>Download the result</h3><p>Only answers you approved are written into a copy of the Excel file. Everything else stays blank.</p></div></div>
<div class="ok wide"><strong>Good to know before you start</strong><p>All names, policies and answers are fictional. The matching is simple keyword matching, not artificial intelligence, so many questions will have no suggestion. That is on purpose. Nothing you do is sent anywhere or saved on a server. Please do not use real company files.</p></div>''')

# ---------------- The screen at a glance (numbered markers on the real screenshot) ----------------
marks = [
    ('[data-tour=list]', 1, 'Questions', 'All 21 questions. Click one to open it.'),
    ('section[aria-label="Review progress"]', 2, 'Progress', 'How many answers you approved, still have to check, or held back.'),
    ('[data-tour=answer]', 3, 'The suggestion', 'What the software proposes. A dashed edge means nobody has approved it yet.'),
    ('[data-tour=evidence]', 4, 'Evidence', 'The exact policy sentence behind the suggestion.'),
    ('[data-tour=actions]', 5, 'Your buttons', 'Approve, edit, reject, or ask for more evidence.'),
    ('[data-tour=export]', 6, 'Download', 'Writes your approved answers into the Excel file.'),
]
badges = ''.join(f'<span class="badge" data-target="{e(sel)}">{n}</span>' for sel, n, _, _ in marks)
legend = ''.join(f'<li><span class="badge s">{n}</span><div><strong>{e(t)}</strong><span>{e(d)}</span></div></li>' for _, n, t, d in marks)
add('glance', 'The screen at a glance', f'''<h2>The screen at a glance</h2><p class="lede">This is the main screen once you press “Start the interactive demo”. The numbers match the list on the right.</p>
<div class="cols glance"><div class="left"><div class="annot">{pic("workspace", 168, 128, 0.3)}{badges}</div></div>
<div class="right"><ul class="legend">{legend}</ul></div></div>''', 'feature')

# ---------------- First review ----------------
add('first', 'Your first review in 4 steps', head('Your first review in 4 steps', 'The live demo.', 'Approve two answers and download an Excel file that contains only those two. About four minutes, no cost.')
    + f'''<div class="cols"><div class="left"><div class="shots row">{pic("evidence-cited", 70, H1, 0.3)}{pic("actions", 70, H1, 0.3)}</div>
<p class="cap">Left: the evidence for Question 3. Right: the Approve button you will press.</p>{ok_panel("The button at the top right reads “Export Excel (2 approved)”. The file you download has an answer next to exactly those two questions, and the rest is blank.", "What you should end up with")}</div>
<div class="right">{steps(["Press <strong>Start the interactive demo</strong>, then click <strong>Question 3</strong> in the list.", "Read the highlighted sentence on the right. It says customer data at rest is encrypted. Press <strong>Approve</strong>.", "Click <strong>Question 9</strong> (“Do you test restores from backups?”), read its sentence, press <strong>Approve</strong>.", "Press <strong>Export Excel (2 approved)</strong> at the top right and open the file."])}
<p class="note">Common mistake: approving without reading the sentence. The software can be wrong; you are the check.</p>{open_link()}</div></div>''', 'feature')

# ---------------- Feature pages ----------------
feature('welcome', 'Start from the welcome screen', 'The first page when you open the link.',
        'Explains the idea and lets you try an approval before you open the questionnaire.',
        f'<div class="stack">{pic("welcome-buttons", W1, 28, 0.3)}{pic("welcome-card", W1, 88, 0.3)}</div>',
        'Top: the two buttons. Below: a small practice example. It is not part of your questionnaire.',
        'A practice card with a dashed box that says “Software suggestion, not yet reviewed”.',
        ['Press <strong>Approve this suggestion</strong> in the practice card. The dashed box becomes a solid, green-edged box.',
         'Press <strong>Undo approval</strong> to go back. Nothing here is saved.',
         'Press <strong>Start the interactive demo</strong> to open the real questionnaire, or <strong>Download the sample questionnaire</strong> to get the Excel file.'],
        'Cost: none. The sample file comes from the same site; nothing is uploaded.', tall=True)

feature('questions', 'Pick a question from the list', 'Left column, titled “Questionnaire”.',
        'Shows every question with a status, so you can see what still needs you.',
        f'<div class="row2">{pic("list5", 70, HT, 0.3)}{pic("list5-reviewed", 70, HT, 0.3)}</div>',
        'Left: before you review. Right: after approving Questions 1 and 3. The selected row has a dark outline.',
        'The row you click is outlined, and the middle and right columns show that question.',
        ['Click any question. You can also use the Up and Down arrow keys, Home and End.',
         'Read the status label under it. “Suggested, needs review” means the software drafted an answer. “Needs your judgment” and “No supporting evidence” mean it drafted nothing.',
         'Work through the questions in any order.'],
        'In this sample, 5 questions get a suggestion, 2 need your judgment and 14 have none.', tall=True)

feature('progress', 'Follow your progress', 'Top of the middle column.',
        'Counts what you approved, what is still waiting, and what you held back.',
        f'<div class="stack">{pic("stats-empty", W1, 40, 0.3)}{pic("stats-reviewed", W1, 40, 0.3)}</div>',
        'Top: at the start. Bottom: after approving three, rejecting one and holding one.',
        'Approved goes up when you approve. Held back counts rejected answers and “needs more evidence” answers.',
        ['Approve, reject or hold a question (the next pages show how).',
         'Watch the three numbers change.',
         'The row of small bars is a map of all 21 questions: green is approved, red is rejected, amber is held back, grey is untouched.'],
        'These numbers are for this session only. They are not customer data.')

feature('suggestion', 'Read a suggested answer', 'Middle column, the big box under the question.',
        'Shows what the software proposes, and that nobody has approved it yet.',
        pic("answer-q3", W1, H1, 0.3),
        'Question 3. The dashed, striped edge means “suggestion, not approved”.',
        'An answer such as “Yes”, the title “Software suggestion, not yet reviewed”, and a line naming the policy it comes from.',
        ['Click <strong>Question 3</strong>, “Is customer data encrypted at rest?”.',
         'Read the answer and the line that names the policy it cites.',
         'Do not treat it as final. The next pages show how to check it.'],
        'The software only matches keywords. It is not AI and has not been checked by an expert.')

feature('flags', 'When the software drafts nothing', 'Middle column, above the answer box.',
        'Explains why a question has no suggestion, so a gap is never filled with a guess.',
        pic("answer-q2", W1, H1, 0.3),
        'Question 2: the closest policy sentence is negative or conditional, so nothing is drafted. Question 1 looks the same, but its note says no supporting evidence was found.',
        'The answer box says “No suggested answer”, and the Approve button is greyed out.',
        ['Click <strong>Question 1</strong> or <strong>Question 2</strong>.',
         'Read the note. It tells you whether the software found a doubtful sentence or nothing at all.',
         'If a policy does cover the question, write the answer yourself (see “Write your own answer”).'],
        'On purpose: the demo prefers a blank to a guess.')

feature('evidence', 'Check the evidence', 'Right column, “Cited evidence”.',
        'Shows the exact policy sentence behind a suggestion, with the document, version and date.',
        pic('evidence-cited', W1, HT, 0.42),
        'The yellow highlight is the exact source sentence. It is set in a different typeface so it looks like quoted text.',
        'A card with the policy name (Encryption Standard v1.4), its status, and the highlighted sentence.',
        ['Click a question that has a suggestion, such as <strong>Question 3</strong>.',
         'Compare the highlighted sentence with the question. Check the version and the “Status” line.',
         'If the sentence does not really answer the question, do not approve it.'],
        'All six policies are fictional.', tall=True)

feature('library', 'Browse the policy library', 'Right column, “Evidence library”.',
        'Lists all six fictional policies so you can find support the software missed.',
        pic('library', W1, HT, 0.42),
        'The Encryption Standard is open because Question 3 cites it. The cited sentence is highlighted.',
        'Each policy opens to show its version, review date and its passages.',
        ['Click a policy name to open it.',
         'Read its passages. They are fixed text and cannot be edited.',
         'Found the support for a question the software missed? Use it in “Write your own answer”.'],
        'The library has 6 policies and 18 passages, built into the demo.', tall=True)

feature('approve', 'Approve an answer', 'Right column, “Reviewer actions”.',
        'Records that you checked the answer and its evidence. Only approved answers are downloaded.',
        f'<div class="stack">{pic("answer-approved", W1, 60, 0.3)}{pic("actions", W1, 54, 0.3)}</div>',
        'Top: Question 3 after approving. Solid green edge, and a note that it will be written to the Excel file. Bottom: the buttons.',
        'The box title changes to “Approved answer”, and the Export button counts it.',
        ['Click <strong>Question 3</strong> and check its evidence.',
         'Press <strong>Approve</strong>. It is greyed out if there is no answer yet.',
         'Changed your mind? Press <strong>Restore the original suggestion</strong> to undo all your changes to this question.'],
        'Approving is your decision. The demo does not claim any expert reviewed the answer.', tall=True)

feature('hold', 'Reject, or ask for more evidence', 'Right column, “Reviewer actions”.',
        'Keeps weak or unsupported answers out of the Excel file.',
        pic('answer-rejected', W1, 70, 0.4),
        'A rejected answer. Its cell stays blank in the Excel file.',
        'The label says “Rejected, will not export” or “More evidence needed”.',
        ['Open a question whose evidence does not support the answer.',
         'Press <strong>Reject</strong> to throw the suggestion away, or <strong>Needs more evidence</strong> if you need a better policy first.',
         'You can still change your mind later and press Approve.'],
        'Rejected and held answers are never downloaded.')

feature('edit', 'Write your own answer', 'Right column: Reviewer actions → “Edit answer”.',
        'Lets you answer a question the software missed, or fix a suggestion, and link it to a policy sentence.',
        pic('edit-form', W1, HT, 0.4),
        'The edit form. The Yes / No / N/A choice matches the dropdown in the Excel file.',
        'After you press “Save edit” the label reads “Edited, needs approval”, and the box is dashed again.',
        ['Press <strong>Edit answer</strong>. Choose Yes, No or N/A. A comment is optional.',
         'Under “Cited evidence” pick the policy sentence that supports your answer.',
         'Press <strong>Save edit</strong>, then press <strong>Approve</strong>. Saving does not approve it.'],
        'Every edit cancels an earlier approval. If you cite nothing, the Excel file says “Source: none cited; answer entered by the reviewer.”', tall=True)

# Export page with a real table from the exported file
def export_table():
    p = os.path.join(IMG, 'export.xlsx')
    if not os.path.exists(p): return ''
    import openpyxl
    ws = openpyxl.load_workbook(p)['Questionnaire']
    out = ['<table class="sheet"><tr><th>ID</th><th>Question</th><th>Response</th><th>Comments / Evidence</th></tr>']
    for r in range(2, 6):
        c = [ws.cell(r, i).value or '' for i in range(1, 5)]
        com = c[3] if len(c[3]) < 120 else c[3][:117] + '…'
        out.append(f'<tr><td>{e(str(c[0]))}</td><td>{e(str(c[1]))}</td><td>{e(str(c[2]))}</td><td>{e(com)}</td></tr>')
    return ''.join(out) + '</table>'
feature('export', 'Download the Excel file', 'Top right: “Export Excel (N approved)”.',
        'Writes only your approved answers into a copy of the sample Excel file, keeping its formatting.',
        f'<div class="stack">{pic("export-button", 80, 18, 0.45)}{export_table()}</div>',
        'The button, and the first rows of a real downloaded file. Question 2 was not approved, so it is blank.',
        'A file called Northwind-Security-Questionnaire-reviewed.xlsx downloads. Approved rows have an answer and a “Source:” note.',
        ['Approve at least one answer. The button is greyed out while the count is 0.',
         'Press <strong>Export Excel (N approved)</strong>. Your browser saves the file.',
         'Open it in Excel and check the Response and Comments columns.'],
        'Kept: sheet order, column widths, row heights, merged cells, dropdowns, colours and frozen panes (checked on the sample only). Not supported: images, charts and macros.')

feature('tour', 'Take the guided tour', 'Left sidebar, compass icon “Guided tour”.',
        'A five-step walk through the screen that outlines each area for you.',
        f'<div class="row2 center">{pic("tour", 74, 60, 0.3)}{pic("sidebar-tour", 56, 60, 0.45)}</div>',
        'Left: the tour card. Right: the sidebar icon and its label.',
        'A card “Review the questionnaire”, step 1 of 5, and the question list gets an outline.',
        ['Press the compass icon <strong>Guided tour</strong>. On a phone it is a button under the title.',
         'Press <strong>Next</strong> and <strong>Back</strong> to move between the five steps.',
         'Press <strong>Finish</strong> at the end, or <strong>End the guide</strong> (or Esc) at any time.'],
        'From step 2 the tour opens Question 3 for you. It does not erase your choices.')

feature('limits', 'Read the limits', 'Left sidebar, “i” icon “Limits”.',
        'One place that lists what the Excel file keeps, what it cannot handle, and how matching works.',
        pic('limits', 120, HT, 0.3),
        'The Limits window.',
        'A window titled “What this demo can and cannot do”.',
        ['Press the “i” icon <strong>Limits</strong>.',
         'Read what the export keeps and what it does not support.',
         'Press <strong>Close</strong>, press Esc, or click outside the window.'],
        'Fidelity was checked on this sample file only, not promised for every workbook.', tall=True)

feature('mobile', 'Use it on a phone', 'Any screen narrower than a laptop.',
        'The three columns become three tabs so everything stays readable.',
        f'<div class="row2 center">{pic("mobile-questions", 66, HT, 0.3)}{pic("mobile-evidence", 66, HT, 0.3)}</div>',
        'Left: the question list. Right: after tapping Question 3 and the “Evidence and review” tab.',
        'Three tabs at the bottom: Questions, Answer, and Evidence and review.',
        ['Tap a question. The app moves to the Answer tab.',
         'Tap <strong>Evidence and review</strong> to see the evidence and the buttons.',
         'Tap <strong>Export Excel</strong> at the top when you are done.'],
        'Tested in a phone-sized browser, not on real phones. The live site shows the app a little smaller than these pictures.', tall=True)

feature('reset', 'Start over', 'Left sidebar, circular-arrow icon “Reset demo”.',
        'Clears every approval, rejection, edit and hold so you can run the demo again.',
        f'<div class="row2 center">{pic("sidebar-reset", 80, 80, 0.5)}</div>',
        'The sidebar: Guided tour, Limits and Reset demo. A label shows when you point at an icon.',
        'A short message “Demo reset. All review choices were cleared.”, and Export Excel greys out again.',
        ['Press <strong>Reset demo</strong>.',
         'Check that the count says 0 approved.',
         'Your choices stay if you reload the page, but they are kept only in this browser tab, so closing the tab also clears them.'],
        'Nothing is saved on a server and nothing is shared between tabs or devices.')

# ---------------- Developers ----------------
add('dev', 'For developers: run it yourself', head('For developers: run it yourself', 'A terminal in the <code>secq-demo</code> folder.', 'Run the demo on your own computer, and check that it still behaves as described. These are commands, not screens.')
    + f'''<div class="cols"><div class="left"><pre class="code">npm install
npm run build
npm run serve          # opens http://localhost:3100

npm run test:unit      # matcher, review rules, export check
npm run test:e2e       # browser tests, desktop and phone
npm run data           # rebuild data from the Python prototype</pre>
<p class="cap">The code is at github.com/itzrohithq-wq/Questionnaire-Desk. Pushing to its main branch redeploys the live site on Vercel.</p>{ok_panel("The terminal prints http://localhost:3100. The unit tests list 36 passing; the browser tests list 25 passing and 5 skipped on purpose.", "What you should see")}</div>
<div class="right">{steps(["Run <code>npm install</code> once, then <code>npm run build</code>.", "Run <code>npm run serve</code> and open http://localhost:3100.", "Run the tests whenever you change something."])}
<p class="note"><strong>Local upload switch:</strong> set the build variable <code>NEXT_PUBLIC_ALLOW_UPLOAD=1</code> to show a file chooser for your own fictional .xlsx files. The live site never has it. Never load real customer files.</p></div></div>''', 'feature')

# ---------------- Troubleshooting ----------------
tr = [
    ('The link does not open', 'No internet, or a company filter blocks vercel.app.', 'Try another network or browser. Check the address is exactly ' + LIVE),
    ('“Start the interactive demo” shows an error', 'The sample file did not download.', 'Reload the page and try again.'),
    ('Approve is greyed out', 'There is no answer yet.', 'Press “Edit answer”, choose Yes, No or N/A, save, then approve.'),
    ('“Export Excel (0 approved)” is greyed out', 'Nothing is approved. Edited, rejected and held answers do not count.', 'Approve at least one answer.'),
    ('An approved answer stopped counting', 'You edited it. Every edit cancels the approval.', 'Press Approve again after saving.'),
    ('The Excel file says “none cited”', 'The approved answer has no policy sentence attached.', 'Edit the answer, choose a sentence under “Cited evidence”, save, approve.'),
    ('My choices are gone', 'You pressed Reset demo or closed the tab.', 'Start again. Choices are kept only in that browser tab.'),
    ('There is no sign-in or permission to fix', 'The demo has none. You may be thinking of a full product, which does not exist yet.', 'Nothing to set up.'),
]
rows = ''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td></tr>' for a, b, c in tr)
add('trouble', 'If something goes wrong', f'<h2>If something goes wrong</h2><p class="lede">Find what you see in the first column, then follow the last column.</p><table class="tt"><tr><th>What you see</th><th>Likely reason</th><th>What to do</th></tr>{rows}</table>')

# ---------------- Checklist ----------------
add('ready', 'Checklist and limits', f'''<h2>Checklist and limits</h2><p class="lede">Check these before you show the demo to someone else.</p>
<div class="three"><div class="card"><h3>Before you show it</h3><ul class="check"><li>{LIVE} opens and shows the welcome screen.</li><li>You can approve, reject, edit and restore a question.</li><li>A download with 2 approvals has exactly 2 answers.</li><li>You told people it is keyword matching, not AI.</li><li>No real company files are used.</li></ul></div>
<div class="card"><h3>What this guide covers</h3><ul><li>Every control in the live demo, in the order you meet it.</li><li>Starting, reviewing, downloading, the tour, the limits, phones and reset.</li><li>Developer commands for running and testing it.</li></ul><h3>Not part of the demo</h3><ul><li>Accounts, billing and real-file upload.</li><li>An expert human review. That is a separate service idea, not this software.</li></ul></div>
<div class="card"><h3>Limits and what was checked</h3><ul><li>In the sample, 5 of 21 questions get a suggestion.</li><li>The Excel file was checked on the sample only; images, charts and macros are not supported.</li><li>Tested in Chromium on a computer and in a phone-sized window, not on real phones or other browsers.</li><li>Pictures in this guide are real screens of the live site, shown at 100% size.</li><li>This is not a Tango export.</li></ul><h3>Link</h3><p><a href="{LIVE}">{LIVE}</a></p></div></div>''')

by = {p[0]: p for p in pages}
body = ''.join(by[i][2].replace('{n}', str(k)) for k, i in enumerate(order, 1))
css = open(os.path.join(HERE, 'guide.css'), encoding='utf8').read()
appcss = open(os.path.join(HERE, 'app.css'), encoding='utf8').read()
# Tailwind v4 registers its --tw-* defaults (e.g. border style = solid) with @property; those only take effect at document level, so lift them out of the shadow-root sheet.
import re
css += chr(10) + chr(10).join(re.findall(r'@property\s+--[\w-]+\s*\{[^}]*\}', appcss))
script = open(os.path.join(HERE, 'guide.js'), encoding='utf8').read()
open(os.path.join(HERE, 'guide.html'), 'w', encoding='utf8').write(
    f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Questionnaire desk user guide</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style><style id="app-css" media="not all">{appcss}</style></head><body>{body}<script>{script}</script></body></html>')
print(len(order), 'pages')
