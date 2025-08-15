import Image from 'next/image';
import React from 'react';

function Header() {
  return (
    <div className='bg-gray-50 px-4 py-3 border-b border-gray-200'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Image
            src='/chai.jpg'
            height={50}
            width={50}
            alt='chaichat'
            className='rounded-full'
          />
          <h1 className='text-gray-800 font-bold'>ChaiChat</h1>
        </div>
      </div>
    </div>
  );
}

export default Header;
