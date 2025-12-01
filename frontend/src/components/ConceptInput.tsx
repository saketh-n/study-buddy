import { useState } from 'react';
import type { ConceptInputProps } from '../types';

export const ConceptInput = ({ onGenerateTopics, onGenerateTopicsFromImage, isLoading }: ConceptInputProps) => {
  const [inputText, setInputText] = useState('');
  const [filterNovelOnly, setFilterNovelOnly] = useState(false);
  const [useIntelligentExtraction, setUseIntelligentExtraction] = useState(false);
  const [useConciseMode, setUseConciseMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onGenerateTopics(inputText.trim(), filterNovelOnly, useIntelligentExtraction, useConciseMode);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file too large (max 5MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImageUpload = async () => {
    if (selectedFile && !isLoading) {
      await onGenerateTopicsFromImage(selectedFile, filterNovelOnly, useConciseMode);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="concepts" 
            className="block text-lg font-semibold text-gray-700 mb-2"
          >
            Enter Text to Study
          </label>
          <textarea
            id="concepts"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste any text, article, or notes here. AI will extract key topics...&#10;&#10;Example: A network bridge is a device that connects multiple network segments at the data link layer. Bridges filter traffic based on MAC addresses..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[160px] text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={6}
            disabled={isLoading}
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Intelligent Extraction Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="useIntelligentExtraction"
                checked={useIntelligentExtraction}
                onChange={(e) => setUseIntelligentExtraction(e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 text-purple-600 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="useIntelligentExtraction" className="flex-1 cursor-pointer">
                <div className="text-sm font-semibold text-gray-800">
                  🧠 Intelligent (Question-Based)
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Extracts questions first, then generates granular topics.
                </div>
              </label>
            </div>

            {/* Concise Mode Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                id="useConciseMode"
                checked={useConciseMode}
                onChange={(e) => setUseConciseMode(e.target.checked)}
                disabled={isLoading}
                className="w-5 h-5 text-amber-600 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
              />
              <label htmlFor="useConciseMode" className="flex-1 cursor-pointer">
                <div className="text-sm font-semibold text-gray-800">
                  📝 Concise Mode
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Extract fewer, more focused topics (20-50 instead of 100+).
                </div>
              </label>
            </div>
          </div>

          {/* Filter Novel Topics Only Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="filterNovelOnly"
              checked={filterNovelOnly}
              onChange={(e) => setFilterNovelOnly(e.target.checked)}
              disabled={isLoading}
              className="w-5 h-5 text-blue-600 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <label htmlFor="filterNovelOnly" className="flex-1 cursor-pointer">
              <div className="text-sm font-semibold text-gray-800">
                Filter out existing topics (novel topics only)
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Extract only new topics that don't overlap with your existing flashcards. Perfect for pasting large notes sequentially without duplicates.
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Extracting Topics...</span>
            </>
          ) : (
            'Extract Topics'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="text-sm text-gray-500 font-medium">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <label 
              htmlFor="imageUpload" 
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              📸 Upload Image to Extract Topics
            </label>
            <p className="text-xs text-gray-600 mb-4">
              Upload notes, diagrams, slides, or screenshots. AI will extract all visible topics and questions.
            </p>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              {selectedFile ? (
                <div className="w-full bg-white p-3 rounded border border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024).toFixed(1)}KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isLoading}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Extract Topics from Image
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-400 text-gray-700 font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Choose Image
                </label>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
