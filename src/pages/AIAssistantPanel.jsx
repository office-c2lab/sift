import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageSquarePlus, Send, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAiChat from '../hooks/useAiChat.js';
import useAiSuggestions from '../hooks/useAiSuggestions.js';
import useResetAiConversation from '../hooks/useResetAiConversation.js';
import ConfirmActionModal from './ConfirmActionModal.jsx';

function getApiErrorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

function WaitingMessage({ label = '답변을 준비하고 있어요' }) {
  return (
    <div className="ai-answer-message ai-answer-loading" role="status">
      <span>{label}</span>
      <span className="ai-loading-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

export default function AIAssistantPanel({ datasetId, onClose, closing = false }) {
  const [question, setQuestion] = useState('');
  const [newChatConfirmationOpen, setNewChatConfirmationOpen] = useState(false);
  const contentRef = useRef(null);
  const suggestionsQuery = useAiSuggestions(datasetId);
  const chatMutation = useAiChat(datasetId);
  const resetMutation = useResetAiConversation(datasetId);
  const suggestions = suggestionsQuery.data?.questions ?? [];
  const messages = suggestionsQuery.data?.messages ?? [];
  const conversationId = suggestionsQuery.data?.conversation_id;
  const isResponding = chatMutation.isPending;

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.scrollTo({
        top: messages.length || isResponding ? content.scrollHeight : 0,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isResponding]);

  const startNewChat = () => {
    setNewChatConfirmationOpen(false);
    if (!conversationId || resetMutation.isPending) return;

    resetMutation.mutate(
      { conversation_id: conversationId },
      {
        onSuccess: () => setQuestion(''),
        onError: error => {
          toast.error(getApiErrorMessage(error, '새 대화를 시작하지 못했어요.'));
        },
      },
    );
  };

  const ask = prompt => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || !conversationId || isResponding) return;

    setQuestion('');
    chatMutation.mutate(
      { conversation_id: conversationId, message: cleanPrompt },
      {
        onError: error => {
          setQuestion(cleanPrompt);
          toast.error(getApiErrorMessage(error, 'AI 답변을 받아오지 못했어요.'));
        },
      },
    );
  };

  return (
    <>
      <aside
        className={`ai-assistant-panel${closing ? ' is-closing' : ''}`}
        aria-label="AI 데이터 어시스턴트"
      >
        <header className="ai-panel-header">
          <span className="ai-spark">
            <Sparkles aria-hidden="true" />
          </span>
          <strong>AI 데이터 어시스턴트</strong>
          <div className="ai-panel-header-actions">
            <button
              type="button"
              className="ai-new-chat-button"
              onClick={() => setNewChatConfirmationOpen(true)}
              disabled={!conversationId || resetMutation.isPending || isResponding}
            >
              <MessageSquarePlus aria-hidden="true" />
              <span>{resetMutation.isPending ? '초기화 중' : '새 대화'}</span>
            </button>
            <button type="button" aria-label="AI 어시스턴트 닫기" onClick={onClose}>
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ai-panel-content" ref={contentRef}>
          <div className="ai-intro">
            <strong>업로드한 데이터를 분석했어요.</strong>
            <p>
              데이터에 대해 궁금한 점을 질문해 보세요.
              <br />
              통계 분석, 시각화, 데이터 정제 등을 도와드릴게요.
            </p>
          </div>

          {suggestionsQuery.isLoading && <WaitingMessage label="대화를 불러오고 있어요" />}

          {suggestionsQuery.isError && (
            <div className="ai-load-error" role="alert">
              <span>대화를 불러오지 못했어요.</span>
              <button type="button" onClick={() => suggestionsQuery.refetch()}>
                다시 시도
              </button>
            </div>
          )}

          {!suggestionsQuery.isLoading && !suggestionsQuery.isError && messages.length === 0 && (
            <div className="ai-suggestions">
              {suggestions.map(prompt => (
                <button key={prompt} onClick={() => ask(prompt)} disabled={isResponding}>
                  {prompt}
                  <span>
                    <ArrowRight aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {messages.map(message => (
            <div className="ai-message-pair" key={message.id}>
              <p className={message.role === 'user' ? 'ai-user-message' : 'ai-answer-message'}>
                {message.content}
              </p>
            </div>
          ))}

          {isResponding && (
            <div className="ai-message-pair">
              <p className="ai-user-message">{chatMutation.variables?.message}</p>
              <WaitingMessage />
            </div>
          )}
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
            placeholder={isResponding ? '답변을 준비하고 있어요...' : '데이터에 대해 질문하세요...'}
            aria-label="데이터에 대해 질문하세요"
            disabled={!conversationId || isResponding || resetMutation.isPending}
            maxLength={4000}
          />
          <button
            type="submit"
            aria-label="질문 보내기"
            disabled={!conversationId || isResponding || resetMutation.isPending || !question.trim()}
          >
            <Send aria-hidden="true" />
          </button>
        </form>
      </aside>

      {newChatConfirmationOpen && (
        <ConfirmActionModal
          title="새로운 대화를 시작할까요?"
          description="현재 대화 내용이 모두 삭제되고 처음 화면으로 돌아갑니다."
          confirmLabel="새 대화 시작"
          onCancel={() => setNewChatConfirmationOpen(false)}
          onConfirm={startNewChat}
        />
      )}
    </>
  );
}
