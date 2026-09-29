'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Sprint, SprintDocument, SprintDocumentType } from '@/types/database';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { Modal } from '@/components/ui/modal';
import { UserAvatar } from '@/components/ui/avatar';
import { SprintStatusBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { 
  FileText, Upload, Download, Trash2, Plus, 
  Search, Calendar, Eye, CheckCircle2, AlertCircle, 
  FlaskConical, Rocket, Cpu, FileCode, Satellite, 
  FolderArchive, File, X, Sparkles
} from 'lucide-react';

interface SprintDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint | null;
}

const DOCUMENT_TYPE_CONFIG: Record<SprintDocumentType, { label: string; icon: any; color: string; bg: string }> = {
  DESIGN_REVIEW: { label: 'Design Review', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  TEST_REPORT: { label: 'Test Report', icon: FlaskConical, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  SPECIFICATION: { label: 'Specification', icon: FileCode, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  FLIGHT_DOC: { label: 'Flight & Mission Doc', icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  SCHEMATIC: { label: 'Schematic / Hardware', icon: Cpu, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  MISSION_DOC: { label: 'Mission Telemetry', icon: Satellite, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  OTHER: { label: 'Deliverable', icon: FolderArchive, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const SprintDocumentsModal: React.FC<SprintDocumentsModalProps> = ({
  isOpen,
  onClose,
  sprint,
}) => {
  const { currentUser, sprintDocuments, uploadSprintDocument, deleteSprintDocument } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | SprintDocumentType>('ALL');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<SprintDocumentType>('SPECIFICATION');
  const [contentMode, setContentMode] = useState<'FILE' | 'TEXT'>('FILE');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview State
  const [previewDoc, setPreviewDoc] = useState<SprintDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = Boolean(currentUser.id);

  // Documents attached to this sprint
  const docsForSprint = useMemo(() => {
    if (!sprint) return [];
    return sprintDocuments.filter(d => d.sprint_id === sprint.id);
  }, [sprintDocuments, sprint]);

  const filteredDocs = useMemo(() => {
    return docsForSprint.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesDesc = d.description?.toLowerCase().includes(q);
        const matchesFile = d.file_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesFile) return false;
      }
      if (typeFilter !== 'ALL' && d.document_type !== typeFilter) return false;
      return true;
    });
  }, [docsForSprint, searchQuery, typeFilter]);

  if (!sprint) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 10MB for base64 database storage
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit for direct database storage.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file data.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    let finalData = fileBase64;
    let fileName = selectedFile?.name || null;
    let fileType = selectedFile?.type || null;
    let fileSize = selectedFile?.size || null;

    if (contentMode === 'TEXT') {
      if (!textContent.trim()) {
        setUploadError('Please enter document content or switch to file upload.');
        return;
      }
      // Encode text content as data URL
      finalData = `data:text/markdown;charset=utf-8,${encodeURIComponent(textContent)}`;
      fileName = `${title.trim().replace(/\s+/g, '_')}.md`;
      fileType = 'text/markdown';
      fileSize = new Blob([textContent]).size;
    } else {
      if (!finalData) {
        setUploadError('Please select a file to upload or switch to text editor mode.');
        return;
      }
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      await uploadSprintDocument({
        sprint_id: sprint.id,
        team_id: sprint.team_id,
        title: title.trim(),
        description: description.trim() || undefined,
        document_type: documentType,
        file_name: fileName || undefined,
        file_type: fileType || undefined,
        file_size: fileSize || undefined,
        file_data: finalData || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setFileBase64(null);
      setTextContent('');
      setShowUploadForm(false);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to store document in database.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: SprintDocument) => {
    if (!doc.file_data) return;
    const a = document.createElement('a');
    a.href = doc.file_data;
    a.download = doc.file_name || `${doc.title.replace(/\s+/g, '_')}.bin`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete deliverable "${docTitle}" from the database?`)) {
      return;
    }
    try {
      await deleteSprintDocument(docId);
    } catch (err: any) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <FolderArchive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Sprint Deliverables & Documents</h3>
            <p className="text-xs text-gray-500 font-normal">
              {sprint.name} • Stored directly in the database
            </p>
          </div>
        </div>
      }
      size="2xl"
      className="max-w-4xl w-full max-h-[90vh]"
    >
      <div className="space-y-5 py-2">
        {/* Sprint Context Header */}
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{sprint.name}</span>
              <SprintStatusBadge status={sprint.status} size="sm" />
              <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
              </span>
            </div>
            {sprint.goal && (
              <p className="text-xs text-gray-600 italic line-clamp-1">
                &quot;{sprint.goal}&quot;
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canUpload && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  showUploadForm
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showUploadForm ? 'Cancel Upload' : 'Upload Deliverable'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Form Card */}
        {showUploadForm && (
          <form onSubmit={handleUploadSubmit} className="p-5 bg-white border border-blue-200 rounded-xl shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Add Sprint Deliverable to Database</span>
              </h4>
              <span className="text-[10px] text-gray-400">Stores file as database record</span>
            </div>

            {uploadError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Design Review (CDR) Presentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Category
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as SprintDocumentType)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="DESIGN_REVIEW">📑 Design Review (PDR / CDR)</option>
                  <option value="TEST_REPORT">🧪 Test & Validation Report</option>
                  <option value="SPECIFICATION">📐 Technical Specification</option>
                  <option value="FLIGHT_DOC">🚀 Flight Readiness & Mission Doc</option>
                  <option value="SCHEMATIC">⚡ Hardware / PCB Schematic</option>
                  <option value="MISSION_DOC">🛰️ Mission Telemetry & Operations</option>
                  <option value="OTHER">📁 General Deliverable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description / Key Findings (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of deliverable, test outcomes, or specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Input Mode Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentMode('FILE')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    contentMode === 'FILE'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 bg-gray-100'
                  }`}
                >
                  Upload File (PDF, Word, Excel, Images, Code, ZIP)
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('TEXT')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    contentMode === 'TEXT'
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-500 hover:text-gray-900 bg-gray-100'
                  }`}
                >
                  Write Direct Markdown / Text Note
                </button>
              </div>

              {contentMode === 'FILE' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <File className="w-6 h-6 text-blue-600 shrink-0" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900 truncate max-w-sm">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary Document'}
                          </p>
                        </div>
                        <span className="text-[10px] text-blue-600 underline ml-2">Change</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                        <p className="text-xs font-medium text-gray-700">
                          Click to select a file from your computer
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Accepts PDF, DOCX, XLSX, PNG, JPG, MD, JSON, ZIP (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={6}
                    placeholder="# Deliverable Summary&#10;&#10;Document observations, telemetry formulas, or sprint review notes here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Saving to Database...' : 'Save Deliverable in Database'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deliverables by title or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              <option value="ALL">All Categories ({docsForSprint.length})</option>
              <option value="DESIGN_REVIEW">Design Reviews</option>
              <option value="TEST_REPORT">Test Reports</option>
              <option value="SPECIFICATION">Specifications</option>
              <option value="FLIGHT_DOC">Flight Docs</option>
              <option value="SCHEMATIC">Schematics</option>
              <option value="MISSION_DOC">Mission Telemetry</option>
              <option value="OTHER">Other Deliverables</option>
            </select>
          </div>
        </div>

        {/* Deliverables List */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center bg-gray-50/60 border border-dashed border-gray-200 rounded-xl space-y-2">
              <FolderArchive className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="text-xs font-semibold text-gray-700">No Sprint Deliverables Found</h4>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                {docsForSprint.length === 0
                  ? 'No documents have been attached to this sprint yet. Use the "Upload Deliverable" button above to store design reviews, test reports, and flight documents directly in the database.'
                  : 'No deliverables match your search and filter criteria.'}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const typeCfg = DOCUMENT_TYPE_CONFIG[doc.document_type] || DOCUMENT_TYPE_CONFIG.OTHER;
              const TypeIcon = typeCfg.icon;
              const canDeleteDoc = currentUser.id === doc.uploaded_by || 
                Permissions.isTeamLead(currentUser) || 
                Permissions.isOfficeBearer(currentUser) || 
                Permissions.isAdmin(currentUser);

              return (
                <div
                  key={doc.id}
                  className="p-4 bg-white border border-gray-200 hover:border-blue-300 rounded-xl shadow-xs transition-all hover:shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${typeCfg.bg} ${typeCfg.color}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {doc.title}
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeCfg.bg} ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                        </div>

                        {doc.description && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-1.5 flex-wrap">
                          {doc.file_name && (
                            <span className="flex items-center gap-1 text-gray-600 font-medium">
                              <File className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-xs">{doc.file_name}</span>
                            </span>
                          )}
                          {doc.file_size && (
                            <span>{formatBytes(doc.file_size)}</span>
                          )}
                          <span>• Uploaded {formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {doc.file_data && (
                        <>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                            title="Download document stored in database"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          {(doc.file_type?.startsWith('image/') || doc.file_type?.includes('text') || doc.file_type?.includes('json')) && (
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors"
                              title="Preview document content"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      {canDeleteDoc && (
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete deliverable from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Uploader Footer */}
                  {doc.uploader && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={doc.uploader} size="xs" />
                        <span className="font-medium text-gray-700">{doc.uploader.full_name}</span>
                        {doc.uploader.title && (
                          <span className="text-gray-400 hidden sm:inline">• {doc.uploader.title}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">Database Record</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inline Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          description={previewDoc.file_name || undefined}
          size="lg"
        >
          <div className="py-2">
            {previewDoc.file_type?.startsWith('image/') ? (
              <img
                src={previewDoc.file_data || ''}
                alt={previewDoc.title}
                className="max-h-[60vh] w-auto mx-auto rounded-lg object-contain shadow-xs"
              />
            ) : previewDoc.file_data?.startsWith('data:text') ? (
              <pre className="p-4 bg-gray-50 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[60vh] overflow-y-auto border border-gray-200 text-gray-800">
                {decodeURIComponent(previewDoc.file_data.split(',')[1] || '')}
              </pre>
            ) : (
              <p className="text-xs text-gray-500">Preview not available for this binary format. Please use Download.</p>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
};
