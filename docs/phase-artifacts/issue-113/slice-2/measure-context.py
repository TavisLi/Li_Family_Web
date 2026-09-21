"""Recompute three static UTF-8 instruction-read byte proxies from actual files.
No model run, tokens, billing estimates, network, application or database access.
Run from repo root. Writes only sibling static-benchmark.json.
"""
from pathlib import Path
import hashlib,json,re,subprocess
R=Path.cwd();O=Path(__file__).resolve().parent
baseline=json.loads((O/'baseline.json').read_text());REV=baseline['head']
A='docs/全栈系统需求与技术架构说明书.md';P='docs/phase-execution-playbook.md'
G='/Users/tien-hsinglee/.codex/AGENTS.md';ROUTE='docs/agent-context-routing.md'
sha=lambda data:hashlib.sha256(data).hexdigest()
assert sha(Path(G).read_bytes())==baseline['protected'][G], 'Global context drift'
def read(path,revision=None):
 if Path(path).is_absolute():return Path(path).read_text()
 if revision:return subprocess.check_output(['git','show',f'{revision}:{path}']).decode()
 return (R/path).read_text()
def adr(n):return str(next((R/'docs/adr').glob(f'{n:04d}-*.md')).relative_to(R))
def measure(spec,revision=None):
 entries=[]
 for path,heads in spec.items():
  text=read(path,revision);lines=text.splitlines(keepends=True)
  selected=set(range(len(lines))) if heads is None else set()
  for heading in heads or []:
   matches=[i for i,line in enumerate(lines) if line.rstrip()==heading]
   assert len(matches)==1,(path,heading)
   start=matches[0];level=len(heading)-len(heading.lstrip('#'));end=len(lines)
   for i in range(start+1,len(lines)):
    m=re.match(r'^(#{1,6}) ',lines[i])
    if m and len(m[1])<=level:end=i;break
   selected.update(range(start,end))
  indexes=sorted(selected);ranges=[]
  for i in indexes:
   if ranges and ranges[-1][1]==i:ranges[-1][1]=i+1
   else:ranges.append([i+1,i+1])
  payload=''.join(lines[i] for i in indexes).encode()
  entries.append({'path':path,'revision':revision or ('unchanged global snapshot' if Path(path).is_absolute() else 'implemented working tree'),'headings':heads or ['FULL'],'line_ranges_1_based_inclusive':ranges,'file_sha256':sha(text.encode()),'selected_sha256':sha(payload),'utf8_bytes':len(payload)})
 return {'instruction_read_utf8_bytes_proxy':sum(e['utf8_bytes'] for e in entries),'unique_files':len(entries),'reads':entries}
common_play=['### 必要輸入','### 必須寫清楚','### 授權矩陣','## 7. Gate 3：實施規格','### 3.2 PRD、Issue、Phase、PR 的關係','## 5. Gate 1：Preflight','## 10. Gate 6：本地驗證']
# §11 prefix through the QA checklist only: branch-to-Production exception is not applicable.
# Extracting the parent would include §11.1, so this narrowly bounded prefix is handled separately.
def actual_spec(arch,adrs,extra_play=None,glossary=False,source=False):
 heads=[line.rstrip() for line in read(A).splitlines() if any(line.startswith(f'## {n}. ') for n in arch)]
 assert len(heads)==len(arch)
 out={G:None,'AGENTS.md':None,ROUTE:None,A:heads+[line for line in read(A).splitlines() if line.startswith('## 11. ')][0:1],P:common_play+(extra_play or [])}
 for n in adrs:out[adr(n)]=None
 if glossary:out['CONTEXT.md']=None
 if source:out['docs/travel-content-source-guidelines.md']=None
 return out
fixtures=[
 ('F-UI','既有 member UI spacing fix；不改 data／deploy',[2],[3,4,6],[2],[],False,False),
 ('F-DATA','Travel caption projection fix；不 seed/schema/Production',[1,2,3,6,7],[4,5,6,8],[1,2,3,6,7],[],True,True),
 ('F-SENSITIVE','schema/legacy cleanup preparation；不 live inventory/apply/delete',[1,2,6,7,8],[4,5,6,8,9,10],[1,2,3,6,7,8],['## 4. Human-in-the-loop（HITL）關鍵節點','## 9. Gate 5：資料與 Migration'],True,False),
]
results=[]
for ident,task,before_adrs,arch,after_adrs,play,glossary,source in fixtures:
 before={G:None,'AGENTS.md':None,'CONTEXT.md':None,A:None,'docs/adr/README.md':None,**{adr(n):None for n in before_adrs}}
 if ident=='F-DATA':before['docs/travel-content-source-guidelines.md']=None
 if ident=='F-SENSITIVE':before[P]=None
 old=measure(before,REV)
 new=measure(actual_spec(arch,after_adrs,play,glossary,source))
 text=read(P);lines=text.splitlines(keepends=True)
 start=next(i for i,l in enumerate(lines) if l.startswith('## 11. Gate 7：'))
 end=next(i for i,l in enumerate(lines) if l.startswith('### 11.1 '))
 item=next(e for e in new['reads'] if e['path']==P)
 # Union selected line ranges and QA prefix; no double counting of overlapping reads.
 indexes=set()
 for a,b in item['line_ranges_1_based_inclusive']:indexes.update(range(a-1,b))
 indexes.update(range(start,end));payload=''.join(lines[i] for i in sorted(indexes)).encode()
 item['headings'].append('## 11. Gate 7：PR 與 Preview — prefix before §11.1')
 item['line_ranges_1_based_inclusive'].append([start+1,end])
 item['utf8_bytes']=len(payload);item['selected_sha256']=sha(payload)
 new['instruction_read_utf8_bytes_proxy']=sum(e['utf8_bytes'] for e in new['reads'])
 delta=new['instruction_read_utf8_bytes_proxy']-old['instruction_read_utf8_bytes_proxy']
 results.append({'id':ident,'task':task,'before':old,'after':new,'delta_bytes':delta,'delta_percent':round(delta/old['instruction_read_utf8_bytes_proxy']*100,2),'behavior_benchmark':'NOT_RUN_SLICE_3','model_tokens':None,'tool_calls':None,'repeated_reads':None,'clarification_rounds':None,'duplicate_approval_rounds':None,'completion_quality':None})
output={'basis':'STATIC_UTF8_INSTRUCTION_READ_BYTE_PROXY_ONLY','baseline_commit':REV,'fixtures':results,'assumptions':['Before retains the Slice1 fixed read-set definition and reads actual baseline commit blobs, not current modified files.','After uses actual implemented AGENTS and full routing text, mandatory common-route sections and applicable domain/safety owners.','The data and sensitive cases conservatively retain full CONTEXT; no safety context omission is counted as savings.','Sensitive fixture adds ADR0003 and architecture travel §8 to follow the approved domain route; this safety correction is not hidden.','File-content selected bytes include headings and original newlines. Overlapping selections are counted once.','Unchanged host/tool/catalog overhead, task/Issue text, code/test/data/evidence output bytes are excluded on both sides.','No Skill body assumed loaded for routine UI; metadata change is not counted as automatic token savings.','Static file selection is not an observed agent read trace, token savings or model performance result.']}
(O/'static-benchmark.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{'id':f['id'],'before':f['before']['instruction_read_utf8_bytes_proxy'],'after':f['after']['instruction_read_utf8_bytes_proxy'],'delta':f['delta_bytes'],'percent':f['delta_percent']} for f in results],ensure_ascii=False,indent=2))
