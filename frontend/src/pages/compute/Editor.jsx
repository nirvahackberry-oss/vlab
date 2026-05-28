import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Dialog,
  Snackbar,
  Alert
} from '@mui/material';
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdFormatAlignLeft,
  MdInsertDriveFile,
  MdSave,
  MdPlayArrow,
  MdFileUpload,
  MdHtml,
  MdCss,
  MdPowerSettingsNew,
  MdWarning,
  MdChevronRight,
  MdSchool,
  MdArrowBack,
  MdMenu,
  MdDownload
} from 'react-icons/md';
import { SiPython, SiJavascript } from 'react-icons/si';
import { FaJava } from 'react-icons/fa';

import Editor from '@monaco-editor/react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/Header';
// import ChemistryLab from '../../components/ChemistryLab';
import { fetchFileContent, fetchFiles, runFile, saveFile, deleteFile } from '../../services/ideService';

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'py': return <SiPython className="text-[#3776AB] shrink-0" />;
    case 'js':
    case 'jsx': return <SiJavascript className="text-[#F7DF1E] shrink-0" />;
    case 'html': return <MdHtml className="text-orange-500 shrink-0" />;
    case 'css': return <MdCss className="text-blue-300 shrink-0" />;
    case 'java': return <FaJava className="text-[#007396] shrink-0" />;
    default: return <MdInsertDriveFile className="text-slate-400 shrink-0" />;
  }
};

const detectLanguage = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'py') return 'python';
  if (ext === 'java') return 'java';
  if (ext === 'html') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js' || ext === 'jsx') return 'javascript';
  return 'text';
};

const CloudEditor = ({ onMenuClick, session: propSession, hideHeader, onStopLab, onBack }) => {
  const location = useLocation();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(-1);
  const [labId, setLabId] = useState('');

  const isPythonLab = () => {
    const params = new URLSearchParams(location.search);
    const lid = params.get('labId')?.toLowerCase() || propSession?.labId?.toLowerCase() || labId?.toLowerCase() || '';
    return lid.includes('python');
  };

  const isJavaLab = () => {
    const params = new URLSearchParams(location.search);
    const lid = params.get('labId')?.toLowerCase() || propSession?.labId?.toLowerCase() || labId?.toLowerCase() || '';
    return lid.includes('java');
  };

  const isNoAutoSaveLab = () => {
    return isPythonLab() || isJavaLab();
  };
  const [loadedPaths, setLoadedPaths] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [webPreviewCode, setWebPreviewCode] = useState('');
  const [rightPanelTab, setRightPanelTab] = useState('preview');
  const [sessionId, setSessionId] = useState('');
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionMsg, setRestrictionMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDeleteIndex, setFileToDeleteIndex] = useState(-1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [forcedLabType, setForcedLabType] = useState(null);
  const [showStopModal, setShowStopModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeView, setActiveView] = useState('code'); // 'code' or 'output'
  const [openFilePaths, setOpenFilePaths] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSessionId = params.get('sessionId');
    const finalSessionId = propSession?.sessionId || urlSessionId || '';
    const lid = params.get('labId')?.toLowerCase() || propSession?.labId?.toLowerCase() || '';
    const currentLabId = forcedLabType || lid;

    if (finalSessionId) {
      setSessionId(finalSessionId);
      setLabId(currentLabId);
    }
  }, [propSession, location.search, forcedLabType]);

  useEffect(() => {
    let isMounted = true;
    const loadFiles = async () => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const response = await fetchFiles(sessionId);
        if (isMounted && response.success) {
          // Strict Filtering: Only show files relevant to the lab type
          const filteredFiles = response.files.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            if (isPythonLab()) return ext === 'py';
            if (isJavaLab()) return ext === 'java';
            return true;
          });
          setFiles(filteredFiles);
          setOpenFilePaths(filteredFiles.map(f => f.path));
          if (filteredFiles.length > 0 && activeFileIndex === -1) {
            setActiveFileIndex(0);
          }
        }
      } catch (err) {
        console.error('Load files error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadFiles();
    return () => { isMounted = false; };
  }, [sessionId, labId]);

  useEffect(() => {
    let isMounted = true;
    const loadActiveFile = async () => {
      if (activeFileIndex < 0 || !files[activeFileIndex] || !sessionId) return;
      const file = files[activeFileIndex];
      if (!file || loadedPaths.has(file.path)) return;

      try {
        const response = await fetchFileContent(file.path, sessionId);
        if (isMounted && response.success) {
          const newFiles = [...files];
          newFiles[activeFileIndex].content = response.content || '';
          setFiles(newFiles);
          setLoadedPaths(prev => new Set(prev).add(file.path));
        }
      } catch (err) {
        console.error('Content load error:', err);
      }
    };
    loadActiveFile();
  }, [activeFileIndex, sessionId, loadedPaths]);

  // Debounced Auto-save
  useEffect(() => {
    if (activeFileIndex === -1 || !files[activeFileIndex]) return;

    // For Python and Java labs: stop unnecessary call of save file
    if (isNoAutoSaveLab()) return;

    const timeout = setTimeout(() => {
      handleSave(false);
    }, 1500); // Auto-save after 1.5 seconds of inactivity

    return () => clearTimeout(timeout);
  }, [files, activeFileIndex, labId]);

  const activeFile = files[activeFileIndex];

  const handleFormat = () => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    const language = model.getLanguageId();

    // Attempt built-in Monaco formatting first (works for HTML/CSS/JS)
    const action = editorRef.current.getAction('editor.action.formatDocument');
    if (action && (language === 'javascript' || language === 'html' || language === 'css')) {
      action.run();
    } else {
      // Ultimate Code Formatter for Python, Java, C++
      const value = editorRef.current.getValue();
      if (!value) return;

      const lines = value.split('\n');
      let indent = 0;
      let inMultiLineString = false;

      const formatted = lines.map(line => {
        const trimmed = line.trim();

        // 1. Handle Multi-line Strings/Docstrings (Python """ or ''')
        if (trimmed.includes('"""') || trimmed.includes("'''")) {
          const count = (trimmed.match(/\"\"\"|\'\'\'/g) || []).length;
          if (count % 2 !== 0) inMultiLineString = !inMultiLineString;
          if (inMultiLineString) return line; // Preserve internal string formatting
        }
        if (inMultiLineString) return line;

        // 2. Handle Empty Lines
        if (trimmed.length === 0) return '';

        // 3. Python/Java Specific: Decrease Indent for specific keywords/symbols
        // Symbols: } ] )
        // Python Keywords: elif, else, except, finally
        const isClosingSymbol = trimmed.match(/^[\}\]\)]/);
        const isPythonDeIndent = trimmed.match(/^(elif|else|except|finally)\b/);

        if (isClosingSymbol || isPythonDeIndent) {
          indent = Math.max(0, indent - 1);
        }

        // 4. Apply Indent (Standard 4 Spaces)
        const formattedLine = ' '.repeat(indent * 4) + trimmed;

        // 5. Increase Indent for next line
        // Symbols: { [ (
        // Python: Lines ending with :
        const isOpeningSymbol = trimmed.match(/[\{\[\(]$/);
        const isPythonBlock = trimmed.match(/:$/);

        if (isOpeningSymbol || isPythonBlock) {
          indent++;
        }

        return formattedLine;
      }).join('\n').replace(/\n{3,}/g, '\n\n');

      // Apply changes with Undo Support
      editorRef.current.executeEdits('py-formatter', [{
        range: model.getFullModelRange(),
        text: formatted,
        forceMoveMarkers: true
      }]);

      // Feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  const handleSave = async (showFeedback = true) => {
    if (!activeFile || !sessionId) return;
    setIsSaving(true);
    try {
      await saveFile(activeFile, sessionId);

      // Trigger download to PC ONLY on manual click (when showFeedback is true)
      if (showFeedback) {
        const blob = new Blob([activeFile.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = activeFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSaveSuccess(true);
        setShowSaveToast(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!activeFile || !sessionId) return;
    setIsRunning(true);
    setWebPreviewCode(`
      <html>
        <body style="background:#1e1e1e;color:#569cd6;font-family:monospace;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
          <div style="width:30px;height:30px;border:3px solid #333;border-top:3px solid #f44336;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:15px;"></div>
          <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
          <div style="text-transform:uppercase;letter-spacing:1px;font-size:12px;">Executing Code...</div>
        </body>
      </html>
    `);

    const bypassSaveBeforeRun = isNoAutoSaveLab();
    if (!bypassSaveBeforeRun) {
      // Auto-save silently before running for other labs
      await handleSave(false);
    }

    try {
      const payload = bypassSaveBeforeRun
        ? { path: activeFile.path, language: activeFile.language, content: activeFile.content }
        : { path: activeFile.path, language: activeFile.language };

      const response = await runFile(payload, sessionId);
      if (response.success) {
        setRightPanelTab('preview');
        const outputHtml = `
          <html>
            <body style="font-family:'Fira Code', monospace; background:#fff; color:#333; padding:20px; margin:0; line-height:1.5;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <span style="color:#d32f2f; font-weight:900; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Terminal Output</span>
              </div>
              <pre style="background:#f9f9f9; padding:16px; border-radius:12px; border:1px solid #eee; font-size:13px; white-space:pre-wrap; word-break:break-word; margin:0; color:#444;">${response.output || '(No output)'}</pre>
              
              ${response.error ? `
                <div style="display:flex; align-items:center; gap:8px; margin-top:25px; margin-bottom:15px; border-bottom:1px solid #fee2e2; padding-bottom:10px;">
                  <span style="color:#ef4444; font-weight:900; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Errors Detected</span>
                </div>
                <pre style="background:#fff5f5; padding:16px; color:#b91c1c; border:1px solid #fecaca; border-radius:12px; font-size:13px; white-space:pre-wrap; word-break:break-all; margin:0;">${response.error}</pre>
              ` : ''}
            </body>
          </html>
        `;
        setWebPreviewCode(outputHtml);
      } else {
        setRightPanelTab('preview');
        const errorHtml = `
          <html>
            <body style="font-family:'Fira Code', monospace; background:#fff; color:#333; padding:20px; margin:0; line-height:1.5;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:15px; border-bottom:1px solid #fee2e2; padding-bottom:10px;">
                <span style="color:#ef4444; font-weight:900; font-size:11px; letter-spacing:1px; text-transform:uppercase;">Execution Failed</span>
              </div>
              <pre style="background:#fff5f5; padding:16px; color:#b91c1c; border:1px solid #fecaca; border-radius:12px; font-size:13px; white-space:pre-wrap; word-break:break-all; margin:0;">${response.error || 'An unexpected execution error occurred.'}</pre>
            </body>
          </html>
        `;
        setWebPreviewCode(errorHtml);
      }
    } catch (err) {
      console.error('Run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddFile = async () => {
    if (openFilePaths.length >= 8) {
      setRestrictionMsg('Maximum of 8 files can be open in the tabs at the same time. Please close some tabs first.');
      setShowRestrictionModal(true);
      return;
    }

    const defaultName = isJavaLab() ? 'Main.java' : (isPythonLab() ? 'script.py' : 'script.txt');
    const fileName = window.prompt(`Enter file name (e.g. ${defaultName}):`, defaultName);
    if (!fileName) return;
    const ext = fileName.split('.').pop().toLowerCase();

    if (isPythonLab() && ext !== 'py') {
      setRestrictionMsg('This is a Python lab environment. You can only create or add .py files.');
      setShowRestrictionModal(true);
      return;
    }
    if (isJavaLab() && ext !== 'java') {
      setRestrictionMsg('This is a Java lab environment. You can only create or add .java files.');
      setShowRestrictionModal(true);
      return;
    }

    const newFile = { name: fileName, path: `/workspace/${fileName}`, type: 'file', language: detectLanguage(fileName), content: '' };
    if (sessionId) {
      // 1. Immediately update UI state
      setFiles(prev => {
        if (prev.some(f => f.path === newFile.path)) {
          const idx = prev.findIndex(f => f.path === newFile.path);
          setActiveFileIndex(idx);
          return prev;
        }
        const updated = [...prev, newFile];
        setActiveFileIndex(updated.length - 1);
        return updated;
      });

      setOpenFilePaths(prev => {
        if (prev.includes(newFile.path)) return prev;
        return [...prev, newFile.path];
      });

      setLoadedPaths(prev => {
        const next = new Set(prev);
        next.add(newFile.path);
        return next;
      });

      // 2. Call Save API in background
      try {
        await saveFile(newFile, sessionId);
      } catch (err) {
        console.error('Failed to save newly added file on backend:', err);
      }

      // 3. Sync from backend
      try {
        const res = await fetchFiles(sessionId);
        if (res.success) {
          const filteredFiles = res.files.filter(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            if (isPythonLab()) return ext === 'py';
            if (isJavaLab()) return ext === 'java';
            return true;
          });

          setFiles(prev => {
            const merged = filteredFiles.map(newF => {
              const existingF = prev.find(oldF => oldF.path === newF.path);
              if (existingF) {
                return { ...newF, content: existingF.content };
              }
              return newF;
            });
            if (!merged.some(f => f.path === newFile.path)) {
              merged.push(newFile);
            }
            return merged;
          });

          setFiles(currentFiles => {
            const idx = currentFiles.findIndex(f => f.path === newFile.path);
            if (idx !== -1) {
              setActiveFileIndex(idx);
            }
            return currentFiles;
          });
        }
      } catch (err) {
        console.error('Fetch files after add error:', err);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const filePath = `/workspace/${file.name}`;
    const exists = files.some(f => f.path === filePath);
    if (!exists && files.length >= 5) {
      setRestrictionMsg('Workspace Limit Reached: You can have a maximum of 5 files in the workspace.');
      setShowRestrictionModal(true);
      return;
    }

    if (!openFilePaths.includes(filePath) && openFilePaths.length >= 8) {
      setRestrictionMsg('Maximum of 8 files can be open in the tabs at the same time. Please close some tabs first.');
      setShowRestrictionModal(true);
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();

    if (isPythonLab() && ext !== 'py') {
      setRestrictionMsg('Strict Restriction: Only .py files are permitted in the Python workspace.');
      setShowRestrictionModal(true);
      return;
    }
    if (isJavaLab() && ext !== 'java') {
      setRestrictionMsg('Strict Restriction: Only .java files are permitted in the Java workspace.');
      setShowRestrictionModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target.result;
      const newFile = { name: file.name, path: `/workspace/${file.name}`, type: 'file', language: detectLanguage(file.name), content: fileContent };
      if (sessionId) {
        // 1. Immediately update UI state
        setFiles(prev => {
          const existingIdx = prev.findIndex(f => f.path === newFile.path);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = newFile;
            setActiveFileIndex(existingIdx);
            return updated;
          }
          const updated = [...prev, newFile];
          setActiveFileIndex(updated.length - 1);
          return updated;
        });

        setOpenFilePaths(prev => {
          if (prev.includes(newFile.path)) return prev;
          return [...prev, newFile.path];
        });

        setLoadedPaths(prev => {
          const next = new Set(prev);
          next.add(newFile.path);
          return next;
        });

        // 2. Call Save API in background
        try {
          await saveFile(newFile, sessionId);
        } catch (err) {
          console.error('Failed to save uploaded file on backend:', err);
        }

        // 3. Sync from backend
        try {
          const res = await fetchFiles(sessionId);
          if (res.success) {
            const filteredFiles = res.files.filter(f => {
              const ext = f.name.split('.').pop().toLowerCase();
              if (isPythonLab()) return ext === 'py';
              if (isJavaLab()) return ext === 'java';
              return true;
            });

            setFiles(prev => {
              const merged = filteredFiles.map(newF => {
                const existingF = prev.find(oldF => oldF.path === newF.path);
                if (existingF) {
                  return { ...newF, content: existingF.content };
                }
                return newF;
              });

              const localIdx = merged.findIndex(f => f.path === newFile.path);
              if (localIdx === -1) {
                merged.push(newFile);
                setActiveFileIndex(merged.length - 1);
              } else {
                merged[localIdx].content = fileContent;
                setActiveFileIndex(localIdx);
              }
              return merged;
            });
          }
        } catch (err) {
          console.error('Sync files after upload error:', err);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteFile = (index) => {
    setFileToDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const handleCloseFile = (path) => {
    setOpenFilePaths(prev => {
      const next = prev.filter(p => p !== path);
      const closedFileIdx = files.findIndex(f => f.path === path);
      if (activeFileIndex === closedFileIdx) {
        if (next.length > 0) {
          const newActivePath = next[next.length - 1];
          const newActiveIdx = files.findIndex(f => f.path === newActivePath);
          setActiveFileIndex(newActiveIdx);
        } else {
          setActiveFileIndex(-1);
        }
      }
      return next;
    });
  };

  const confirmDeleteFile = async () => {
    const file = files[fileToDeleteIndex];
    if (!file || !sessionId) return;
    try {
      await deleteFile(file.path, sessionId);
      const newFiles = files.filter((_, i) => i !== fileToDeleteIndex);
      
      setOpenFilePaths(prev => {
        const next = prev.filter(p => p !== file.path);
        if (activeFileIndex === fileToDeleteIndex) {
          if (next.length > 0) {
            const newActivePath = next[next.length - 1];
            const newActiveIdx = newFiles.findIndex(f => f.path === newActivePath);
            setActiveFileIndex(newActiveIdx);
          } else {
            setActiveFileIndex(-1);
          }
        } else if (activeFileIndex > fileToDeleteIndex) {
          setActiveFileIndex(prevIdx => prevIdx - 1);
        }
        return next;
      });

      setFiles(newFiles);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setShowDeleteModal(false);
      setFileToDeleteIndex(-1);
    }
  };

  if (isLoading && !sessionId) {
    return (
      <Box className="h-full w-full bg-[#1e1e1e] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-red-600 rounded-full animate-spin"></div>
        <Typography className="text-white/40 text-xs uppercase tracking-widest font-black">Connecting to IDE...</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden select-none">
        {/* {!hideHeader && <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Ignito Cloud IDE" />} */}

        <Box className="flex-1 flex overflow-hidden">
          {/* Activity Bar
          <Box className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 shrink-0 border-r border-black/20">
            <IconButton
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 transition-colors ${isSidebarOpen ? '!text-white' : '!text-white/40 hover:!text-white'}`}
            >
              <MdInsertDriveFile size={24} />
            </IconButton>
          </Box>
          */}

          {/* Sidebar Overlay for Mobile */}
          {isMobile && isSidebarOpen && (
            <Box
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
          )}

          {/* Sidebar */}
          {isSidebarOpen && (
            <Box
              className={`
        ${isMobile
                  ? 'fixed left-0 top-0 bottom-0 z-50 w-[260px]'
                  : 'w-[240px]'
                }
        bg-[#252526]
        border-r border-[#1f1f1f]
        flex flex-col
        shrink-0
      `}
            >

              {/* SIDEBAR HEADER */}
              <Box className="h-11 px-4 flex items-center justify-between border-b border-[#1f1f1f]">
                <Typography className="text-[11px] text-white/60 uppercase font-bold tracking-widest">
                  Explorer
                </Typography>

                <Box className="flex items-center gap-1">

                  <IconButton
                    onClick={handleAddFile}
                    size="small"
                    className="!text-white/70 hover:!bg-white/10"
                  >
                    <MdAdd size={18} />
                  </IconButton>

                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                    className="!text-white/70 hover:!bg-white/10"
                  >
                    <MdFileUpload size={17} />
                  </IconButton>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </Box>
              </Box>

              {/* WORKSPACE TITLE */}
              <Box className="px-3 py-2 border-b border-[#1f1f1f]">
                <Typography className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                  Workspace
                </Typography>
              </Box>

              {/* FILES */}
              <Box className="flex-1 overflow-y-auto py-2">

                {files.map((file, i) => (
                  <Box
                    key={file.path}
                    onClick={() => {
                      if (!openFilePaths.includes(file.path)) {
                        if (openFilePaths.length >= 8) {
                          setRestrictionMsg('Maximum of 8 files can be open in the tabs at the same time. Please close some tabs first.');
                          setShowRestrictionModal(true);
                          return;
                        }
                        setOpenFilePaths(prev => [...prev, file.path]);
                      }
                      setActiveFileIndex(i);

                      if (isMobile) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`
              group
              flex items-center gap-2
              px-3 py-1.5
              cursor-pointer
              border-l-2
              transition-all

              ${activeFileIndex === i
                        ? 'bg-[#37373d] border-l-blue-500 text-white'
                        : 'border-l-transparent text-slate-400 hover:bg-[#2a2d2e] hover:text-white'
                      }
            `}
                  >

                    {getFileIcon(file.name)}

                    <Typography className="text-[12px] truncate flex-1">
                      {file.name}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 !text-slate-400 hover:!text-red-500 !p-[2px]"
                    >
                      <MdClose size={12} />
                    </IconButton>

                  </Box>
                ))}

              </Box>
            </Box>
          )}


          {/* Workspace */}
          <Box className="flex-1 flex flex-col min-w-0">
            <Box className="h-9 bg-[#2d2d2d] flex items-center justify-between shrink-0 border-b border-black/40">
              <Box className="flex h-full items-center flex-1 min-w-0">
                <IconButton
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  size="small"
                  className="!text-white/60 hover:!text-white px-2 rounded-none h-full border-r border-black/20"
                >
                  <MdMenu size={18} />
                </IconButton>
                <Box className="flex h-full overflow-x-auto no-scrollbar flex-1">
                  {openFilePaths.map((path) => {
                    const file = files.find(f => f.path === path);
                    if (!file) return null;
                    const fileIdx = files.findIndex(f => f.path === path);
                    const isActive = activeFileIndex === fileIdx;
                    return (
                      <Box
                        key={file.path}
                        onClick={() => setActiveFileIndex(fileIdx)}
                        className={`h-full flex items-center gap-2 px-4 cursor-pointer border-r border-black/20 min-w-[120px] transition-all ${isActive ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-white/40 hover:bg-[#1e1e1e]'}`}
                      >
                        {getFileIcon(file.name)}
                        <Typography className="text-[12px] truncate">{file.name}</Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseFile(file.path);
                          }}
                          className="ml-auto p-0.5 hover:bg-white/10 rounded !text-white"
                        >
                          <MdClose size={12} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <Box className="flex items-center gap-1 px-2 shrink-0 min-w-fit">
                <IconButton
                  onClick={() => handleSave(true)}
                  size="small"
                  className="!text-blue-500 hover:!bg-blue-500/10"
                  title="Download File"
                >
                  <MdDownload size={18} />
                </IconButton>
                <Button onClick={handleRun} variant="contained" size="small" className="!bg-red-600 !text-[9px] md:!text-[10px] !font-black h-7 md:h-6 px-2 md:px-3 min-w-[50px] md:min-w-[64px] rounded shadow-lg shadow-red-600/20" startIcon={!isMobile && <MdPlayArrow />}>RUN</Button>
                <Box className="flex items-center gap-1">
                  {onBack && <IconButton onClick={onBack} size="small" className="!text-red-500 p-1" title="Back"><MdArrowBack size={18} /></IconButton>}
                  {onStopLab && (
                    <IconButton
                      onClick={() => setShowStopModal(true)}
                      size="small"
                      className="!text-red-500 p-1"
                      title="Stop Lab"
                    >
                      <MdPowerSettingsNew size={18} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            <Box className="flex-1 flex overflow-hidden">
              <Box className={`flex-1 flex flex-col min-w-0 ${isMobile && activeView !== 'code' ? 'hidden' : 'flex'}`}>
                <Box className="h-8 bg-[#252526] flex md:hidden items-center border-b border-black/20">
                  <Button
                    onClick={() => setActiveView('code')}
                    className={`flex-1 !text-[10px] !font-black h-full rounded-none ${activeView === 'code' ? '!bg-[#1e1e1e] !text-red-500 border-b-2 border-red-500' : '!text-white/40'}`}
                  >
                    EDITOR
                  </Button>
                  <Button
                    onClick={() => setActiveView('output')}
                    className={`flex-1 !text-[10px] !font-black h-full rounded-none ${activeView === 'output' ? '!bg-[#1e1e1e] !text-red-500 border-b-2 border-red-500' : '!text-white/40'}`}
                  >
                    OUTPUT
                  </Button>
                </Box>
                {activeFile ? (
                  <Editor
                    key={activeFile.path}
                    height="100%"
                    theme="vs-dark"
                    language={activeFile.language}
                    value={activeFile.content}
                    onMount={(e) => editorRef.current = e}
                    onChange={(v) => {
                      const n = [...files];
                      n[activeFileIndex].content = v;
                      setFiles(n);
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      automaticLayout: true,
                      fontFamily: 'Fira Code, monospace',
                      formatOnType: true,
                      autoIndent: 'full',
                      tabSize: 4,
                      padding: {
                        top: 0
                      },
                      lineNumbersMinChars: 2,
                      glyphMargin: false,
                      folding: false,
                      lineDecorationsWidth: 0,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                ) : (
                  <Box className="h-full flex flex-col items-center justify-center text-white/10 gap-6 bg-[#1e1e1e]">
                    <Box className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shadow-2xl">
                      <MdInsertDriveFile size={40} />
                    </Box>
                    <div className="text-center space-y-4">
                      <Typography className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Select a file to begin coding</Typography>
                      <Button
                        onClick={handleAddFile}
                        variant="outlined"
                        className="!border-white/10 !text-white/60 !text-[10px] !font-black !px-6 !py-2 !rounded-xl hover:!bg-white/5 uppercase tracking-widest"
                        startIcon={<MdAdd />}
                      >
                        Create New File
                      </Button>
                    </div>
                  </Box>
                )}
              </Box>
              <Box className={`${isMobile ? (activeView === 'output' ? 'flex-1' : 'hidden') : 'w-[420px] hidden xl:flex'} bg-white flex flex-col shrink-0 border-l border-black/20`}>
                <Box className="flex bg-[#f3f3f3] border-b border-[#e5e5e5]">
                  <Button onClick={() => setRightPanelTab('preview')} className={`flex-1 !rounded-none !py-3 !text-[10px] !font-black uppercase tracking-widest ${rightPanelTab === 'preview' ? '!text-red-600 !border-b-2 !border-red-600 !bg-white' : '!text-slate-400'}`}>Preview</Button>
                </Box>
                <Box className="flex-1 overflow-auto relative bg-[#f9f9f9]">
                  {rightPanelTab === 'preview' && (
                    <iframe title="p" srcDoc={webPreviewCode} className="w-full h-full border-none" />
                  )}

                  {rightPanelTab === 'simulation' && (
                    <Box className="h-full bg-slate-900 overflow-auto">
                      {(labId.includes('chemistry') || labId.includes('chem')) ? (
                        <ChemistryLab onComplete={() => onStopLab && onStopLab()} />
                      ) : (labId.includes('physics') || labId.includes('phy')) ? (
                        <Box className="p-8 space-y-6">
                          <Box className="flex justify-between items-center"><Typography className="text-white text-[12px] font-black uppercase tracking-widest">Physics: Circuit Sandbox</Typography></Box>
                          <Box className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                              <Box key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
                                <Box className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20">{i === 1 ? '🔋' : i === 2 ? '💡' : i === 3 ? '🔌' : '⏲️'}</Box>
                                <Typography className="text-white/60 text-[10px] font-black uppercase tracking-tighter">{i === 1 ? 'Battery' : i === 2 ? 'Bulb' : i === 3 ? 'Switch' : 'Ammeter'}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <Box className="h-full flex flex-col items-center justify-center text-white/20 gap-6 p-8">
                          <MdSchool size={48} className="opacity-20" />
                          <Typography className="text-[11px] font-black uppercase tracking-[0.2em]">Simulation: {labId}</Typography>
                        </Box>
                      )}
                    </Box>
                  )}


                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Modals */}
        <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} PaperProps={{ className: "bg-[#1e1e1e] border border-white/10 rounded-2xl p-2", style: { backgroundColor: '#1e1e1e', borderRadius: '16px', color: 'white' } }}>
          <Box className="p-8 flex flex-col items-center gap-6 text-center max-w-[320px]">
            <Box className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 border border-red-600/20"><MdDelete size={32} /></Box>
            <div className="space-y-2"><Typography className="font-black uppercase tracking-tighter text-xl">Delete File?</Typography><Typography className="text-slate-400 text-[13px]">This will permanently remove <b>{files[fileToDeleteIndex]?.name}</b> from the cloud workspace.</Typography></div>
            <Box className="flex gap-3 w-full mt-2"><Button onClick={() => setShowDeleteModal(false)} className="flex-1 !bg-white/5 !text-slate-400 !font-black !text-[11px] !py-3 !rounded-xl uppercase tracking-widest">Cancel</Button><Button onClick={confirmDeleteFile} className="flex-1 !bg-red-600 !text-white !font-black !text-[11px] !py-3 !rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20">Delete</Button></Box>
          </Box>
        </Dialog>
        <Dialog open={showRestrictionModal} onClose={() => setShowRestrictionModal(false)} PaperProps={{ className: "bg-[#1e1e1e] border border-white/10 rounded-2xl p-2", style: { backgroundColor: '#1e1e1e', borderRadius: '16px', color: 'white' } }}>
          <Box className="p-8 flex flex-col items-center gap-6 text-center max-w-[320px]">
            <Box className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 border border-red-600/20"><MdWarning size={32} /></Box>
            <div className="space-y-2"><Typography className="font-black uppercase tracking-tighter text-xl">Restriction</Typography><Typography className="text-slate-400 text-[13px] leading-relaxed">{restrictionMsg}</Typography></div>
            <Button onClick={() => setShowRestrictionModal(false)} className="w-full !bg-red-600 !text-white !font-black !text-[11px] !py-4 !rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20">Understood</Button>
          </Box>
        </Dialog>

        {/* Stop Lab Confirmation Popup */}
        <Dialog
          open={showStopModal}
          onClose={() => setShowStopModal(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            style: { backgroundColor: '#1a1a2e', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }
          }}
        >
          <Box className="p-8 flex flex-col items-center gap-6 text-center">
            <Box className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
              <MdPowerSettingsNew size={32} className="text-red-500" />
            </Box>
            <div className="space-y-2">
              <Typography className="font-black text-xl uppercase tracking-tight">Stop Lab?</Typography>
              <Typography className="text-slate-400 text-[13px] leading-relaxed">
                Are you sure you want to stop the lab? Any unsaved progress may be lost.
              </Typography>
            </div>
            <Box className="flex flex-col gap-3 w-full mt-2">
              <Button
                onClick={() => { setShowStopModal(false); onStopLab && onStopLab(); }}
                className="w-full !py-4 !rounded-xl !bg-red-600 hover:!bg-red-700 !text-white !font-black !text-[11px] uppercase tracking-widest shadow-lg shadow-red-600/20"
              >
                Stop Lab
              </Button>
              <Button
                onClick={() => setShowStopModal(false)}
                className="w-full !py-4 !rounded-xl !bg-white/5 hover:!bg-white/10 !text-slate-400 !font-black !text-[11px] uppercase tracking-widest"
              >
                Return to Editor
              </Button>
            </Box>
          </Box>
        </Dialog>

        <Snackbar
          open={showSaveToast}
          autoHideDuration={3000}
          onClose={() => setShowSaveToast(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSaveToast(false)} severity="success" variant="filled" sx={{ width: '100%', bgcolor: '#10b981', fontWeight: 'bold' }}>
            Prectical Saved Successfully!
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default CloudEditor;
