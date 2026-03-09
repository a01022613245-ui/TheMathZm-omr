import React, { useState } from 'react';

// ===== TYPES =====
type SchoolType = '중학교' | '고등학교';
type Grade = '1' | '2' | '3';
type View = 'login' | 'homeworkList' | 'solve' | 'results' | 'admin';
type AdminTab = 'students' | 'homework' | 'submissions';
type InputMethod = 'quick' | 'manual';

interface Question {
  number: number;
  type: 'multiple' | 'short';
  answer: string;
}

interface Homework {
  id: string;
  title: string;
  questions: Question[];
}

interface AnswerDetail {
  type: 'multiple' | 'short';
  userAnswer: string | null;
  correctAnswer: string;
  status: 'correct' | 'wrong' | 'unanswered';
}

interface Submission {
  id: number;
  schoolType: SchoolType;
  grade: Grade;
  studentName: string;
  homework: string;
  homeworkId: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  details: Record<number, AnswerDetail>;
  date: string;
  time: string;
}

// ===== INITIAL DATA =====
const hw1Questions: Question[] = [
  ...[4,2,3,1,5,4,2,3,1,5,4,2,3,1,5,4,2,3,1,5].map((a,i) => ({ number:i+1, type:'multiple' as const, answer:String(a) })),
  ...['11','3','짝수','참','거짓'].map((a,i) => ({ number:21+i, type:'short' as const, answer:a })),
];
const hw2Questions: Question[] = [
  ...[3,5,1,4,2,3,5,1,4,2,3,5,1,4,2,3,5,1,4,2].map((a,i) => ({ number:i+1, type:'multiple' as const, answer:String(a) })),
  ...['명제','역','대우','역명제','동치'].map((a,i) => ({ number:21+i, type:'short' as const, answer:a })),
];
const hw3Questions: Question[] = [
  ...[2,4,3,1,5,2,4,3,1,5,2,4,3,1,5,2,4,3,1,5].map((a,i) => ({ number:i+1, type:'multiple' as const, answer:String(a) })),
  ...['f(x)','정의역','공역','치역','x'].map((a,i) => ({ number:21+i, type:'short' as const, answer:a })),
];

const INIT_STUDENTS: Record<string, string[]> = {
  '고등학교-1': ['이채원','권회준','김시연'],
  '고등학교-2': [], '고등학교-3': [],
  '중학교-1': [], '중학교-2': [], '중학교-3': [],
};

const INIT_HOMEWORK: Record<string, Homework[]> = {
  '고등학교-1': [
    { id:'hw1', title:'7. 명제 (1)', questions:hw1Questions },
    { id:'hw2', title:'7. 명제 (2)', questions:hw2Questions },
    { id:'hw3', title:'8. 함수 (2)', questions:hw3Questions },
  ],
  '고등학교-2': [], '고등학교-3': [],
  '중학교-1': [], '중학교-2': [], '중학교-3': [],
};

// ===== PARSE FUNCTION =====
function parseAnswerSheet(text: string): Question[] {
  const circledToNum: Record<string, string> = { '①':'1','②':'2','③':'3','④':'4','⑤':'5' };
  const patterns = [
    /^(\d+)\)\s*\[정답\]\s*([①②③④⑤1-5]?)\s*(.*)?$/,
    /^(\d+)\.\s*([①②③④⑤1-5]?)\s*(.*)?$/,
    /^(\d+)번?\s*:?\s*([①②③④⑤1-5]?)\s*(.*)?$/,
    /^(\d+)\s+([①②③④⑤1-5]?)\s*(.*)?$/,
  ];
  const questions: Question[] = [];
  for (const line of text.split('\n').filter(l => l.trim())) {
    for (const pattern of patterns) {
      const m = line.trim().match(pattern);
      if (m) {
        const num = parseInt(m[1]);
        let raw = (m[2] || '').trim() || (m[3] || '').trim();
        let type: 'multiple' | 'short';
        let answer: string;
        if (raw && circledToNum[raw]) { type='multiple'; answer=circledToNum[raw]; }
        else if (raw && /^[1-5]$/.test(raw)) { type='multiple'; answer=raw; }
        else if (raw.length > 0) { type='short'; answer=raw; }
        else { type='short'; answer=''; }
        questions.push({ number:num, type, answer });
        break;
      }
    }
  }
  return questions.sort((a,b) => a.number - b.number);
}

// ===== RESULT GRID =====
function ResultGrid({ details }: { details: Record<number, AnswerDetail> }) {
  const entries = Object.entries(details).sort(([a],[b]) => Number(a)-Number(b));
  return (
    <div className="grid grid-cols-10 gap-1">
      {entries.map(([num, d]) => (
        <div key={num} className="flex flex-col items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            d.status==='correct' ? 'bg-green-100 text-green-600' :
            d.status==='wrong'   ? 'bg-red-100 text-red-500' :
            'bg-gray-100 text-gray-400'
          }`}>
            {d.status==='correct' ? '○' : d.status==='wrong' ? '✗' : '?'}
          </div>
          <div className="text-gray-400 mt-0.5" style={{fontSize:'9px'}}>{num}</div>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  // Auth state
  const [view, setView] = useState<View>('login');
  const [schoolType, setSchoolType] = useState<SchoolType|''>('');
  const [grade, setGrade] = useState<Grade|''>('');
  const [name, setName] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data state
  const [studentList, setStudentList] = useState(INIT_STUDENTS);
  const [homeworkList, setHomeworkList] = useState(INIT_HOMEWORK);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Solve state
  const [selHW, setSelHW] = useState<Homework|null>(null);
  const [answers, setAnswers] = useState<Record<number,string>>({});

  // Result state
  const [curResult, setCurResult] = useState<Submission|null>(null);

  // Admin state
  const [adminTab, setAdminTab] = useState<AdminTab>('students');
  const [nsSchool, setNsSchool] = useState<SchoolType|''>('');
  const [nsGrade, setNsGrade] = useState<Grade|''>('');
  const [nsName, setNsName] = useState('');
  const [nsError, setNsError] = useState('');
  const [hwMethod, setHwMethod] = useState<InputMethod>('quick');
  const [hwSchool, setHwSchool] = useState<SchoolType|''>('');
  const [hwGrade, setHwGrade] = useState<Grade|''>('');
  const [hwTitle, setHwTitle] = useState('');
  const [hwCount, setHwCount] = useState(25);
  const [manualQs, setManualQs] = useState<Question[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [parsedQs, setParsedQs] = useState<Question[]|null>(null);
  const [parseWarn, setParseWarn] = useState<string[]>([]);

  // ===== HELPERS =====
  const key = (s: string, g: string) => `${s}-${g}`;
  const isAdmin = () => schoolType==='고등학교' && grade==='3' && name==='권태현';
  const isRegistered = (s:string,g:string,n:string) => (studentList[key(s,g)]||[]).includes(n);
  const getSub = (hwId:string) => submissions.find(s => s.homeworkId===hwId && s.studentName===name && s.schoolType===schoolType && s.grade===grade);
  const answeredCount = () => Object.values(answers).filter(a=>a!=='').length;

  // ===== AUTH =====
  const handleLogin = () => {
    setLoginError('');
    if (!schoolType||!grade||!name.trim()) { setLoginError('모든 항목을 입력해주세요.'); return; }
    if (isAdmin()) { setView('admin'); return; }
    if (!isRegistered(schoolType,grade,name.trim())) { setLoginError('등록되지 않은 학생입니다. 선생님께 문의해주세요.'); return; }
    setView('homeworkList');
  };

  // ===== STUDENT =====
  const handleSelectHW = (hw: Homework) => {
    const sub = getSub(hw.id);
    if (sub) { setCurResult(sub); setView('results'); return; }
    setSelHW(hw); setAnswers({}); setView('solve');
  };

  const handleSubmit = () => {
    if (!selHW) return;
    const now = new Date();
    const details: Record<number, AnswerDetail> = {};
    let correct=0, wrong=0, unanswered=0;
    for (const q of selHW.questions) {
      const ua = answers[q.number]||null;
      let status: 'correct'|'wrong'|'unanswered';
      if (!ua||ua.trim()==='') { status='unanswered'; unanswered++; }
      else if (q.type==='multiple') { status=ua===q.answer?'correct':'wrong'; status==='correct'?correct++:wrong++; }
      else { status=ua.trim()===q.answer.trim()?'correct':'wrong'; status==='correct'?correct++:wrong++; }
      details[q.number] = { type:q.type, userAnswer:ua, correctAnswer:q.answer, status };
    }
    const sub: Submission = {
      id: now.getTime(), schoolType:schoolType as SchoolType, grade:grade as Grade,
      studentName:name.trim(), homework:selHW.title, homeworkId:selHW.id,
      correctCount:correct, wrongCount:wrong, unansweredCount:unanswered, details,
      date:`${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`,
      time:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`,
    };
    setSubmissions(p=>[...p,sub]);
    setCurResult(sub);
    setView('results');
  };

  // ===== ADMIN - STUDENTS =====
  const handleAddStudent = () => {
    setNsError('');
    if (!nsSchool||!nsGrade||!nsName.trim()) { setNsError('모든 항목을 입력해주세요.'); return; }
    const k = key(nsSchool,nsGrade);
    if ((studentList[k]||[]).includes(nsName.trim())) { setNsError('이미 등록된 학생입니다.'); return; }
    setStudentList(p=>({...p,[k]:[...(p[k]||[]),nsName.trim()]}));
    setNsName('');
  };
  const handleDelStudent = (k:string, n:string) => setStudentList(p=>({...p,[k]:p[k].filter(x=>x!==n)}));

  // ===== ADMIN - HOMEWORK =====
  const handleParse = () => {
    const qs = parseAnswerSheet(pasteText);
    const warns: string[] = [];
    const empty = qs.filter(q=>!q.answer);
    if (empty.length>0) warns.push(`답안 누락: ${empty.map(q=>q.number+'번').join(', ')} (총 ${empty.length}개)`);
    const nums = qs.map(q=>q.number);
    const dupes = nums.filter((n,i)=>nums.indexOf(n)!==i);
    if (dupes.length>0) warns.push(`중복 번호: ${[...new Set(dupes)].join(', ')}`);
    setParsedQs(qs); setParseWarn(warns);
  };

  const handleInitManual = () => {
    setManualQs(Array.from({length:hwCount},(_,i)=>({number:i+1,type:'multiple' as const,answer:''})));
  };

  const handleSaveHW = (qs: Question[]) => {
    if (!hwSchool||!hwGrade||!hwTitle.trim()||qs.length===0) return;
    const k = key(hwSchool,hwGrade);
    const newHw: Homework = { id:`hw_${Date.now()}`, title:hwTitle.trim(), questions:qs };
    setHomeworkList(p=>({...p,[k]:[...(p[k]||[]),newHw]}));
    setHwTitle(''); setPasteText(''); setParsedQs(null); setParseWarn([]); setManualQs([]);
  };

  const handleDelHW = (k:string, hwId:string) => setHomeworkList(p=>({...p,[k]:p[k].filter(h=>h.id!==hwId)}));

  // ===== RENDER: LOGIN =====
  if (view==='login') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-bold text-gray-800">온라인 숙제 제출</h1>
          <p className="text-gray-400 text-sm mt-1">TheMathZm</p>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
            <div className="grid grid-cols-2 gap-2">
              {(['중학교','고등학교'] as SchoolType[]).map(s=>(
                <button key={s} onClick={()=>setSchoolType(s)}
                  className={`py-2.5 rounded-xl border-2 font-medium transition-all ${schoolType===s?'border-blue-500 bg-blue-500 text-white':'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1','2','3'] as Grade[]).map(g=>(
                <button key={g} onClick={()=>setGrade(g)}
                  className={`py-2.5 rounded-xl border-2 font-medium transition-all ${grade===g?'border-blue-500 bg-blue-500 text-white':'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {g}학년
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="이름을 입력하세요"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"/>
          </div>
          {loginError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">⚠️ {loginError}</div>}
          <button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors">
            다음
          </button>
        </div>
      </div>
    </div>
  );

  // ===== RENDER: HOMEWORK LIST =====
  if (view==='homeworkList') {
    const hws = homeworkList[key(schoolType,grade)]||[];
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <h1 className="text-xl font-bold text-gray-800">📋 숙제 선택</h1>
            <p className="text-gray-500 text-sm mt-0.5">{name} ({schoolType} {grade}학년)</p>
          </div>
          <div className="space-y-3">
            {hws.length===0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400">등록된 숙제가 없습니다.</div>
            ) : hws.map(hw => {
              const sub = getSub(hw.id);
              const mc = hw.questions.filter(q=>q.type==='multiple').length;
              const sc = hw.questions.filter(q=>q.type==='short').length;
              return (
                <div key={hw.id} onClick={()=>handleSelectHW(hw)}
                  className={`bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-all border-2 ${sub?'border-green-200 bg-green-50':'border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-800">{hw.title}</h2>
                      <p className="text-sm text-gray-400 mt-0.5">총 {hw.questions.length}문제 (객관식 {mc}, 주관식 {sc})</p>
                    </div>
                    {sub && <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">✓ 제출완료</span>}
                  </div>
                  {sub && (
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="text-green-600">맞음 {sub.correctCount}</span>
                      <span className="text-red-500">틀림 {sub.wrongCount}</span>
                      <span className="text-gray-400">모름 {sub.unansweredCount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={()=>setView('login')} className="mt-4 w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 font-medium">
            ← 이전
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: SOLVE =====
  if (view==='solve' && selHW) {
    const total = selHW.questions.length;
    const answered = answeredCount();
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="font-bold text-gray-800">{selHW.title}</h1>
            <p className="text-xs text-gray-400">{name} ({schoolType} {grade}학년)</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{width:`${Math.round(answered/total*100)}%`}}/>
              </div>
              <span className="text-sm font-semibold text-gray-600">{answered}/{total}</span>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          {selHW.questions.map(q=>(
            <div key={q.number} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-700 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">{q.number}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{q.type==='multiple'?'객관식':'주관식'}</span>
              </div>
              {q.type==='multiple' ? (
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5].map(n=>(
                    <button key={n}
                      onClick={()=>setAnswers(p=>({...p,[q.number]:p[q.number]===String(n)?'':String(n)}))}
                      className={`py-3 rounded-xl border-2 font-semibold text-lg transition-all ${answers[q.number]===String(n)?'border-blue-500 bg-blue-500 text-white':'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                      {['①','②','③','④','⑤'][n-1]}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <textarea value={answers[q.number]||''} onChange={e=>setAnswers(p=>({...p,[q.number]:e.target.value}))}
                    placeholder="답안을 입력하세요..." rows={2}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-blue-500 resize-none text-sm"/>
                  <div className="text-right text-xs text-gray-400 mt-1">{(answers[q.number]||'').length}자</div>
                </div>
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 pb-8">
            <button onClick={()=>setView('homeworkList')} className="py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100">취소</button>
            <button onClick={handleSubmit} className="py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">제출하기</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: RESULTS =====
  if (view==='results' && curResult) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-800">숙제가 제출되었습니다!</h1>
          <p className="text-gray-400 text-sm mt-1">{curResult.studentName} ({curResult.schoolType} {curResult.grade}학년)</p>
          <p className="text-gray-700 font-semibold mt-1">{curResult.homework}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-600">{curResult.correctCount}</div>
            <div className="text-xs text-green-600 mt-1">맞은 문제</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <div className="text-2xl font-bold text-red-500">{curResult.wrongCount}</div>
            <div className="text-xs text-red-500 mt-1">틀린 문제</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
            <div className="text-2xl font-bold text-gray-400">{curResult.unansweredCount}</div>
            <div className="text-xs text-gray-400 mt-1">모름</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-3">문제별 결과</h2>
          <ResultGrid details={curResult.details}/>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>○ 맞음</span><span>✗ 틀림</span><span>? 모름</span>
          </div>
        </div>
        <div className="text-center text-sm text-gray-400">🕐 제출 시간: {curResult.date} {curResult.time}</div>
        <button onClick={()=>{setCurResult(null);setView('homeworkList');}}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold">
          숙제 목록으로
        </button>
      </div>
    </div>
  );

  // ===== RENDER: ADMIN =====
  if (view==='admin') {
    const allHwEntries = Object.entries(homeworkList);
    const allStudentEntries = Object.entries(studentList);

    // Submission groups
    const subGroups: Record<string, Submission[]> = {};
    submissions.forEach(s=>{
      const k = `${s.schoolType} ${s.grade}학년 - ${s.homework}`;
      if (!subGroups[k]) subGroups[k]=[];
      subGroups[k].push(s);
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
              <p className="text-sm text-gray-400">권태현 선생님</p>
            </div>
            <button onClick={()=>{setView('login');setName('');setGrade('');setSchoolType('');}} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">로그아웃</button>
          </div>
        </div>
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto flex">
            {([['students','👥 학생 관리'],['homework','📝 숙제 관리'],['submissions','📊 제출 현황']] as [AdminTab,string][]).map(([id,label])=>(
              <button key={id} onClick={()=>setAdminTab(id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${adminTab===id?'border-blue-500 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-4">

          {/* ── STUDENTS TAB ── */}
          {adminTab==='students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-4">학생 추가</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">학교</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['중학교','고등학교'] as SchoolType[]).map(s=>(
                        <button key={s} onClick={()=>setNsSchool(s)}
                          className={`py-2 rounded-lg border-2 text-sm font-medium ${nsSchool===s?'border-blue-500 bg-blue-50 text-blue-600':'border-gray-200 text-gray-600'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">학년</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1','2','3'] as Grade[]).map(g=>(
                        <button key={g} onClick={()=>setNsGrade(g)}
                          className={`py-2 rounded-lg border-2 text-sm font-medium ${nsGrade===g?'border-blue-500 bg-blue-50 text-blue-600':'border-gray-200 text-gray-600'}`}>{g}학년</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">이름</label>
                    <input type="text" value={nsName} onChange={e=>setNsName(e.target.value)} placeholder="학생 이름"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  {nsError && <p className="text-red-500 text-xs">{nsError}</p>}
                  <button onClick={handleAddStudent} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">+ 학생 추가</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-4">학생 목록</h2>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {allStudentEntries.filter(([,ns])=>ns.length>0).map(([k,ns])=>{
                    const [school,g]=k.split('-');
                    return (
                      <div key={k}>
                        <p className="text-xs font-medium text-gray-400 mb-2">{school} {g}학년 ({ns.length}명)</p>
                        <div className="space-y-1">
                          {ns.map(n=>(
                            <div key={n} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-sm text-gray-700">{n}</span>
                              <button onClick={()=>handleDelStudent(k,n)} className="text-red-400 hover:text-red-600 text-xs">삭제</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {allStudentEntries.every(([,ns])=>ns.length===0) && <p className="text-gray-400 text-sm text-center py-4">등록된 학생이 없습니다.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── HOMEWORK TAB ── */}
          {adminTab==='homework' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-4">숙제 추가</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">학교</label>
                    <select value={hwSchool} onChange={e=>setHwSchool(e.target.value as SchoolType)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option value="">선택</option>
                      <option>중학교</option><option>고등학교</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">학년</label>
                    <select value={hwGrade} onChange={e=>setHwGrade(e.target.value as Grade)}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option value="">선택</option>
                      <option value="1">1학년</option><option value="2">2학년</option><option value="3">3학년</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">숙제 제목</label>
                    <input type="text" value={hwTitle} onChange={e=>setHwTitle(e.target.value)} placeholder="예: 7. 명제 (1)"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {([['quick','⚡ 빠른 입력 (PDF 붙여넣기)'],['manual','✏️ 수동 입력']] as [InputMethod,string][]).map(([m,l])=>(
                    <button key={m} onClick={()=>setHwMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all ${hwMethod===m?'border-blue-500 bg-blue-50 text-blue-600':'border-gray-200 text-gray-500'}`}>{l}</button>
                  ))}
                </div>

                {/* QUICK INPUT */}
                {hwMethod==='quick' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">📋 PDF 답지에서 답안을 복사하여 붙여넣으세요.</p>
                    <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} rows={8}
                      placeholder={"1) [정답] ④\n2) [정답] ⑤\n3) [정답] ④\n4) [정답]\n...\n90) [정답] ②"}
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-purple-500 resize-none"/>
                    <button onClick={handleParse} className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold">
                      ⚡ 자동 파싱하기
                    </button>
                    {parsedQs && (
                      <div className="mt-4">
                        <div className={`rounded-xl p-3 mb-3 text-sm ${parseWarn.length>0?'bg-yellow-50 border border-yellow-200':'bg-green-50 border border-green-200'}`}>
                          <p className={`font-semibold ${parseWarn.length>0?'text-yellow-700':'text-green-700'}`}>✅ {parsedQs.length}개 문제 인식됨</p>
                          {parseWarn.map((w,i)=><p key={i} className="text-yellow-600 text-xs mt-1">⚠️ {w}</p>)}
                        </div>
                        <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>{['번호','유형','정답'].map(h=><th key={h} className="px-3 py-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y">
                              {parsedQs.map((q,i)=>(
                                <tr key={i} className={!q.answer?'bg-yellow-50':''}>
                                  <td className="px-3 py-2 text-gray-500 text-xs">{q.number}</td>
                                  <td className="px-3 py-2">
                                    <select value={q.type} onChange={e=>{const u=[...parsedQs];u[i]={...q,type:e.target.value as 'multiple'|'short',answer:''};setParsedQs(u);}}
                                      className="border rounded px-1 py-0.5 text-xs">
                                      <option value="multiple">객관식</option><option value="short">주관식</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    {q.type==='multiple' ? (
                                      <select value={q.answer} onChange={e=>{const u=[...parsedQs];u[i]={...q,answer:e.target.value};setParsedQs(u);}}
                                        className={`border rounded px-1 py-0.5 text-xs ${!q.answer?'border-yellow-400':''}`}>
                                        <option value="">선택</option>
                                        {[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}번</option>)}
                                      </select>
                                    ) : (
                                      <input type="text" value={q.answer} onChange={e=>{const u=[...parsedQs];u[i]={...q,answer:e.target.value};setParsedQs(u);}}
                                        placeholder="답안" className={`border rounded px-1 py-0.5 text-xs w-24 ${!q.answer?'border-yellow-400':''}`}/>
                                    )}
                                    {!q.answer && <span className="text-yellow-400 ml-1 text-xs">⚠️</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button onClick={()=>parsedQs&&handleSaveHW(parsedQs)} disabled={!hwSchool||!hwGrade||!hwTitle}
                          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold">
                          확인 및 저장
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* MANUAL INPUT */}
                {hwMethod==='manual' && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-sm text-gray-600">문항 수</label>
                      <input type="number" value={hwCount} min={1} max={50}
                        onChange={e=>setHwCount(Math.max(1,Math.min(50,Number(e.target.value))))}
                        className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:border-blue-500"/>
                      <button onClick={handleInitManual} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium">문항 생성</button>
                    </div>
                    {manualQs.length>0 && (
                      <div>
                        <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>{['번호','유형','정답'].map(h=><th key={h} className="px-3 py-2 text-left text-xs text-gray-500 font-medium">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y">
                              {manualQs.map((q,i)=>(
                                <tr key={i}>
                                  <td className="px-3 py-2 text-gray-500 text-xs">{q.number}</td>
                                  <td className="px-3 py-2">
                                    <select value={q.type} onChange={e=>{const u=[...manualQs];u[i]={...q,type:e.target.value as 'multiple'|'short',answer:''};setManualQs(u);}}
                                      className="border rounded px-1 py-0.5 text-xs">
                                      <option value="multiple">객관식</option><option value="short">주관식</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    {q.type==='multiple' ? (
                                      <select value={q.answer} onChange={e=>{const u=[...manualQs];u[i]={...q,answer:e.target.value};setManualQs(u);}}
                                        className="border rounded px-1 py-0.5 text-xs">
                                        <option value="">선택</option>
                                        {[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}번</option>)}
                                      </select>
                                    ) : (
                                      <input type="text" value={q.answer} onChange={e=>{const u=[...manualQs];u[i]={...q,answer:e.target.value};setManualQs(u);}}
                                        placeholder="답안" className="border rounded px-1 py-0.5 text-xs w-24"/>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <button onClick={()=>handleSaveHW(manualQs)} disabled={!hwSchool||!hwGrade||!hwTitle}
                          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold">
                          저장
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Homework list */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-700 mb-4">숙제 목록</h2>
                <div className="space-y-4">
                  {allHwEntries.filter(([,hs])=>hs.length>0).map(([k,hs])=>{
                    const [school,g]=k.split('-');
                    return (
                      <div key={k}>
                        <p className="text-xs font-medium text-gray-400 mb-2">{school} {g}학년</p>
                        <div className="space-y-2">
                          {hs.map(hw=>{
                            const mc=hw.questions.filter(q=>q.type==='multiple').length;
                            const sc=hw.questions.filter(q=>q.type==='short').length;
                            return (
                              <div key={hw.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{hw.title}</p>
                                  <p className="text-xs text-gray-400">{hw.questions.length}문제 (객관식 {mc}, 주관식 {sc})</p>
                                </div>
                                <button onClick={()=>handleDelHW(k,hw.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">삭제</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {allHwEntries.every(([,hs])=>hs.length===0) && <p className="text-gray-400 text-sm text-center py-4">등록된 숙제가 없습니다.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBMISSIONS TAB ── */}
          {adminTab==='submissions' && (
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 mb-4">제출 현황</h2>
              {submissions.length===0 ? (
                <p className="text-gray-400 text-sm text-center py-8">아직 제출된 숙제가 없습니다.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(subGroups).map(([groupKey,subs])=>(
                    <div key={groupKey}>
                      <h3 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                        {groupKey} <span className="text-sm text-gray-400 font-normal">({subs.length}명 제출)</span>
                      </h3>
                      <div className="space-y-3">
                        {subs.map(sub=>(
                          <div key={sub.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-700">{sub.studentName}</span>
                              <span className="text-xs text-gray-400">{sub.date} {sub.time}</span>
                            </div>
                            <div className="flex gap-4 text-sm mb-3">
                              <span className="text-green-600 font-medium">맞음: {sub.correctCount}</span>
                              <span className="text-red-500 font-medium">틀림: {sub.wrongCount}</span>
                              <span className="text-gray-400">모름: {sub.unansweredCount}</span>
                            </div>
                            <ResultGrid details={sub.details}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
