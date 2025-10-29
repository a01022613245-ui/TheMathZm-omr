import React, { useState } from 'react';
import { CheckCircle, FileText, User, Calendar, BarChart3, Send, Edit3, Plus, Trash2, Settings, Check, Users } from 'lucide-react';

export default function HomeworkSubmissionApp() {
  const [currentView, setCurrentView] = useState('home');
  const [schoolType, setSchoolType] = useState('');
  const [grade, setGrade] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedHomework, setSelectedHomework] = useState('');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  // 학생 목록 (학교-학년별 관리)
  const [studentList, setStudentList] = useState({
    '고등학교-1': ['이채원', '권회준', '김시연'],
    '고등학교-2': [],
    '고등학교-3': [],
    '중학교-1': [],
    '중학교-2': [],
    '중학교-3': []
  });

  // 숙제 목록 (학교-학년별 관리)
  const [homeworkList, setHomeworkList] = useState({
    '고등학교-1': [
      {
        id: 'hw1',
        title: '7. 명제 (1)',
        questions: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, type: 'multiple', answer: (i % 5) + 1 }))
          .concat(Array.from({ length: 5 }, (_, i) => ({ number: i + 21, type: 'short', answer: String(i + 11) })))
      },
      {
        id: 'hw2',
        title: '7. 명제 (2)',
        questions: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, type: 'multiple', answer: (i % 5) + 1 }))
          .concat(Array.from({ length: 5 }, (_, i) => ({ number: i + 21, type: 'short', answer: String(i + 11) })))
      },
      {
        id: 'hw3',
        title: '8. 함수 (2)',
        questions: Array.from({ length: 20 }, (_, i) => ({ number: i + 1, type: 'multiple', answer: (i % 5) + 1 }))
          .concat(Array.from({ length: 5 }, (_, i) => ({ number: i + 21, type: 'short', answer: String(i + 11) })))
      }
    ],
    '고등학교-2': [],
    '고등학교-3': [],
    '중학교-1': [],
    '중학교-2': [],
    '중학교-3': []
  });

  // 학생 추가 폼
  const [newStudent, setNewStudent] = useState({
    schoolType: '고등학교',
    grade: '1',
    name: ''
  });

  // 숙제 추가 폼
  const [newHomework, setNewHomework] = useState({
    schoolType: '고등학교',
    grade: '1',
    title: '',
    questionCount: 25,
    questions: Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      type: 'multiple',
      answer: ''
    }))
  });

  const isRegisteredStudent = () => {
    const key = `${schoolType}-${grade}`;
    return studentList[key]?.includes(studentName);
  };

  const isAdmin = () => {
    return schoolType === '고등학교' && grade === '3' && studentName === '권태현';
  };

  const getCurrentHomeworkList = () => {
    const key = `${schoolType}-${grade}`;
    return homeworkList[key] || [];
  };

  const isHomeworkCompleted = (homeworkId) => {
    const currentList = getCurrentHomeworkList();
    return submissions.find(s => s.studentName === studentName && s.homework === currentList.find(hw => hw.id === homeworkId)?.title);
  };

  const viewCompletedHomework = (homeworkId) => {
    const submission = isHomeworkCompleted(homeworkId);
    if (submission) {
      setResults({
        homework: submission.homework,
        correctCount: submission.correctCount,
        wrongCount: submission.wrongCount,
        unansweredCount: submission.unansweredCount,
        totalQuestions: Object.keys(submission.details).length,
        details: submission.details,
        submittedAt: `${submission.date} ${submission.time}`
      });
      setCurrentView('results');
    }
  };

  const handleMultipleChoice = (questionNum, choice) => {
    setAnswers({ ...answers, [questionNum]: choice });
  };

  const handleShortAnswer = (questionNum, text) => {
    setAnswers({ ...answers, [questionNum]: text });
  };

  const handleSubmit = () => {
    if (!schoolType || !grade || !studentName || !selectedHomework) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    const currentList = getCurrentHomeworkList();
    const homework = currentList.find(hw => hw.id === selectedHomework);
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const detailedResults = {};
    
    homework.questions.forEach(q => {
      const userAnswer = answers[q.number];
      
      if (q.type === 'multiple') {
        if (!userAnswer) {
          unansweredCount++;
          detailedResults[q.number] = { type: 'multiple', userAnswer: null, correctAnswer: q.answer, status: 'unanswered' };
        } else {
          const isCorrect = userAnswer === q.answer;
          if (isCorrect) correctCount++;
          else wrongCount++;
          detailedResults[q.number] = { type: 'multiple', userAnswer, correctAnswer: q.answer, status: isCorrect ? 'correct' : 'wrong' };
        }
      } else {
        if (!userAnswer || userAnswer.trim().length === 0) {
          unansweredCount++;
          detailedResults[q.number] = { type: 'short', userAnswer: '', correctAnswer: q.answer, status: 'unanswered' };
        } else {
          const isCorrect = userAnswer.trim() === q.answer;
          if (isCorrect) correctCount++;
          else wrongCount++;
          detailedResults[q.number] = { type: 'short', userAnswer, correctAnswer: q.answer, status: isCorrect ? 'correct' : 'wrong' };
        }
      }
    });

    const result = {
      homework: homework.title,
      correctCount,
      wrongCount,
      unansweredCount,
      totalQuestions: homework.questions.length,
      details: detailedResults,
      submittedAt: new Date().toLocaleString('ko-KR')
    };

    setResults(result);
    setSubmissions([{
      id: Date.now(),
      schoolType,
      grade,
      studentName,
      homework: homework.title,
      homeworkId: selectedHomework,
      correctCount,
      wrongCount,
      unansweredCount,
      details: detailedResults,
      date: new Date().toLocaleDateString('ko-KR'),
      time: new Date().toLocaleTimeString('ko-KR')
    }, ...submissions]);
    setCurrentView('results');
  };

  const resetForm = () => {
    setAnswers({});
    setResults(null);
    setSchoolType('');
    setGrade('');
    setStudentName('');
    setSelectedHomework('');
    setCurrentView('home');
  };

  const addStudent = () => {
    if (!newStudent.name.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const key = `${newStudent.schoolType}-${newStudent.grade}`;
    if (studentList[key].includes(newStudent.name)) {
      alert('이미 등록된 학생입니다.');
      return;
    }

    setStudentList({
      ...studentList,
      [key]: [...studentList[key], newStudent.name]
    });
    setNewStudent({ ...newStudent, name: '' });
    alert('학생이 추가되었습니다!');
  };

  const deleteStudent = (schoolType, grade, name) => {
    const key = `${schoolType}-${grade}`;
    if (confirm(`${name} 학생을 삭제하시겠습니까?`)) {
      setStudentList({
        ...studentList,
        [key]: studentList[key].filter(s => s !== name)
      });
    }
  };

  const updateQuestionCount = (count) => {
    const newQuestions = Array.from({ length: count }, (_, i) => {
      const existing = newHomework.questions[i];
      return existing || { number: i + 1, type: 'multiple', answer: '' };
    });
    setNewHomework({ ...newHomework, questionCount: count, questions: newQuestions });
  };

  const updateQuestionType = (index, type) => {
    const updated = [...newHomework.questions];
    updated[index] = { ...updated[index], type, answer: '' };
    setNewHomework({ ...newHomework, questions: updated });
  };

  const updateQuestionAnswer = (index, answer) => {
    const updated = [...newHomework.questions];
    updated[index] = { ...updated[index], answer };
    setNewHomework({ ...newHomework, questions: updated });
  };

  const addHomework = () => {
    if (!newHomework.title) {
      alert('숙제 제목을 입력해주세요.');
      return;
    }

    const emptyAnswers = newHomework.questions.filter(q => !q.answer || q.answer === '');
    if (emptyAnswers.length > 0) {
      alert(`${emptyAnswers.length}개 문제의 답이 입력되지 않았습니다.`);
      return;
    }

    const key = `${newHomework.schoolType}-${newHomework.grade}`;
    const newHw = {
      id: 'hw' + Date.now(),
      title: newHomework.title,
      questions: newHomework.questions.map((q, i) => ({
        number: i + 1,
        type: q.type,
        answer: q.type === 'multiple' ? parseInt(q.answer) : q.answer
      }))
    };

    setHomeworkList({
      ...homeworkList,
      [key]: [...(homeworkList[key] || []), newHw]
    });
    
    setNewHomework({
      schoolType: '고등학교',
      grade: '1',
      title: '',
      questionCount: 25,
      questions: Array.from({ length: 25 }, (_, i) => ({ number: i + 1, type: 'multiple', answer: '' }))
    });
    alert('숙제가 추가되었습니다!');
  };

  const deleteHomework = (schoolType, grade, id) => {
    const key = `${schoolType}-${grade}`;
    if (confirm('이 숙제를 삭제하시겠습니까?')) {
      setHomeworkList({
        ...homeworkList,
        [key]: homeworkList[key].filter(hw => hw.id !== id)
      });
    }
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">온라인 숙제 제출</h1>
              <p className="text-gray-600">학생 정보를 입력하고 숙제를 시작하세요</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSchoolType('중학교')} className={`py-3 rounded-lg font-semibold transition-colors ${schoolType === '중학교' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>중학교</button>
                  <button onClick={() => setSchoolType('고등학교')} className={`py-3 rounded-lg font-semibold transition-colors ${schoolType === '고등학교' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>고등학교</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3'].map((g) => (
                    <button key={g} onClick={() => setGrade(g)} className={`py-3 rounded-lg font-semibold transition-colors ${grade === g ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{g}학년</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"><User className="inline w-4 h-4 mr-1" />이름</label>
                <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="이름을 입력하세요" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>

              <button onClick={() => {
                if (!schoolType || !grade || !studentName) {
                  alert('모든 정보를 입력해주세요.');
                  return;
                }
                if (isAdmin()) setCurrentView('admin');
                else if (isRegisteredStudent()) setCurrentView('selectHomework');
                else alert('등록되지 않은 학생입니다.');
              }} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                <Edit3 className="inline w-5 h-5 mr-2" />다음
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'selectHomework') {
    const currentList = getCurrentHomeworkList();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">숙제 선택</h2>
              <p className="text-gray-600">{studentName} ({schoolType} {grade}학년)</p>
            </div>

            {currentList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>아직 등록된 숙제가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {currentList.map((hw) => {
                  const completed = isHomeworkCompleted(hw.id);
                  return (
                    <button key={hw.id} onClick={() => {
                      if (completed) viewCompletedHomework(hw.id);
                      else {
                        setSelectedHomework(hw.id);
                        setCurrentView('solve');
                      }
                    }} className={`w-full p-4 rounded-lg border-2 text-left transition-all ${completed ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{hw.title}</h3>
                          <p className="text-sm text-gray-600">총 {hw.questions.length}문제 (객관식 {hw.questions.filter(q => q.type === 'multiple').length}, 주관식 {hw.questions.filter(q => q.type === 'short').length})</p>
                        </div>
                        {completed && (
                          <div className="flex items-center gap-2 text-green-600">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-semibold">제출완료</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={() => setCurrentView('home')} className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">이전</button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'solve') {
    const currentList = getCurrentHomeworkList();
    const homework = currentList.find(hw => hw.id === selectedHomework);
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / homework.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{homework.title}</h2>
                  <p className="text-gray-600">{studentName} ({schoolType} {grade}학년)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">진행률</p>
                  <p className="text-2xl font-bold text-indigo-600">{answeredCount}/{homework.questions.length}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {homework.questions.map((q) => (
                <div key={q.number} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-800 mb-3">{q.number}번 문제 ({q.type === 'multiple' ? '객관식' : '주관식'})</p>
                  {q.type === 'multiple' ? (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((choice) => (
                        <button key={choice} onClick={() => handleMultipleChoice(q.number, choice)} className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${answers[q.number] === choice ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{choice}번</button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <textarea value={answers[q.number] || ''} onChange={(e) => handleShortAnswer(q.number, e.target.value)} placeholder="답안을 작성하세요" rows="3" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                      <p className="text-xs text-gray-500 mt-1">{answers[q.number]?.length || 0}자</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCurrentView('selectHomework')} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">취소</button>
              <button onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"><Send className="inline w-5 h-5 mr-2" />제출하기</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">숙제가 제출되었습니다!</h2>
              <p className="text-gray-600">{studentName} ({schoolType} {grade}학년)</p>
              <p className="text-gray-600">{results.homework}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">맞은 문제</p>
                <p className="text-3xl font-bold text-green-600">{results.correctCount}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">틀린 문제</p>
                <p className="text-3xl font-bold text-red-600">{results.wrongCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">모르는 문제</p>
                <p className="text-3xl font-bold text-gray-600">{results.unansweredCount}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">문제별 결과</h3>
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: results.totalQuestions }, (_, i) => i + 1).map((qNum) => {
                  const result = results.details[qNum];
                  return (
                    <div key={qNum} className="flex flex-col items-center">
                      <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xl ${result.status === 'correct' ? 'bg-green-100' : result.status === 'wrong' ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {result.status === 'correct' ? '⭕' : result.status === 'wrong' ? '✖' : '⭐'}
                      </div>
                      <span className="text-xs text-gray-600 mt-1">{qNum}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><span className="text-xl">⭕</span><span>맞음</span></div>
                <div className="flex items-center gap-2"><span className="text-xl">✖</span><span>틀림</span></div>
                <div className="flex items-center gap-2"><span className="text-xl">⭐</span><span>모름</span></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center text-sm text-gray-600"><Calendar className="w-4 h-4 mr-2" />제출 시간: {results.submittedAt}</div>
            </div>

            <button onClick={() => {
              setAnswers({});
              setResults(null);
              setSelectedHomework('');
              setCurrentView('selectHomework');
            }} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">숙제 목록으로</button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">관리자 페이지</h2>
                <p className="text-gray-600">권태현 선생님</p>
              </div>
              <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">로그아웃</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 학생 추가 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2" />학생 추가</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setNewStudent({...newStudent, schoolType: '중학교'})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newStudent.schoolType === '중학교' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>중학교</button>
                      <button onClick={() => setNewStudent({...newStudent, schoolType: '고등학교'})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newStudent.schoolType === '고등학교' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>고등학교</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3'].map(g => (
                        <button key={g} onClick={() => setNewStudent({...newStudent, grade: g})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newStudent.grade === g ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{g}학년</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">학생 이름</label>
                    <input type="text" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} placeholder="이름 입력" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <button onClick={addStudent} className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"><Plus className="inline w-5 h-5 mr-2" />학생 추가</button>
                </div>
              </div>

              {/* 학생 목록 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Users className="w-5 h-5 mr-2" />학생 목록</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.keys(studentList).map(key => {
                    const [school, gr] = key.split('-');
                    const students = studentList[key];
                    if (students.length === 0) return null;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-2">{school} {gr}학년 ({students.length}명)</h4>
                        <div className="space-y-2">
                          {students.map(name => (
                            <div key={name} className="flex justify-between items-center bg-white rounded px-3 py-2">
                              <span className="text-sm text-gray-700">{name}</span>
                              <button onClick={() => deleteStudent(school, gr, name)} className="text-red-600 hover:text-red-800 text-sm"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 숙제 추가 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Plus className="w-5 h-5 mr-2" />숙제 추가</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">학교</label>
                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => setNewHomework({...newHomework, schoolType: '중학교'})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newHomework.schoolType === '중학교' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>중학교</button>
                        <button onClick={() => setNewHomework({...newHomework, schoolType: '고등학교'})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newHomework.schoolType === '고등학교' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>고등학교</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">학년</label>
                      <div className="grid grid-cols-1 gap-2">
                        {['1', '2', '3'].map(g => (
                          <button key={g} onClick={() => setNewHomework({...newHomework, grade: g})} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${newHomework.grade === g ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{g}학년</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">숙제 제목</label>
                    <input type="text" value={newHomework.title} onChange={(e) => setNewHomework({...newHomework, title: e.target.value})} placeholder="예: 9. 집합 (1)" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">문항 수</label>
                    <input type="number" value={newHomework.questionCount} onChange={(e) => updateQuestionCount(parseInt(e.target.value))} min="1" max="50" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">문항별 설정</h4>
                    <div className="space-y-3">
                      {newHomework.questions.map((q, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <span className="text-sm text-gray-600 pt-2 w-8">{q.number}번</span>
                          <select value={q.type} onChange={(e) => updateQuestionType(index, e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="multiple">객관식</option>
                            <option value="short">주관식</option>
                          </select>
                          {q.type === 'multiple' ? (
                            <select value={q.answer} onChange={(e) => updateQuestionAnswer(index, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                              <option value="">답 선택</option>
                              <option value="1">1번</option>
                              <option value="2">2번</option>
                              <option value="3">3번</option>
                              <option value="4">4번</option>
                              <option value="5">5번</option>
                            </select>
                          ) : (
                            <input type="text" value={q.answer} onChange={(e) => updateQuestionAnswer(index, e.target.value)} placeholder="정답 입력" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={addHomework} className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"><Plus className="inline w-5 h-5 mr-2" />숙제 추가</button>
                </div>
              </div>

              {/* 숙제 목록 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Settings className="w-5 h-5 mr-2" />숙제 목록</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.keys(homeworkList).map(key => {
                    const [school, gr] = key.split('-');
                    const hws = homeworkList[key];
                    if (hws.length === 0) return null;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <h4 className="font-semibold text-gray-800 mb-2">{school} {gr}학년 ({hws.length}개)</h4>
                        <div className="space-y-2">
                          {hws.map(hw => (
                            <div key={hw.id} className="bg-white rounded p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-semibold text-gray-800 text-sm">{hw.title}</h5>
                                  <p className="text-xs text-gray-600">총 {hw.questions.length}문제 (객관식 {hw.questions.filter(q => q.type === 'multiple').length}, 주관식 {hw.questions.filter(q => q.type === 'short').length})</p>
                                </div>
                                <button onClick={() => deleteHomework(school, gr, hw.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 제출 현황 */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2" />학생 제출 현황</h3>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">아직 제출된 숙제가 없습니다.</div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(homeworkList).map(key => {
                    const [school, gr] = key.split('-');
                    const hws = homeworkList[key];
                    
                    return hws.map(hw => {
                      const hwSubmissions = submissions.filter(s => s.homework === hw.title && s.schoolType === school && s.grade === gr);
                      if (hwSubmissions.length === 0) return null;
                      
                      return (
                        <div key={hw.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600" />{school} {gr}학년 - {hw.title} ({hwSubmissions.length}명 제출)</h4>
                          <div className="space-y-3">
                            {hwSubmissions.map((submission) => (
                              <div key={submission.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h5 className="font-semibold text-gray-800">{submission.studentName}</h5>
                                    <p className="text-xs text-gray-500 mt-1">{submission.date} {submission.time}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                  <div className="bg-green-50 rounded px-3 py-2 text-center">
                                    <p className="text-xs text-gray-600">맞음</p>
                                    <p className="text-lg font-bold text-green-600">{submission.correctCount}</p>
                                  </div>
                                  <div className="bg-red-50 rounded px-3 py-2 text-center">
                                    <p className="text-xs text-gray-600">틀림</p>
                                    <p className="text-lg font-bold text-red-600">{submission.wrongCount}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded px-3 py-2 text-center">
                                    <p className="text-xs text-gray-600">모름</p>
                                    <p className="text-lg font-bold text-gray-600">{submission.unansweredCount}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-10 gap-1">
                                  {Object.keys(submission.details).sort((a, b) => parseInt(a) - parseInt(b)).map((qNum) => {
                                    const result = submission.details[qNum];
                                    return (
                                      <div key={qNum} className="flex flex-col items-center">
                                        <div className={`w-full aspect-square rounded flex items-center justify-center text-sm ${result.status === 'correct' ? 'bg-green-100' : result.status === 'wrong' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                          {result.status === 'correct' ? '⭕' : result.status === 'wrong' ? '✖' : '⭐'}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-0.5">{qNum}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
