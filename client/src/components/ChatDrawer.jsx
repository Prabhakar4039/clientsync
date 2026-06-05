import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { X, Send, MessageSquare, Hash, FolderOpen, Users } from 'lucide-react';

const ChatDrawer = ({ isOpen, onClose }) => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'project'
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [teamMessages, setTeamMessages] = useState([
    {
      senderId: 'system',
      senderName: 'System Bot',
      senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
      text: 'Welcome to ClientSync General Team Chat! Use this space to collaborate in real-time.',
      createdAt: new Date(Date.now() - 3600000),
    },
  ]);
  const [projectMessages, setProjectMessages] = useState({});
  const messagesEndRef = useRef(null);

  // Fetch projects list for channel dropdown selection
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const res = await axios.get('/api/projects');
        if (res.data.success) {
          setProjects(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedProjectId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching chat projects:', err.message);
      }
    };
    fetchProjects();
  }, [user]);

  // Join sockets rooms
  useEffect(() => {
    if (!socket || !user) return;

    // Join general team channel
    socket.emit('join_team');

    // Join currently selected project channel
    if (selectedProjectId) {
      socket.emit('join_project', selectedProjectId);
      
      // Initialize message array for project if empty
      if (!projectMessages[selectedProjectId]) {
        setProjectMessages(prev => ({
          ...prev,
          [selectedProjectId]: [
            {
              senderId: 'system',
              senderName: 'Project Bot',
              senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=proj',
              text: 'Project channel initiated. Post updates, ask questions, or link deliverables here!',
              createdAt: new Date(Date.now() - 1800000),
            }
          ]
        }));
      }
    }
  }, [socket, user, selectedProjectId]);

  // Socket listener registration
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_team_message', (msg) => {
      setTeamMessages(prev => [...prev, msg]);
    });

    socket.on('receive_project_message', ({ projectId, messageData }) => {
      setProjectMessages(prev => {
        const currentMessages = prev[projectId] || [];
        return {
          ...prev,
          [projectId]: [...currentMessages, messageData],
        };
      });
    });

    return () => {
      socket.off('receive_team_message');
      socket.off('receive_project_message');
    };
  }, [socket]);

  // Scroll chat feed on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages, projectMessages, activeTab, selectedProjectId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !user) return;

    const messageData = {
      senderId: user._id,
      senderName: user.name,
      senderAvatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
      text: messageText,
      createdAt: new Date(),
    };

    if (activeTab === 'team') {
      socket.emit('send_team_message', messageData);
    } else {
      socket.emit('send_project_message', {
        projectId: selectedProjectId,
        messageData,
      });
    }

    setMessageText('');
  };

  const getActiveMessages = () => {
    if (activeTab === 'team') {
      return teamMessages;
    }
    return projectMessages[selectedProjectId] || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-80 sm:w-96 flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl transition-transform duration-300">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          <h3 className="font-bold text-zinc-900 dark:text-white font-display">Workspace Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 dark:text-zinc-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-1">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'team'
              ? 'bg-white dark:bg-zinc-800 text-indigo-500 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Team Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'project'
              ? 'bg-white dark:bg-zinc-800 text-indigo-500 dark:text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Project Chat</span>
        </button>
      </div>

      {/* Project selector dropdown (only if project tab active) */}
      {activeTab === 'project' && (
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-900">
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Active Channel Room:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full text-xs bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {projects.length === 0 && <option value="">No Active Projects</option>}
            {projects.map((proj) => (
              <option key={proj._id} value={proj._id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Chat messages feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40 dark:bg-zinc-950/20">
        {getActiveMessages().map((msg, idx) => {
          const isMe = msg.senderId === user?._id;
          return (
            <div key={idx} className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="h-8 w-8 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800 shrink-0"
              />
              <div className="flex flex-col max-w-[75%]">
                <span className={`text-[10px] text-zinc-500 mb-0.5 ${isMe ? 'text-right' : ''}`}>
                  {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : msg.senderId === 'system'
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800/80 italic text-center rounded-lg py-1 px-2.5 self-center'
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-800/60 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Message ${activeTab === 'team' ? 'team' : 'project'}...`}
            className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="rounded-xl bg-indigo-600 p-2.5 text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatDrawer;
