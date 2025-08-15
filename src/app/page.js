'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import ChatList from '@/components/ChatList';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeUser, setActiveUser] = useState('hitesh');

  // Separate message history for each user
  const [conversations, setConversations] = useState({
    hitesh: [],
    piyush: [],
  });

  const users = {
    hitesh: {
      id: 'hitesh',
      name: 'Hitesh Choudhary',
      avatar: '/hitesh.jpg',
      lastSeen: 'online',
      color: 'bg-orange-500',
    },
    piyush: {
      id: 'piyush',
      name: 'Piyush Garg',
      avatar: '/piyush.jpg',
      lastSeen: 'online',
      color: 'bg-blue-500',
    },
  };

  const addMessage = (userId, message, isUser = false, isStreaming = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text: message,
      isUser,
      timestamp: new Date(),
      isStreaming,
    };

    setConversations((prev) => ({
      ...prev,
      [userId]: [...prev[userId], newMessage],
    }));

    return newMessage.id;
  };

  const updateStreamingMessage = (userId, messageId, newText) => {
    setConversations((prev) => ({
      ...prev,
      [userId]: prev[userId].map((msg) =>
        msg.id === messageId ? { ...msg, text: newText } : msg
      ),
    }));
  };

  const handleStreamChat = async () => {
    if (!prompt.trim()) return;

    setLoading(true);

    // Add user message
    addMessage(activeUser, prompt, true);
    const currentPrompt = prompt;
    setPrompt('');

    // Add empty streaming message
    const streamingMessageId = addMessage(activeUser, '', false, true);
    let streamingText = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: currentPrompt,
          user: activeUser,
          previousMessages: conversations[activeUser].map((m) => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const decoder = new TextDecoder();
      const reader = res.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith(`data: `)) {
            const data = JSON.parse(line.slice(6));
            streamingText += data.content;
            updateStreamingMessage(
              activeUser,
              streamingMessageId,
              streamingText
            );
          }
        }
      }
    } catch (error) {
      updateStreamingMessage(activeUser, streamingMessageId, 'ERROR: ' + error);
    } finally {
      setLoading(false);
      // Mark message as no longer streaming
      setConversations((prev) => ({
        ...prev,
        [activeUser]: prev[activeUser].map((msg) =>
          msg.id === streamingMessageId ? { ...msg, isStreaming: false } : msg
        ),
      }));
    }
  };

  const switchUser = (userId) => {
    setActiveUser(userId);
  };

  const currentUser = users[activeUser];
  const currentMessages = conversations[activeUser] || [];

  return (
    <div className='flex h-screen bg-gray-100'>
      {/* Sidebar */}
      <div className='w-1/3 bg-white border-r border-gray-200 flex flex-col'>
        <Header />

        {/* Chat list */}
        <ChatList
          users={users}
          switchUser={switchUser}
          conversations={conversations}
          activeUser={activeUser}
        />
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Chat Header */}
        <div className='bg-gray-50 px-6 py-3 border-b border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div
              className={`w-10 h-10 ${currentUser.color} rounded-full flex items-center justify-center`}
            >
              <Image
                alt={currentUser.name}
                width={100}
                height={100}
                src={currentUser.avatar}
                className='text-white font-semibold text-sm rounded-full'
              />
            </div>
            <div>
              <h2 className='text-gray-800 font-medium'>{currentUser.name}</h2>
              <p className='text-xs text-gray-500'>{currentUser.lastSeen}</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className='flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4'
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Ccircle cx="50" cy="50" r="0.5" fill="%23000" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grain)"/%3E%3C/svg%3E")',
          }}
        >
          {currentMessages.length === 0 && (
            <div className='flex justify-center items-center h-full'>
              <div className='text-center'>
                <div
                  className={`w-16 h-16 ${currentUser.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <Image
                    alt={currentUser.name}
                    width={100}
                    height={100}
                    src={currentUser.avatar}
                    className='text-white font-semibold text-sm rounded-full'
                  />
                </div>
                <h3 className='text-lg font-medium text-gray-700'>
                  {currentUser.name}
                </h3>
                <p className='text-sm text-gray-500'>Start a conversation</p>
              </div>
            </div>
          )}

          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isUser
                    ? 'bg-green-500 text-white'
                    : 'bg-white shadow-sm text-gray-800'
                }`}
              >
                <div className='prose prose-sm max-w-none'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return inline ? (
                          <code className='bg-gray-200 px-1 rounded' {...props}>
                            {children}
                          </code>
                        ) : (
                          <pre className='bg-gray-100 p-2 rounded overflow-x-auto'>
                            <code {...props}>{children}</code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>

                {message.isStreaming && (
                  <div className='flex items-center mt-1'>
                    <div className='flex space-x-1'>
                      <div className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'></div>
                      <div
                        className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className='w-1 h-1 bg-gray-400 rounded-full animate-bounce'
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className='flex justify-start'>
              <div className='max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white shadow-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='flex space-x-1'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                    <div
                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {currentUser.name} is typing...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className='bg-white px-4 py-3 border-t border-gray-200'>
          <div className='flex items-center space-x-3'>
            <div className='flex-1'>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Message ${currentUser.name}...`}
                className='w-full px-4 py-2 bg-gray-100 rounded-full outline-none focus:bg-white focus:shadow-md transition-all duration-200'
              />
            </div>
            <div className='flex space-x-2'>
              <button
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                disabled={loading || !prompt.trim()}
                onClick={handleStreamChat}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
