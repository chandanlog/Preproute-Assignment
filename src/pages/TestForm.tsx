import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Subject, Topic, SubTopic, Test } from '../services/api';
import { ChevronUp, ChevronDown, AlertCircle, Loader } from 'lucide-react';
import './TestForm.css';

// Helper component for the custom numeric stepper matching the mockup
interface StepperProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  showPlus?: boolean;
}

const NumberStepper: React.FC<StepperProps> = ({ label, value, onChange, showPlus = false }) => {
  const displayValue = value > 0 && showPlus ? `+${value}` : value === 0 && showPlus ? `+0` : value;
  
  return (
    <div className="stepper-group">
      <label className="stepper-label">{label}</label>
      <div className="stepper-control">
        <span className="stepper-value">{displayValue}</span>
        <div className="stepper-actions">
          <button type="button" className="stepper-btn" onClick={() => onChange(value + 1)}>
            <ChevronUp size={12} />
          </button>
          <button type="button" className="stepper-btn" onClick={() => onChange(value - 1)}>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const TestForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Active sub-tab state (mock/view only, defaults to 'Chapterwise')
  const [activeTab, setActiveTab] = useState<'chapter' | 'pyq' | 'mock'>('chapter');

  // Form Field States
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('easy'); // Defaults to easy per screenshot
  const [correctMarks, setCorrectMarks] = useState<number>(5); // Default +5 per screenshot
  const [wrongMarks, setWrongMarks] = useState<number>(-1); // Default -1 per screenshot
  const [unattemptMarks, setUnattemptMarks] = useState<number>(0); // Default +0 per screenshot
  const [totalTime, setTotalTime] = useState<string>(''); // Holds raw text string for duration input
  const [totalMarks, setTotalMarks] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<string>('');

  // Cascading Selection Options
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [topicsList, setTopicsList] = useState<Topic[]>([]);
  const [subTopicsList, setSubTopicsList] = useState<SubTopic[]>([]);

  // Selected UUID strings (stored in arrays to comply with the Test interface / payload schema)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Auto-calculate Total Marks when Correct Marks or Total Questions change
  useEffect(() => {
    const qCount = Number(totalQuestions);
    if (!isNaN(qCount) && qCount > 0) {
      setTotalMarks(String(qCount * correctMarks));
    } else {
      setTotalMarks('');
    }
  }, [totalQuestions, correctMarks]);

  // 1. Initial Load: Fetch Subjects and (if editing) Test Details
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      setApiError('');
      try {
        const subjectsRes = await apiService.getSubjects();
        if (subjectsRes.success) {
          setSubjectsList(subjectsRes.data);
          
          if (isEdit && id) {
            await loadExistingTestData(id, subjectsRes.data);
          } else {
            setIsDataLoaded(true);
          }
        } else {
          setApiError('Failed to fetch subjects.');
        }
      } catch (err) {
        console.error('Error initializing form:', err);
        setApiError('An error occurred while loading form data.');
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [isEdit, id]);

  // 2. Helper to load and map existing test details
  const loadExistingTestData = async (testId: string, currentSubjects: Subject[]) => {
    try {
      const testRes = await apiService.getTestById(testId);
      if (testRes.success && testRes.data) {
        const test = testRes.data;
        setName(test.name);
        if (test.type === 'mock') {
          setActiveTab('mock');
        } else if (test.type === 'pyq') {
          setActiveTab('pyq');
        } else {
          setActiveTab('chapter');
        }
        setDifficulty(test.difficulty || 'easy');
        setCorrectMarks(test.correct_marks);
        setWrongMarks(test.wrong_marks);
        setUnattemptMarks(test.unattempt_marks);
        setTotalTime(test.total_time ? String(test.total_time) : '');
        setTotalQuestions(test.total_questions ? String(test.total_questions) : '');
        setTotalMarks(test.total_marks ? String(test.total_marks) : '');

        // Find subject UUID
        let subjectUuid = test.subject;
        const matchedSubById = currentSubjects.find(s => s.id === test.subject);
        const matchedSubByName = currentSubjects.find(s => s.name.toLowerCase() === test.subject.toLowerCase());
        
        if (!matchedSubById && matchedSubByName) {
          subjectUuid = matchedSubByName.id;
        }
        setSubject(subjectUuid);

        // Fetch topics
        if (subjectUuid) {
          setFetchingOptions(true);
          const topicsRes = await apiService.getTopicsBySubject(subjectUuid);
          if (topicsRes.success) {
            setTopicsList(topicsRes.data);
            
            // Map test topics (could be names or IDs) to topic UUIDs
            const mappedTopicUuids: string[] = [];
            test.topics?.forEach(t => {
              const matchById = topicsRes.data.find(topic => topic.id === t);
              const matchByName = topicsRes.data.find(topic => topic.name.toLowerCase() === t.toLowerCase());
              if (matchById) {
                mappedTopicUuids.push(matchById.id);
              } else if (matchByName) {
                mappedTopicUuids.push(matchByName.id);
              }
            });
            setSelectedTopics(mappedTopicUuids);

            // Fetch subtopics
            if (mappedTopicUuids.length > 0) {
              const subTopicsRes = await apiService.getSubTopicsMultiTopics(mappedTopicUuids);
              if (subTopicsRes.success) {
                setSubTopicsList(subTopicsRes.data);
                
                // Map test sub_topics to UUIDs
                const mappedSubTopicUuids: string[] = [];
                test.sub_topics?.forEach(st => {
                  const matchById = subTopicsRes.data.find(sub => sub.id === st);
                  const matchByName = subTopicsRes.data.find(sub => sub.name.toLowerCase() === st.toLowerCase());
                  if (matchById) {
                    mappedSubTopicUuids.push(matchById.id);
                  } else if (matchByName) {
                    mappedSubTopicUuids.push(matchByName.id);
                  }
                });
                setSelectedSubTopics(mappedSubTopicUuids);
              }
            }
          }
          setFetchingOptions(false);
        }
      }
      setIsDataLoaded(true);
    } catch (err) {
      console.error('Failed to load test details for editing:', err);
      setApiError('Could not load test details for editing.');
    }
  };

  // 3. Subject Change Cascade
  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubjectId = e.target.value;
    setSubject(newSubjectId);
    
    // Clear selection cascade
    setTopicsList([]);
    setSelectedTopics([]);
    setSubTopicsList([]);
    setSelectedSubTopics([]);

    if (newSubjectId) {
      setFetchingOptions(true);
      try {
        const response = await apiService.getTopicsBySubject(newSubjectId);
        if (response.success) {
          setTopicsList(response.data);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      } finally {
        setFetchingOptions(false);
      }
    }
  };

  // 4. Topic Selection Change (Dropdown single select)
  const handleTopicChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topicId = e.target.value;
    const updatedTopics = topicId ? [topicId] : [];
    setSelectedTopics(updatedTopics);
    
    // Clear subtopic selection
    setSelectedSubTopics([]);
    setSubTopicsList([]);

    if (topicId) {
      setFetchingOptions(true);
      try {
        const response = await apiService.getSubTopicsMultiTopics(updatedTopics);
        if (response.success) {
          setSubTopicsList(response.data);
        }
      } catch (err) {
        console.error('Error fetching sub-topics:', err);
      } finally {
        setFetchingOptions(false);
      }
    }
  };

  // 5. SubTopic Selection Change (Dropdown single select)
  const handleSubTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subTopicId = e.target.value;
    setSelectedSubTopics(subTopicId ? [subTopicId] : []);
  };

  // 6. Form Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Test name is required';
    if (!subject) errors.subject = 'Subject selection is required';
    if (selectedTopics.length === 0) errors.topics = 'Topic selection is required';
    
    const durationNum = Number(totalTime);
    if (!totalTime || isNaN(durationNum) || durationNum <= 0) {
      errors.totalTime = 'Duration must be greater than 0';
    }
    
    const qLimit = Number(totalQuestions);
    if (!totalQuestions || isNaN(qLimit) || qLimit <= 0) {
      errors.totalQuestions = 'Total questions must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 7. Save handler
  const handleSave = async (shouldRedirectToQuestions: boolean) => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError('');
    
    const payload = {
      name,
      type: activeTab === 'pyq' ? 'pyq' : activeTab === 'mock' ? 'mock' : 'practice',
      subject, 
      topics: selectedTopics,
      sub_topics: selectedSubTopics,
      correct_marks: Number(correctMarks),
      wrong_marks: Number(wrongMarks),
      unattempt_marks: Number(unattemptMarks),
      difficulty,
      total_time: Number(totalTime),
      total_marks: Number(totalMarks),
      total_questions: Number(totalQuestions),
    };

    try {
      let savedTest: Test;
      if (isEdit && id) {
        const currentTestRes = await apiService.getTestById(id);
        const originalQuestions = currentTestRes.success ? currentTestRes.data.questions || [] : [];
        
        const updatePayload = {
          ...payload,
          questions: originalQuestions,
        };
        const response = await apiService.updateTest(id, updatePayload);
        if (response.success) {
          savedTest = response.data;
        } else {
          throw new Error('API returned failure on update');
        }
      } else {
        const response = await apiService.createTest(payload);
        if (response.success) {
          savedTest = response.data;
        } else {
          throw new Error(response.message || 'API returned failure on create');
        }
      }

      if (shouldRedirectToQuestions) {
        navigate(`/tests/${savedTest.id}/questions`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Error saving test details:', err);
      // Extract specific field-level validation errors from the API response
      const apiErrors: { path: string; msg: string }[] = err.response?.data?.errors || [];
      if (apiErrors.length > 0) {
        const fieldErrors: { [key: string]: string } = {};
        apiErrors.forEach(({ path, msg }) => {
          // Map backend field path to our form field keys
          if (path === 'subject' && msg.toLowerCase().includes('name already exists')) {
            fieldErrors.name = 'A test with this name already exists for this subject. Please use a different test name.';
          } else if (path === 'name') {
            fieldErrors.name = msg;
          } else if (path === 'subject') {
            fieldErrors.subject = msg;
          } else {
            // Fallback: show in the general error banner
            setApiError(msg);
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors(prev => ({ ...prev, ...fieldErrors }));
        }
      } else {
        const msg = err.response?.data?.message || 'Failed to save test details. Please try again.';
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isDataLoaded && loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading form options...</p>
      </div>
    );
  }

  return (
    <div className="test-form-wrapper">
      <div className="test-form-card">
        {/* Card Header for Edit Mode */}
        {isEdit && (
          <div className="form-card-header">
            <h2 className="form-card-title">Edit Test creation</h2>
            <button type="button" className="form-card-close-btn" onClick={() => navigate('/')} title="Close">
              &times;
            </button>
          </div>
        )}

        {/* Top Segmented Tab Control */}
        <div className="form-tabs-container">
          <div className="form-tabs">
            <button 
              type="button" 
              className={`form-tab ${activeTab === 'chapter' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapter')}
            >
              Chapterwise
            </button>
            <button 
              type="button" 
              className={`form-tab ${activeTab === 'pyq' ? 'active' : ''}`}
              onClick={() => setActiveTab('pyq')}
            >
              PYQ
            </button>
            <button 
              type="button" 
              className={`form-tab ${activeTab === 'mock' ? 'active' : ''}`}
              onClick={() => setActiveTab('mock')}
            >
              Mock Test
            </button>
          </div>
        </div>

        {apiError && (
          <div className="login-error-banner" style={{ marginBottom: '24px' }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="test-blueprint-form">
          {/* Row 1: Subject & Name of Test */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <div className="select-container">
                <select
                  className={`form-select ${formErrors.subject ? 'input-error' : ''}`}
                  value={subject}
                  onChange={handleSubjectChange}
                  disabled={loading || isEdit}
                >
                  <option value="">Choose from Drop-down</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              {formErrors.subject && <span className="form-error">{formErrors.subject}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Name of Test</label>
              <input
                type="text"
                className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                placeholder="Enter name of Test"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              {formErrors.name && <span className="form-error">{formErrors.name}</span>}
            </div>
          </div>

          {/* Row 2: Topic & Sub Topic */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Topic</label>
              <div className="select-container">
                <select
                  className={`form-select ${formErrors.topics ? 'input-error' : ''}`}
                  value={selectedTopics[0] || ''}
                  onChange={handleTopicChange}
                  disabled={loading || !subject || fetchingOptions}
                >
                  <option value="">Choose from Drop-down</option>
                  {topicsList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {fetchingOptions && !topicsList.length && (
                  <span className="dropdown-loading-indicator">Loading...</span>
                )}
              </div>
              {formErrors.topics && <span className="form-error">{formErrors.topics}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Sub Topic</label>
              <div className="select-container">
                <select
                  className="form-select"
                  value={selectedSubTopics[0] || ''}
                  onChange={handleSubTopicChange}
                  disabled={loading || selectedTopics.length === 0 || fetchingOptions}
                >
                  <option value="">Choose from Drop-down</option>
                  {subTopicsList.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Duration (Minutes) & Test Difficulty Level */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="text"
                className={`form-input ${formErrors.totalTime ? 'input-error' : ''}`}
                placeholder="Enter the time"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                disabled={loading}
              />
              {formErrors.totalTime && <span className="form-error">{formErrors.totalTime}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Test Difficulty Level</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="difficulty"
                    value="easy"
                    checked={difficulty === 'easy'}
                    onChange={() => setDifficulty('easy')}
                    disabled={loading}
                  />
                  <span>Easy</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="difficulty"
                    value="medium"
                    checked={difficulty === 'medium'}
                    onChange={() => setDifficulty('medium')}
                    disabled={loading}
                  />
                  <span>Medium</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="difficulty"
                    value="hard"
                    checked={difficulty === 'hard'}
                    onChange={() => setDifficulty('hard')}
                    disabled={loading}
                  />
                  <span>Difficult</span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Marking Scheme Heading */}
          <div className="marking-scheme-title">
            Marking Scheme:
          </div>

          {/* Row 5: Marking Scheme Steppers + No of Questions + Total Marks */}
          <div className="marking-scheme-limits-grid">
            <div className="marking-scheme-steppers">
              <NumberStepper
                label="Wrong Answer"
                value={wrongMarks}
                onChange={setWrongMarks}
              />
              <NumberStepper
                label="Unattempted"
                value={unattemptMarks}
                onChange={setUnattemptMarks}
                showPlus
              />
              <NumberStepper
                label="Correct Answer"
                value={correctMarks}
                onChange={setCorrectMarks}
                showPlus
              />
            </div>

            <div className="limits-inputs">
              <div className="form-group">
                <label className="form-label">No of Questions</label>
                <input
                  type="text"
                  className={`form-input ${formErrors.totalQuestions ? 'input-error' : ''}`}
                  placeholder="Ex:250 Marks"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  disabled={loading}
                />
                {formErrors.totalQuestions && <span className="form-error">{formErrors.totalQuestions}</span>}
              </div>

              <div className="form-group">
                <label className="form-label disabled-label">Total Marks</label>
                <input
                  type="text"
                  className="form-input disabled-input"
                  placeholder="Ex:250 Marks"
                  value={totalMarks}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="form-actions-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>

            {isEdit ? (
              <button
                type="button"
                className="btn-next"
                onClick={() => handleSave(false)}
                disabled={loading}
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Save'
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn-next"
                onClick={() => handleSave(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Next'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm;
