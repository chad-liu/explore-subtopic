'use client';

import { useEvaluate } from './hooks/useEvaluate';
import PageHeader from './PageHeader';
import InputPanel from './InputPanel';
import SuggestionPanel from './SuggestionPanel';

export default function MainPage() {
  const {
    topic, setTopic,
    subtopics, setSubtopics,
    suggestion, isStreaming, hasResult, error,
    evaluate, reset, saveTxt, saveHtml, downloadLog,
  } = useEvaluate();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <PageHeader onReset={reset} onDownloadLog={downloadLog} hasResult={hasResult} />
      <main
        style={{
          maxWidth: '700px',
          margin: '0 auto',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <InputPanel
          topic={topic}
          subtopics={subtopics}
          onTopicChange={setTopic}
          onSubtopicsChange={setSubtopics}
          onSubmit={evaluate}
          disabled={isStreaming}
          error={error}
        />
        {(hasResult || isStreaming) && (
          <SuggestionPanel
            suggestion={suggestion}
            isStreaming={isStreaming}
            hasResult={hasResult}
            onSaveTxt={saveTxt}
            onSaveHtml={saveHtml}
          />
        )}
      </main>
    </div>
  );
}
