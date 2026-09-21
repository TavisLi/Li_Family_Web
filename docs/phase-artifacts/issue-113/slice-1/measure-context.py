"""Read-only governance cost model. Writes only benchmark-fixtures.json beside this file.
Run from the repository root: python3 docs/phase-artifacts/issue-113/slice-1/measure-context.py
Not a model-behavior test; does not run application code or access Production.
"""
from pathlib import Path
import hashlib,json,re,subprocess
R=Path.cwd();O=Path(__file__).resolve().parent
A='docs/全栈系统需求与技术架构说明书.md';P='docs/phase-execution-playbook.md';D='docs/adr/'
G=Path('/Users/tien-hsinglee/.codex/AGENTS.md')
B='f1796687d2469319c4a465feada1ffc3cb8b59d8'
common=['AGENTS.md','CONTEXT.md',A,D+'README.md']
adr=lambda n:next(str(p.relative_to(R)) for p in (R/D).glob(f'{n:04d}-*.md'))
def contents(p,rev=None):
 if Path(p).is_absolute():return Path(p).read_bytes()
 return subprocess.check_output(['git','show',rev+':'+p]) if rev else (R/p).read_bytes()
def sections(path,numbers):
 text=(R/path).read_text();chunks=re.split(r'(?=^## \d+\.)',text,flags=re.M)
 return ''.join(c for c in chunks if any(c.startswith(f'## {n}.') for n in numbers)).encode()
def candidate(path):return '\n'.join((O/path).read_text().splitlines()[1:]).encode()
fixtures=[
 dict(id='F-UI',task='既有 member UI 小幅 spacing 修正；保留視覺方向與資料邏輯，不部署',before=common+[adr(2)],arch=[3,4,6],adrs=[adr(2)],play=[],seams=['src/features/member/','package.json'],gates=['preserve dirty assets','no dependency/design-system expansion','access invariant','focused UI validation','no deployment authority']),
 dict(id='F-DATA',task='Travel Memory caption projection 修正；不 seed、不改 schema、不讀 Production',before=common+[adr(n) for n in [1,2,3,6,7]]+['docs/travel-content-source-guidelines.md'],arch=[4,5,6,8],adrs=[adr(n) for n in [1,2,3,6,7]],play=[],seams=['src/lib/data/travel.ts','src/payload/payload-types.ts','src/features/travel/'],gates=['asset altText vs placement caption','derived generated types','access filtering','focused regression/build then tsc','no write authority']),
 dict(id='F-SENSITIVE',task='準備 schema/legacy cleanup proposal；不作 live inventory、migration、delete、merge',before=common+[adr(n) for n in [1,2,6,7,8]]+[P],arch=[4,5,6,9,10],adrs=[adr(n) for n in [1,2,6,7,8]],play=[4,9],seams=['src/payload/collections/','src/migrations/','approved package only if supplied'],gates=['H4 access before live query','H5-H8 separate authority','backup and bounded ADR waiver','dry-run/rehearsal/read-back required before approved apply','#105 owns executor','drift/UNKNOWN fail closed'])]
for f in fixtures:
 files=[str(G)]+f.pop('before');before=[]
 for rev in [B,None]:
  before.append({'revision':rev or 'audit HEAD','file_content_bytes':sum(len(contents(p,rev)) for p in files),'unique_files':len(files)})
 extras=sum(len(contents(p)) for p in f['adrs'])+len(sections(A,f['arch']))+(len(sections(P,f['play'])) if f['play'] else 0)
 if f['id']=='F-DATA':extras+=len(contents('docs/travel-content-source-guidelines.md'))+len(contents('CONTEXT.md'))
 planned=len(G.read_bytes())+len(candidate('draft-core.txt'))+len(candidate('draft-routing.txt'))+extras
 f.update({'basis':'STATIC_PLANNED_READ_SET_NOT_EXECUTED_AGENT_RUN','before_files':files,'before':before,'proposal_file_content_bytes':planned,'proposal_reduction_percent':round(100*(before[1]['file_content_bytes']-planned)/before[1]['file_content_bytes'],1),'proposal_unique_files':3+1+len(f['adrs'])+(1 if f['play'] else 0)+(2 if f['id']=='F-DATA' else 0),'fixed_overhead':'Injected host/tool/plugin metadata not included in fixture delta; remains separate in inventory.json. Code/test/source/Issue/evidence bytes excluded equally, never counted as savings.','actual_tool_calls':None,'actual_repeated_reads':None,'actual_clarification_rounds':None,'actual_duplicate_approval_rounds':None,'actual_completion_or_blocker_quality':'NOT RUN — Slice 3','validation':'Same required gates before/after. No application tests run for this audit.'})
out={'measurement':'UTF-8 file content bytes as instruction-read proxy; not token telemetry','fixtures':fixtures,'assumptions':['Current full-read policy interpreted conservatively: relevant ADR only, no automatic Skill body inflation.','Global AGENTS is current snapshot for both historical and current comparisons; no historical global version available.','No historical reports counted as mandatory baseline unless fixture needs them.','Proposed figures use draft text plus unchanged owning sections; final dedup and actual tool output wrapper cost require Slice 3.','Skill references are read only for an actual design task. Optional design-taste activation adds 87253 bytes today; not included in ordinary UI fixture.']}
(O/'benchmark-fixtures.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:f[k] for k in ['id','before','proposal_file_content_bytes','proposal_reduction_percent']} for f in fixtures],ensure_ascii=False,indent=2))
