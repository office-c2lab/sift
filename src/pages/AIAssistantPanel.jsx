import { useState } from 'react';
import { ArrowRight, Send, Sparkles, X } from 'lucide-react';

const suggestedQuestions = [
  '성별 분포를 보여줘',
  '연령대별 평균값을 알려줘',
  '주/지역별 인원 수를 그래프로 보여줘',
  '주거형태별 결혼유무 비율은?',
];

function groupSummary(data, columnIndex) {
  const counts = new Map();
  data.rows.forEach(row => {
    const value = row[columnIndex]?.trim() || '미입력';
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => `${label} ${count.toLocaleString()}건`)
    .join(' · ');
}

function answerQuestion(question, data) {
  const normalized = question.toLowerCase();
  const findColumn = pattern => data.headers.findIndex(header => pattern.test(header));

  if (/성별/.test(normalized)) {
    const index = findColumn(/성별|gender|sex/i);
    if (index >= 0) return `${data.headers[index]} 분포를 집계했어요. ${groupSummary(data, index)}`;
  }
  if (/연령|나이|평균/.test(normalized)) {
    const index = findColumn(/연령|나이|age/i);
    if (index >= 0) {
      const values = data.rows
        .map(row => Number(String(row[index] ?? '').replaceAll(',', '')))
        .filter(Number.isFinite);
      if (values.length)
        return `${data.headers[index]} 평균은 ${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)}입니다. ${values.length.toLocaleString()}개 값을 기준으로 계산했어요.`;
    }
  }
  if (/지역|주소|주별/.test(normalized)) {
    const index = findColumn(/지역|주소|시도|구군|province|region|address/i);
    if (index >= 0) return `${data.headers[index]} 기준 건수입니다. ${groupSummary(data, index)}`;
  }
  if (/주거|결혼|혼인/.test(normalized)) {
    const housing = findColumn(/주거|주택|주거형태|housing/i);
    const marital = findColumn(/결혼|혼인|marital/i);
    if (housing >= 0 && marital >= 0) {
      const sample = data.rows
        .slice(0, 5)
        .map(row => `${row[housing] || '미입력'}: ${row[marital] || '미입력'}`)
        .join(' · ');
      return `주거형태와 결혼유무 컬럼을 찾았어요. 예시 ${sample}`;
    }
  }
  return `업로드한 데이터는 ${data.totalRows.toLocaleString()}개 행, ${data.headers.length}개 컬럼입니다. 컬럼에 맞는 질문을 선택하면 빠르게 요약해 드릴게요.`;
}

export default function AIAssistantPanel({ data, onClose }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);

  const ask = prompt => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    setMessages(current => [
      ...current,
      { question: cleanPrompt, answer: answerQuestion(cleanPrompt, data) },
    ]);
    setQuestion('');
  };

  return (
    <aside className="ai-assistant-panel" aria-label="AI 데이터 어시스턴트">
      <header className="ai-panel-header">
        <span className="ai-spark">
          <Sparkles aria-hidden="true" />
        </span>
        <strong>AI 데이터 어시스턴트</strong>
        <button aria-label="AI 어시스턴트 닫기" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="ai-panel-content">
        <div className="ai-intro">
          <strong>업로드한 데이터를 분석했어요.</strong>
          <p>
            데이터에 대해 궁금한 점을 질문해 보세요.
            <br />
            통계 분석, 시각화, 데이터 정제 등을 도와드릴게요.
          </p>
        </div>
        {messages.length === 0 && (
          <div className="ai-suggestions">
            {suggestedQuestions.map(prompt => (
              <button key={prompt} onClick={() => ask(prompt)}>
                {prompt}
                <span>
                  <ArrowRight aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        )}
        {messages.map((message, index) => (
          <div className="ai-message-pair" key={`${message.question}-${index}`}>
            <p className="ai-user-message">{message.question}</p>
            <p className="ai-answer-message">{message.answer}</p>
          </div>
        ))}
      </div>
      <form
        className="ai-prompt-form"
        onSubmit={event => {
          event.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder="데이터에 대해 질문하세요..."
          aria-label="데이터에 대해 질문하세요"
        />
        <button type="submit" aria-label="질문 보내기" disabled={!question.trim()}>
          <Send aria-hidden="true" />
        </button>
      </form>
    </aside>
  );
}
