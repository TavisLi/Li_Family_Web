"""Offline candidate packaging only. Never writes active governance or prior evidence."""
from pathlib import Path
import difflib
import hashlib
import json
import re
import subprocess

here = Path(__file__).resolve().parent
repo = here.parents[3]
digest = lambda data: hashlib.sha256(data).hexdigest()
read = lambda path: (repo / path).read_text()

# Existing implementation and evidence are protected, not a new semantic oracle.
old_receipt = json.loads(read('docs/phase-artifacts/issue-113/slice-2/validation.json'))
for entry in old_receipt['changed_files']:
    if entry['after_sha256']:
        assert digest((repo / entry['path']).read_bytes()) == entry['after_sha256'], entry['path']
protected = json.loads(read('docs/phase-artifacts/issue-113/slice-3/workspace-before.json'))
for path, expected in protected.items():
    assert digest((repo / path).read_bytes()) == expected, path

targets = {
    'AGENTS.md': 'draft-core.txt',
    'docs/agent-context-routing.md': 'draft-routing.txt',
    '.claude/CLAUDE.md': 'draft-claude.txt',
}
candidates = {target: (here / source).read_text() for target, source in targets.items()}
playbook = 'docs/phase-execution-playbook.md'
proposed = read(playbook)
spec = (here / 'draft-playbook-edits.txt').read_text()
for block in spec.split('@@\n')[1:]:
    lines = block.splitlines(keepends=True)
    before = ''.join(line[1:] for line in lines if line.startswith((' ', '-')))
    after = ''.join(line[1:] for line in lines if line.startswith((' ', '+')))
    assert before and proposed.count(before) == 1, before
    proposed = proposed.replace(before, after, 1)
candidates[playbook] = proposed

link_count = 0
for target, content in candidates.items():
    for dest in re.findall(r'\]\(([^)]+)\)', content):
        if '://' in dest or dest.startswith('#'):
            continue
        path = dest.split('#')[0]
        assert (repo / target).parent.joinpath(path).exists(), (target, dest)
        link_count += 1
    assert content.endswith('\n')
    assert not any(line.rstrip() != line for line in content.splitlines()), target

old_loading_clauses = ['共同實作路由', '所有實作路由都須讀', '完整 Playbook §10', '必讀增量']
for clause in old_loading_clauses:
    assert not any(clause in content for content in candidates.values()), clause

# Structural checks do not certify semantic equivalence or future model behavior.
patch = ''.join(''.join(difflib.unified_diff(
    read(target).splitlines(keepends=True), content.splitlines(keepends=True),
    fromfile='a/' + target, tofile='b/' + target,
)) for target, content in candidates.items())
(here / 'candidate.patch').write_text(patch)
checked = subprocess.run(['git', 'apply', '--check', str(here / 'candidate.patch')], cwd=repo,
                         capture_output=True, text=True)
assert checked.returncode == 0, checked.stderr
assert subprocess.run(['git', 'diff', '--check'], cwd=repo, capture_output=True).returncode == 0
assert not subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=repo).strip()
measurements = {}
for target, content in candidates.items():
    before = (repo / target).read_bytes()
    after = content.encode('utf-8')
    measurements[target] = {
        'current_sha256': digest(before), 'candidate_sha256': digest(after),
        'current_utf8_bytes': len(before), 'candidate_utf8_bytes': len(after),
        'delta_utf8_bytes': len(after) - len(before),
    }
result = {
    'status': 'DRAFT_ONLY_NOT_APPROVED_FOR_APPLICATION',
    'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip(),
    'protected_existing_files_checked': len(protected),
    'prior_slice2_receipt_files_unchanged': True,
    'relative_link_paths_checked': link_count,
    'patch_applies_check_only': True,
    'diff_check': 'PASS', 'staged_paths': [],
    'measurements': measurements,
    'candidate_patch_sha256': digest(patch.encode()),
    'limits': ['Path existence does not validate every Markdown anchor.',
               'Byte counts describe text size only, not runtime reads or token savings.',
               'No model execution or semantic-equivalence proof. Old governance regression is not run.'],
}
(here / 'checks.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
