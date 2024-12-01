'use client';

import React from 'react';

interface TextInputProps {
    onTextChange: (text: string) => void;
    value: string;
}

export function TextInput({ onTextChange, value }: TextInputProps) {
    return (
        <div className="mb-4">
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
                3D Text
            </label>
            <input
                id="text-input"
                type="text"
                value={value}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Enter text to display in 3D"
            />
        </div>
    );
}
