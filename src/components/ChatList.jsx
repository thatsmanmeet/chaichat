import Image from 'next/image';
import React from 'react';

function ChatList({ users, switchUser, conversations, activeUser }) {
  return (
    <div className='flex-1 overflow-y-auto'>
      {Object.values(users).map((user) => {
        const userMessages = conversations[user.id] || [];
        const lastMessage = userMessages[userMessages.length - 1];
        const isActive = activeUser === user.id;

        return (
          <div
            key={user.id}
            className={`px-3 py-3 border-b border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors ${
              isActive ? 'bg-gray-100' : 'bg-white'
            }`}
            onClick={() => switchUser(user.id)}
          >
            <div className='flex items-center space-x-3'>
              <div
                className={`w-12 h-12 ${user.color} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <Image
                  alt={user.name}
                  width={100}
                  height={100}
                  src={user.avatar}
                  className='text-white font-semibold text-sm rounded-full'
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {user.name}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {lastMessage
                      ? lastMessage.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'now'}
                  </p>
                </div>
                <p className='text-sm text-gray-500 truncate'>
                  {lastMessage
                    ? (lastMessage.isUser ? 'You: ' : '') +
                      (lastMessage.text.length > 30
                        ? lastMessage.text.substring(0, 30) + '...'
                        : lastMessage.text)
                    : 'No messages yet'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChatList;
