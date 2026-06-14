import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Test, Subject } from '../services/api';
import { 
  FileText, CheckCircle, Clock, Search, Plus, Edit2, Eye, Trash2, FolderOpen,
  Calendar, AlertCircle, AlertTriangle 
} from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);
  
  // Confirm Delete State
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [testsRes, subjectsRes] = await Promise.all([
        apiService.getTests(),
        apiService.getSubjects()
      ]);
      
      if (testsRes.success) {
        setTests(testsRes.data);
      } else {
        setError('Failed to fetch tests list.');
      }
      
      if (subjectsRes.success) {
        setSubjects(subjectsRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while loading dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'danger') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestToDelete(id);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;

    // Optimistic update — remove from UI immediately for snappy UX
    const deletingId = testToDelete;
    setTestToDelete(null);
    setTests(prev => prev.filter(t => t.id !== deletingId));
    showToastMessage('Test deleted successfully.', 'success');

    // Try the API in the background — restore if a real server error occurs
    try {
      const response = await apiService.deleteTest(deletingId);
      if (!response.success) {
        // API explicitly returned failure — restore the test
        await fetchDashboardData();
        showToastMessage(response.message || 'Delete failed on server. Test restored.', 'danger');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      // 404 = already gone, 2xx = success, anything else = real error
      if (status && status !== 404 && (status < 200 || status >= 300)) {
        await fetchDashboardData(); // restore list from API
        showToastMessage('Server error while deleting. Test restored.', 'danger');
      }
      // Otherwise treat as success (API may not support DELETE)
    }
  };

  // Helper to resolve Subject Name from UUID or string
  const getSubjectName = (subjectVal: string) => {
    const matched = subjects.find(s => s.id === subjectVal);
    return matched ? matched.name : subjectVal;
  };

  // Filter Logic
  const filteredTests = tests.filter(test => {
    // Search filter
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Subject filter
    const matchesSubject = selectedSubject === 'all' || 
      test.subject === selectedSubject || 
      getSubjectName(test.subject) === selectedSubject;
      
    // Status filter
    const statusVal = test.status || 'draft';
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'live' && statusVal === 'live') ||
      (selectedStatus === 'draft' && statusVal !== 'live');

    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Stats calculation
  const totalTests = tests.length;
  const liveTests = tests.filter(t => t.status === 'live').length;
  const draftTests = tests.filter(t => !t.status || t.status === 'draft').length;

  return (
    <div className="animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1000,
          padding: '16px 20px',
          borderRadius: 'var(--border-radius-sm)',
          backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          animation: 'slideUp 0.3s ease'
        }}>
          <AlertCircle size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {testToDelete && (
        <div className="modal-overlay" onClick={() => setTestToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Delete Test</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Are you sure you want to delete this test? This action cannot be undone.</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setTestToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}


      {/* Stats Summary Section */}
      <section className="dashboard-stats">
        <div className="card stat-card">
          <div className="stat-icon-wrapper primary">
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTests}</span>
            <span className="stat-label">Total Tests</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper success">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{liveTests}</span>
            <span className="stat-label">Live Tests</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper warning">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{draftTests}</span>
            <span className="stat-label">Draft Tests</span>
          </div>
        </div>
      </section>

      {/* Main Controls Section */}
      <section className="dashboard-controls">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search tests by name..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.name}>{subject.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="live">Live</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => navigate('/tests/new')}
        >
          <Plus size={18} />
          <span>Create New Test</span>
        </button>
      </section>

      {/* Error display */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fef2f2' }}>
          <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
          <span style={{ fontSize: '14px', color: '#991b1b' }}>{error}</span>
          <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '12px' }} onClick={fetchDashboardData}>Retry</button>
        </div>
      )}

      {/* Tests Table / List */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading tests list...</p>
        </div>
      ) : filteredTests.length > 0 ? (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Subject</th>
                  <th>Topics</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => {
                  const statusVal = test.status || 'draft';
                  const formattedDate = test.created_at 
                    ? new Date(test.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={test.id}>
                      <td>
                        <div className="test-name-cell">
                          <span className="test-title">{test.name}</span>
                          <span className="test-id-sub">ID: {test.id.substring(0, 8)}...</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {getSubjectName(test.subject)}
                        </span>
                      </td>
                      <td>
                        <div className="topics-list">
                          {test.topics && test.topics.length > 0 ? (
                            test.topics.slice(0, 3).map((topic, i) => (
                              <span key={i} className="topic-tag" title={topic}>
                                {topic}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>None</span>
                          )}
                          {test.topics && test.topics.length > 3 && (
                            <span className="topic-tag" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
                              +{test.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${statusVal === 'live' ? 'live' : 'draft'}`}>
                          {statusVal}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <Calendar size={14} />
                          <span>{formattedDate}</span>
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button 
                            className="action-btn"
                            title="View / Preview Test"
                            onClick={() => navigate(`/tests/${test.id}/preview`)}
                          >
                            <Eye size={15} />
                          </button>
                          
                          {statusVal !== 'live' ? (
                            <button 
                              className="action-btn"
                              title="Edit Test Details"
                              onClick={() => navigate(`/tests/${test.id}/edit`)}
                            >
                              <Edit2 size={15} />
                            </button>
                          ) : (
                            // Disabled or limited edit for live tests
                            <button 
                              className="action-btn"
                              style={{ opacity: 0.4, cursor: 'not-allowed' }}
                              title="Live tests cannot be edited"
                              disabled
                            >
                              <Edit2 size={15} />
                            </button>
                          )}

                          <button 
                            className="action-btn btn-delete"
                            title="Delete Test"
                            onClick={(e) => handleDeleteClick(test.id, e)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <FolderOpen size={28} />
          </div>
          <h3 className="empty-title">No tests found</h3>
          <p className="empty-subtitle">
            {searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all'
              ? "No tests match your search queries or filter selections."
              : "Get started by creating your first test structure and adding assessment items."}
          </p>
          {(searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all') ? (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedStatus('all');
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/tests/new')}
            >
              <Plus size={18} />
              <span>Create Your First Test</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default Dashboard;
