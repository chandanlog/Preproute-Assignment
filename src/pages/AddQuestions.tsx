import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Test, Question, Topic, SubTopic } from '../services/api';
import { 
  Trash2, Loader, AlertCircle, ChevronLeft, ChevronRight,
  Bold, Italic, Underline, Link2, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Table, Image, Sigma, Edit2
} from 'lucide-react';
import { PrepRouteLogo } from '../components/PrepRouteLogo';
import './AddQuestions.css';



export const AddQuestions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Core Data States
  const [test, setTest] = useState<Test | null>(null);
  const [topicsList, setTopicsList] = useState<Topic[]>([]);
  const [subTopicsList, setSubTopicsList] = useState<SubTopic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Active state tracker
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Helper to resolve Topic Name from UUID/string
  const getTopicName = (topicVal: string) => {
    const matched = topicsList.find(t => t.id === topicVal);
    return matched ? matched.name : topicVal;
  };

  // Helper to resolve SubTopic Name from UUID/string
  const getSubTopicName = (subVal: string) => {
    const matched = subTopicsList.find(st => st.id === subVal);
    return matched ? matched.name : subVal;
  };


  // UI status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  // Total questions count (default 50)
  const totalQuestionsLimit = test?.total_questions || 50;

  useEffect(() => {
    if (id) {
      loadTestData(id);
    }
  }, [id]);

  // Load test details, topics list, and existing questions
  const loadTestData = async (testId: string) => {
    setLoading(true);
    setApiError('');
    try {
      const response = await apiService.getTestById(testId);
      if (response.success && response.data) {
        const testData = response.data;
        setTest(testData);

        let subjectUuid = testData.subject;
        const mappedTopics: string[] = [];
        const mappedSubTopics: string[] = [];

        if (subjectUuid) {
          // Verify if subjectUuid is a valid UUID
          const isSubjectUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectUuid);
          if (!isSubjectUuid) {
            const subjectsRes = await apiService.getSubjects();
            if (subjectsRes.success) {
              const matched = subjectsRes.data.find(
                s => s.id === subjectUuid || s.name.toLowerCase() === subjectUuid.toLowerCase()
              );
              if (matched) {
                subjectUuid = matched.id;
              }
            }
          }

          const topicsRes = await apiService.getTopicsBySubject(subjectUuid);
          if (topicsRes.success) {
            setTopicsList(topicsRes.data);

            // Map test topics (names or IDs) to topic UUIDs
            testData.topics?.forEach(t => {
              const matchById = topicsRes.data.find(topic => topic.id === t);
              const matchByName = topicsRes.data.find(topic => topic.name.toLowerCase() === t.toLowerCase());
              if (matchById) {
                mappedTopics.push(matchById.id);
              } else if (matchByName) {
                mappedTopics.push(matchByName.id);
              }
            });

            const topicIds = topicsRes.data.map(t => t.id);
            if (topicIds.length > 0) {
              const subTopicsRes = await apiService.getSubTopicsMultiTopics(topicIds);
              if (subTopicsRes.success) {
                setSubTopicsList(subTopicsRes.data);

                // Map test sub_topics to UUIDs
                testData.sub_topics?.forEach(st => {
                  const matchById = subTopicsRes.data.find(sub => sub.id === st);
                  const matchByName = subTopicsRes.data.find(sub => sub.name.toLowerCase() === st.toLowerCase());
                  if (matchById) {
                    mappedSubTopics.push(matchById.id);
                  } else if (matchByName) {
                    mappedSubTopics.push(matchByName.id);
                  }
                });
              }
            }
          }
        }

        // Fetch existing questions
        let existingQuestions: Question[] = [];
        if (testData.questions && testData.questions.length > 0) {
          try {
            const questionsRes = await apiService.fetchBulkQuestions(testData.questions);
            if (questionsRes.success) {
              existingQuestions = questionsRes.data;
            }
          } catch (qErr) {
            console.error('Error fetching existing questions:', qErr);
          }
        }

        // Initialize questions array padded to total_questions limit
        const limit = testData.total_questions || 50;
        const paddedQuestions: Question[] = Array.from({ length: limit }, (_, idx) => {
          if (idx < existingQuestions.length) {
            return { ...existingQuestions[idx] };
          }
          return {
            type: 'mcq',
            question: '',
            option1: '',
            option2: '',
            option3: '',
            option4: '',
            correct_option: 'option1',
            explanation: '',
            difficulty: 'easy',
            test_id: testId,
            subject: testData.subject || '',
            topic_id: mappedTopics[0] || testData.topics?.[0] || '',
            sub_topic_id: mappedSubTopics[0] || testData.sub_topics?.[0] || '',
          };
        });

        setQuestions(paddedQuestions);
      } else {
        setApiError('Could not load test details.');
      }
    } catch (err) {
      console.error('Error loading test data:', err);
      setApiError('An error occurred while loading test data.');
    } finally {
      setLoading(false);
    }
  };


  // Check if a specific question is fully composed
  const isQuestionComposed = (q: Question) => {
    return (
      q.question.trim() !== '' &&
      q.option1.trim() !== '' &&
      q.option2.trim() !== '' &&
      q.option3.trim() !== '' &&
      q.option4.trim() !== ''
    );
  };

  // Bind input edits directly to the active question item in state
  const updateActiveQuestion = (fields: Partial<Question>) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[activeIndex] = {
        ...updated[activeIndex],
        ...fields
      };
      return updated;
    });
  };

  // Delete all edits for the active question
  const handleDeleteAllEdits = () => {
    updateActiveQuestion({
      question: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct_option: 'option1',
      explanation: '',
      difficulty: 'easy',
      subject: test?.subject || '',
      topic_id: test?.topics?.[0] || '',
      sub_topic_id: test?.sub_topics?.[0] || '',
      media_url: undefined
    });
  };

  // ── CSV Import ─────────────────────────────────────────────────────────────
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      // Skip header row if it contains "question" (case-insensitive)
      const dataLines = lines[0]?.toLowerCase().includes('question') ? lines.slice(1) : lines;
      const parsed: Question[] = dataLines.map((line) => {
        // Support comma-separated; handle quoted fields
        const cols = line.match(/(?:"([^"]*)"|([^,]*))/g)?.map(c =>
          c.startsWith('"') ? c.slice(1, -1) : c
        ) || [];
        return {
          type: 'mcq',
          question:       cols[0] || '',
          option1:        cols[1] || '',
          option2:        cols[2] || '',
          option3:        cols[3] || '',
          option4:        cols[4] || '',
          correct_option: cols[5] || 'option1',
          explanation:    cols[6] || '',
          difficulty:     (cols[7] || 'easy').toLowerCase(),
          test_id:        id || '',
          subject:        test?.subject || '',
          topic_id:       test?.topics?.[0] || '',
          sub_topic_id:   test?.sub_topics?.[0] || '',
        };
      }).filter(q => q.question.trim() !== '');

      if (parsed.length === 0) {
        setApiError('CSV file is empty or has no valid question rows.');
        return;
      }

      setQuestions(prev => {
        const limit = totalQuestionsLimit;
        const merged = [...prev];
        parsed.forEach((q, idx) => {
          if (idx < limit) merged[idx] = { ...merged[idx], ...q };
        });
        return merged;
      });
      setActiveIndex(0);
      setApiError('');
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  // ── Image Upload ───────────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      updateActiveQuestion({ media_url: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper pagination handlers
  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < totalQuestionsLimit - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      // Last item, save
      handleSaveAndPublish();
    }
  };

  // Save changes and publish/preview
  const handleSaveAndPublish = async () => {
    setSaving(true);
    setApiError('');
    try {
      // Filter out only fully composed questions
      const composedQuestions = questions.filter(isQuestionComposed);

      if (composedQuestions.length === 0) {
        setApiError('You must compose at least 1 question before saving.');
        setSaving(false);
        return;
      }

      // Save composed questions to backend (bulk)
      // Identify existing vs new ones
      const existing = composedQuestions.filter(q => q.id);
      const newItems = composedQuestions.filter(q => !q.id);
      
      let newSavedIds: string[] = [];
      if (newItems.length > 0) {
        const preparedNew = newItems.map(q => {
          // Strip fields not present in the DB schema
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _, sub_topic_id, topic_id, media_url, ...rest } = q;
          return rest;
        });
        const bulkRes = await apiService.bulkCreateQuestions(preparedNew as Question[]);
        if (bulkRes.success && bulkRes.data) {
          newSavedIds = bulkRes.data.map(q => q.id as string);
        } else {
          throw new Error('Failed to create composed questions in bulk.');
        }
      }

      const allQuestionIds = [
        ...existing.map(q => q.id as string),
        ...newSavedIds
      ];

      // Update the test
      if (id && test) {
        await apiService.updateTest(id, {
          questions: allQuestionIds,
          total_questions: test.total_questions // keep total count
        });
        
        // Go to preview / publish page
        navigate(`/tests/${id}/preview`);
      }
    } catch (err: any) {
      console.error('Error saving questions:', err);
      const apiErr = err.response?.data;
      const detailMsg = apiErr?.errors?.message || apiErr?.message || 'Failed to save questions. Please check details.';
      setApiError(detailMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading test blueprint and questions...</p>
      </div>
    );
  }

  const activeQuestion = questions[activeIndex] || {
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 'option1',
    explanation: '',
    difficulty: 'easy',
  };

  return (
    <div className="questions-layout-container">
      {/* 1. Left Question Navigation List */}
      <div className="questions-side-nav">
        <div className="side-nav-brand">
          <PrepRouteLogo height={34} width={150} />
        </div>
        <div className="side-nav-header">
          <span className="side-nav-title">Question creation</span>
          <button className="collapse-btn-icon" title="Collapse panel">
            &laquo;
          </button>
        </div>
        <div className="side-nav-sub">
          Total Questions . {totalQuestionsLimit}
        </div>
        <div className="side-nav-list">
          {questions.map((q, idx) => {
            const isComposed = isQuestionComposed(q);
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                className={`side-nav-item ${isActive ? 'active' : ''} ${isComposed ? 'composed' : ''}`}
                onClick={() => setActiveIndex(idx)}
                data-number={idx + 1}
              >
                {isComposed ? (
                  <span className="composed-check-icon">✓</span>
                ) : (
                  <span className="empty-dot-icon"></span>
                )}
                <span className="item-label">Question {idx + 1}</span>
                <span className="item-arrow">&raquo;</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Question Editor Content */}
      <div className="questions-editor-main">
        
        {/* Test Summary banner card */}
        {test && (
          <div className="test-blueprint-summary-card">
            <div className="summary-left-pills">
              <div className="summary-badge-type">
                {test.type === 'mock' ? 'Mock Test' : test.type === 'pyq' ? 'PYQ' : 'Chapter Wise'}
              </div>
              <div className="summary-title-difficulty">
                <span className="blueprint-title">{test.name}</span>
                <span className="blueprint-diff-badge" style={{ textTransform: 'capitalize' }}>
                  {test.difficulty || 'Easy'}
                </span>
              </div>
              
              <div className="blueprint-metadata-list">
                <div className="meta-row">
                  <span className="meta-lbl">Subject</span>
                  <span className="meta-colon">:</span>
                  <span className="meta-val">{test.subject}</span>
                </div>
                {test.topics && test.topics.length > 0 && (
                  <div className="meta-row">
                    <span className="meta-lbl">Topic</span>
                    <span className="meta-colon">:</span>
                    <span className="meta-val">
                      {test.topics.map((t, index) => (
                        <span key={index} className="yellow-meta-pill">{getTopicName(t)}</span>
                      ))}
                    </span>
                  </div>
                )}
                {test.sub_topics && test.sub_topics.length > 0 && (
                  <div className="meta-row">
                    <span className="meta-lbl">Sub Topic</span>
                    <span className="meta-colon">:</span>
                    <span className="meta-val">
                      {test.sub_topics.map((st, index) => (
                        <span key={index} className="yellow-meta-pill">{getSubTopicName(st)}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-right-stats">
              <div className="stats-unified-capsule">
                <div className="stat-item">
                  <span className="stat-icon">⏱</span>
                  <span>{test.total_time} Min</span>
                </div>
                <div className="stat-separator"></div>
                <div className="stat-item">
                  <span className="stat-icon">📄</span>
                  <span>{totalQuestionsLimit} Q's</span>
                </div>
                <div className="stat-separator"></div>
                <div className="stat-item">
                  <span className="stat-icon">📊</span>
                  <span>{test.total_marks} Marks</span>
                </div>
              </div>
            </div>

            <button 
              className="summary-edit-btn" 
              onClick={() => navigate(`/tests/${id}/edit`)}
              title="Edit parameters"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}

        {/* Error notice */}
        {apiError && (
          <div className="login-error-banner" style={{ margin: '0 0 20px 0' }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Question editor section */}
        <div className="question-form-card">
          <div className="form-heading-row">
            <h2 className="editor-title">Question {activeIndex + 1}/{totalQuestionsLimit}</h2>
            <div className="editor-header-actions">
              <button type="button" className="btn-add-mcq" onClick={() => handleNext()}>
                <span className="btn-icon">+</span> MCQ
              </button>
              <button
                type="button"
                className="btn-csv-upload"
                title="Import questions from CSV"
                onClick={() => csvInputRef.current?.click()}
              >
                <span>⤓</span> CSV
              </button>
              {/* Hidden CSV file input */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleCSVUpload}
              />
            </div>
          </div>

          <div className="delete-edits-container">
            <button type="button" className="btn-delete-edits" onClick={handleDeleteAllEdits}>
              <Trash2 size={15} />
              <span>Delete All Edits</span>
            </button>
          </div>

          {/* Form Composer Area */}
          <div className="rich-text-editor-container">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <button type="button" className="tool-btn" title="Bold"><Bold size={15} /></button>
              <button type="button" className="tool-btn" title="Italic"><Italic size={15} /></button>
              <button type="button" className="tool-btn" title="Underline"><Underline size={15} /></button>
              <button type="button" className="tool-btn-strikethrough" title="Strikethrough">S</button>
              <span className="tool-divider"></span>
              <button type="button" className="tool-btn" title="Link"><Link2 size={15} /></button>
              <span className="tool-divider"></span>
              <button type="button" className="tool-btn" title="Align Left"><AlignLeft size={15} /></button>
              <button type="button" className="tool-btn" title="Align Center"><AlignCenter size={15} /></button>
              <button type="button" className="tool-btn" title="Align Right"><AlignRight size={15} /></button>
              <span className="tool-divider"></span>
              <button type="button" className="tool-btn" title="List"><List size={15} /></button>
              <button type="button" className="tool-btn" title="Numbered List"><ListOrdered size={15} /></button>
              <span className="tool-divider"></span>
              <button type="button" className="tool-btn" title="Table"><Table size={15} /></button>
              <button type="button" className="tool-btn" title="Equation"><Sigma size={15} /></button>
              <button
                type="button"
                className="tool-btn"
                title="Insert Image"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image size={15} />
              </button>
              {/* Hidden image file input */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
            
            {/* TextArea content */}
            <div className="textarea-wrapper">
              <textarea
                className="editor-textarea"
                placeholder="Type here"
                value={activeQuestion.question}
                onChange={(e) => updateActiveQuestion({ question: e.target.value })}
              />
              <button type="button" className="textarea-clear-btn" onClick={() => updateActiveQuestion({ question: '' })}>
                <Trash2 size={16} />
              </button>
            </div>
            {/* Image preview below question textarea */}
            {activeQuestion.media_url && (
              <div className="question-image-preview">
                <img
                  src={activeQuestion.media_url}
                  alt="Question attachment"
                  style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', marginTop: '10px', border: '1px solid var(--border-color)' }}
                />
                <button
                  type="button"
                  className="btn-delete-edits"
                  style={{ marginTop: '6px', fontSize: '12px' }}
                  onClick={() => updateActiveQuestion({ media_url: undefined })}
                >
                  <Trash2 size={13} /> Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Options grid */}
          <div className="options-composer-section">
            <h3 className="section-subtitle">Type the options below</h3>
            
            {['option1', 'option2', 'option3', 'option4'].map((optKey) => {
              const optVal = (activeQuestion as any)[optKey];
              const isCorrect = activeQuestion.correct_option === optKey;
              return (
                <div key={optKey} className="option-row">
                  <button
                    type="button"
                    className={`option-radio-btn ${isCorrect ? 'checked' : ''}`}
                    onClick={() => updateActiveQuestion({ correct_option: optKey })}
                  >
                    <span className="radio-circle-inner"></span>
                  </button>
                  <input
                    type="text"
                    className="option-text-input"
                    placeholder="Type Option here"
                    value={optVal}
                    onChange={(e) => updateActiveQuestion({ [optKey]: e.target.value })}
                  />
                  <button 
                    type="button" 
                    className="option-clear-btn"
                    onClick={() => updateActiveQuestion({ [optKey]: '' })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Solution Explanation Box */}
          <div className="solution-composer-section">
            <h3 className="section-subtitle">Add Solution</h3>
            <div className="textarea-wrapper">
              <textarea
                className="solution-textarea"
                placeholder="Type here"
                value={activeQuestion.explanation || ''}
                onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
              />
              <button type="button" className="textarea-clear-btn" onClick={() => updateActiveQuestion({ explanation: '' })}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Question Pagination Control */}
          <div className="question-pagination-arrows">
            <button 
              type="button" 
              className="pagination-arrow-btn" 
              onClick={handlePrev}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              type="button" 
              className="pagination-arrow-btn" 
              onClick={handleNext}
              disabled={activeIndex === totalQuestionsLimit - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Question Settings Selects */}
          <div className="question-settings-section">
            <h3 className="settings-title">Question settings</h3>
            
            <div className="settings-grid">
              <div className="form-group">
                <label className="form-label">Level of Difficulty</label>
                <select
                  className="form-select"
                  value={activeQuestion.difficulty || 'easy'}
                  onChange={(e) => updateActiveQuestion({ difficulty: e.target.value })}
                >
                  <option value="">Select from Drop-down</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Difficult</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Topic</label>
                <select
                  className="form-select"
                  value={activeQuestion.topic_id || ''}
                  onChange={(e) => updateActiveQuestion({ topic_id: e.target.value })}
                >
                  <option value="">Select from Drop-down</option>
                  {topicsList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sub-topic</label>
                <select
                  className="form-select"
                  value={activeQuestion.sub_topic_id || ''}
                  onChange={(e) => updateActiveQuestion({ sub_topic_id: e.target.value })}
                  disabled={!activeQuestion.topic_id}
                >
                  <option value="">Select from Drop-down</option>
                  {subTopicsList
                    .filter(st => st.topic_id === activeQuestion.topic_id)
                    .map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="editor-actions-footer">
            <button 
              type="button" 
              className="btn-exit-test"
              onClick={() => navigate('/')}
            >
              Exit Test Creation
            </button>
            <button 
              type="button" 
              className="btn-save-questions"
              onClick={handleSaveAndPublish}
              disabled={saving}
            >
              {saving ? (
                <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                'Next'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
