import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Test, Question } from '../services/api';
import { Check, AlertCircle, Loader, Calendar, ChevronDown } from 'lucide-react';
import { PrepRouteLogo } from '../components/PrepRouteLogo';
import './PreviewPublish.css';


export const PreviewPublish: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core Data States
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Publish form states
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now');
  const [liveUntil, setLiveUntil] = useState<'always' | '1week' | '2weeks' | '3weeks' | '1month' | 'custom'>('custom'); // Defaults to custom per screenshot
  
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Loading and action states
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [apiError, setApiError] = useState('');

  // Total questions count (default 50)
  const totalQuestionsLimit = test?.total_questions || 50;

  useEffect(() => {
    if (id) {
      loadPreviewData(id);
    }
  }, [id]);

  const loadPreviewData = async (testId: string) => {
    setLoading(true);
    setApiError('');
    try {
      const response = await apiService.getTestById(testId);
      if (response.success && response.data) {
        const testData = response.data;
        setTest(testData);

        let subjectUuid = testData.subject;
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
            const topicIds = topicsRes.data.map(t => t.id);
            if (topicIds.length > 0) {
              await apiService.getSubTopicsMultiTopics(topicIds);
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
            console.error('Error fetching questions:', qErr);
          }
        }

        // Initialize questions list padded to total questions limit
        const limit = testData.total_questions || 50;
        const paddedQuestions = Array.from({ length: limit }, (_, idx) => {
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
          };
        });

        setQuestions(paddedQuestions);
      } else {
        setApiError('Could not load test preview information.');
      }
    } catch (err) {
      console.error('Error fetching preview details:', err);
      setApiError('An error occurred while preparing the test preview.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    setApiError('');

    try {
      const response = await apiService.publishTest(id) as any;
      if (response.success || response.status === 'success') {
        setShowSuccessModal(true);
      } else {
        setApiError('Failed to publish the test. The server returned an error.');
      }
    } catch (err: any) {
      console.error('Publishing error:', err);
      setApiError(err.response?.data?.message || 'Failed to set test status to Live. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // Helper check if a question is fully composed
  const isQuestionComposed = (q: Question) => {
    return (
      q.question.trim() !== '' &&
      q.option1.trim() !== '' &&
      q.option2.trim() !== '' &&
      q.option3.trim() !== '' &&
      q.option4.trim() !== ''
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Preparing review preview board...</p>
      </div>
    );
  }



  return (
    <div className="publish-layout-container">
      {/* 1. Left Sidebar Question list */}
      <div className="publish-side-nav">
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
            return (
              <div 
                key={idx} 
                className={`side-nav-item readonly-item ${isComposed ? 'composed' : ''}`}
                data-number={idx + 1}
              >
                {isComposed ? (
                  <span className="composed-check-icon">✓</span>
                ) : (
                  <span className="empty-dot-icon"></span>
                )}
                <span className="item-label">Question {idx + 1}</span>
                <span className="item-arrow">&raquo;</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Confirmation Form Panel */}
      <div className="publish-main-content">
        
        {/* Success Publish Overlay Modal */}
        {showSuccessModal && (
          <div className="success-overlay">
            <div className="success-card">
              <div className="success-icon-wrapper">
                <Check size={40} />
              </div>
              <h2 className="success-title">Test Published Live!</h2>
              <p className="success-subtitle">
                "{test?.name}" is now live on the PrepRoute platform. Students can access this test for practice.
              </p>
              <button 
                className="btn-confirm-ok" 
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Header created notice */}
        <div className="publish-header-row">
          <div className="publish-badge-wrapper">
            <span className="publish-label-created">Test created</span>
            <span className="publish-badge-done">
              <span className="done-check-mark">✓</span> All {totalQuestionsLimit} Questions done
            </span>
          </div>
        </div>

        {/* Blueprint Summary Card */}
        {test && (
          <div className="test-blueprint-summary-card">
            <div className="summary-left-pills">
              <div className="summary-badge-type">Chapter Wise</div>
              <div className="summary-title-difficulty">
                <span className="blueprint-title">Chapter 1</span>
                <span className="blueprint-diff-badge">Easy</span>
              </div>
              
              <div className="blueprint-metadata-list">
                <div className="meta-row">
                  <span className="meta-lbl">Subject</span>
                  <span className="meta-val">: English</span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl">Topic</span>
                  <span className="meta-val">
                    <span className="yellow-meta-pill">Grammar</span>
                    <span className="yellow-meta-pill">Writing</span>
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl">Sub Topic</span>
                  <span className="meta-val">
                    <span className="yellow-meta-pill">Application</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="summary-right-stats">
              <div className="stat-pill">
                <span className="stat-icon">⏱</span>
                <span>{test.total_time} Min</span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon">📄</span>
                <span>{totalQuestionsLimit} Q's</span>
              </div>
              <div className="stat-pill">
                <span className="stat-icon">📊</span>
                <span>{test.total_marks} Marks</span>
              </div>
            </div>

            <button 
              className="summary-edit-btn" 
              onClick={() => navigate(`/tests/${id}/edit`)}
              title="Edit parameters"
            >
              ✎
            </button>
          </div>
        )}

        {apiError && (
          <div className="login-error-banner" style={{ margin: '0 0 20px 0' }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Publish configurations card */}
        <div className="publish-config-card">
          
          {/* Segmented Publish Type Selector */}
          <div className="publish-type-tabs">
            <button 
              type="button" 
              className={`publish-type-tab ${publishType === 'now' ? 'active' : ''}`}
              onClick={() => setPublishType('now')}
            >
              Publish Now
            </button>
            <button 
              type="button" 
              className={`publish-type-tab ${publishType === 'schedule' ? 'active' : ''}`}
              onClick={() => setPublishType('schedule')}
            >
              Schedule Publish
            </button>
          </div>

          {/* Schedule Publish Date/Time pickers */}
          {publishType === 'schedule' && (
            <div className="schedule-datetime-pickers animate-slide-down">
              <h4 className="config-section-title">Select Date and Time</h4>
              <div className="datepicker-row">
                <div className="datepicker-wrapper">
                  <input
                    type="text"
                    className="datepicker-input"
                    placeholder="Select Date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                  <Calendar size={16} className="picker-icon" />
                </div>
                <div className="timepicker-wrapper">
                  <select
                    className="timepicker-select"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                  >
                    <option value="">Select Time</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                  <ChevronDown size={16} className="picker-chevron" />
                </div>
              </div>
            </div>
          )}

          {/* Live Until Radios Grid */}
          <div className="live-until-section">
            <h3 className="live-until-title">Live Until</h3>
            <p className="live-until-desc">
              Choose how long this test should remain available on the platform.
            </p>

            <div className="live-until-grid">
              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="always"
                  checked={liveUntil === 'always'}
                  onChange={() => setLiveUntil('always')}
                />
                <span>Always Available</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="3weeks"
                  checked={liveUntil === '3weeks'}
                  onChange={() => setLiveUntil('3weeks')}
                />
                <span>3 Weeks</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="1week"
                  checked={liveUntil === '1week'}
                  onChange={() => setLiveUntil('1week')}
                />
                <span>1 Week</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="1month"
                  checked={liveUntil === '1month'}
                  onChange={() => setLiveUntil('1month')}
                />
                <span>1 Month</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="2weeks"
                  checked={liveUntil === '2weeks'}
                  onChange={() => setLiveUntil('2weeks')}
                />
                <span>2 Weeks</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="liveUntil"
                  value="custom"
                  checked={liveUntil === 'custom'}
                  onChange={() => setLiveUntil('custom')}
                />
                <span>Custom Duration</span>
              </label>
            </div>

            {/* Custom End Date / Time pickers */}
            {liveUntil === 'custom' && (
              <div className="datepicker-row animate-slide-down" style={{ marginTop: '20px' }}>
                <div className="datepicker-wrapper">
                  <input
                    type="text"
                    className="datepicker-input"
                    placeholder="Select End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Calendar size={16} className="picker-icon" />
                </div>
                <div className="timepicker-wrapper">
                  <select
                    className="timepicker-select"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    <option value="">Select End Time</option>
                    <option value="11:59 PM">11:59 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="12:00 PM">12:00 PM</option>
                  </select>
                  <ChevronDown size={16} className="picker-chevron" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions footer */}
          <div className="publish-actions-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(`/tests/${id}/questions`)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-confirm"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                'Confirm'
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PreviewPublish;
