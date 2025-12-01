import { useState } from 'react';
import type { Flashcard } from '../types';
import { sendChatMessage } from '../services/api';

interface LearnModeProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

interface QuizResult {
  flashcard: Flashcard;
  userAnswer: string;
  aiScore: number; // 0-100
  aiFeedback: string;
  isCorrect: boolean;
}

export const LearnMode = ({ flashcards, onClose }: LearnModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [studyRecommendations, setStudyRecommendations] = useState<string>('');
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <p className="text-gray-600">No flashcards to study</p>
          <button
            onClick={onClose}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    setIsSubmitting(true);

    try {
      // Use AI to score the answer
      const prompt = `Question: "${currentCard.topic}"\n\nCorrect Answer: "${currentCard.explanation}"\n\nStudent Answer: "${userAnswer}"\n\nScore this answer from 0-100 and provide brief feedback. Return JSON: {"score": number, "feedback": "text", "is_correct": boolean}`;
      
      // Create a temporary flashcard for scoring
      const response = await sendChatMessage(currentCard.id, prompt);
      
      // Parse AI response
      let score = 0;
      let feedback = '';
      let isCorrect = false;

      try {
        // Try to extract JSON from response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          score = parsed.score || 0;
          feedback = parsed.feedback || response.response;
          isCorrect = parsed.is_correct || score >= 70;
        } else {
          // Fallback: simple scoring based on keywords
          const answerLower = userAnswer.toLowerCase();
          const correctLower = currentCard.explanation.toLowerCase();
          const words = correctLower.split(/\s+/);
          const matchedWords = words.filter(word => 
            word.length > 3 && answerLower.includes(word)
          ).length;
          score = Math.min(100, (matchedWords / words.length) * 100);
          isCorrect = score >= 50;
          feedback = response.response;
        }
      } catch (e) {
        // Simple fallback scoring
        const similarity = userAnswer.toLowerCase().includes(currentCard.topic.toLowerCase()) ? 50 : 0;
        score = similarity;
        isCorrect = false;
        feedback = 'Unable to parse AI response. Manual review needed.';
      }

      const result: QuizResult = {
        flashcard: currentCard,
        userAnswer,
        aiScore: score,
        aiFeedback: feedback,
        isCorrect,
      };

      setResults([...results, result]);
      setShowAnswer(true);
    } catch (error) {
      console.error('Error scoring answer:', error);
      // Fallback result
      const result: QuizResult = {
        flashcard: currentCard,
        userAnswer,
        aiScore: 0,
        aiFeedback: 'Error scoring answer. Please review manually.',
        isCorrect: false,
      };
      setResults([...results, result]);
      setShowAnswer(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowAnswer(false);
    } else {
      // Quiz complete
      setIsComplete(true);
      generateStudyRecommendations();
    }
  };

  const generateStudyRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    
    const wrongAnswers = results.filter(r => !r.isCorrect);
    if (wrongAnswers.length === 0) {
      setStudyRecommendations('🎉 Perfect score! You know all the topics well!');
      setIsGeneratingRecommendations(false);
      return;
    }

    const wrongTopics = wrongAnswers.map(r => 
      `- ${r.flashcard.topic} (Score: ${r.aiScore}/100)`
    ).join('\n');

    try {
      // Use first flashcard's chat to generate recommendations
      const prompt = `Analyze these incorrectly answered topics and provide 3-5 specific study recommendations:\n\n${wrongTopics}\n\nReturn a clear, actionable study plan.`;
      
      const response = await sendChatMessage(flashcards[0].id, prompt);
      setStudyRecommendations(response.response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setStudyRecommendations(`Focus on reviewing these topics:\n${wrongTopics}`);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const currentResult = results[currentIndex];
  const totalScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.aiScore, 0) / results.length)
    : 0;
  const correctCount = results.filter(r => r.isCorrect).length;

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 to-blue-900 z-50 overflow-y-auto">
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🎓 Quiz Complete!
              </h1>
              <p className="text-gray-600">
                You've completed all {flashcards.length} flashcards
              </p>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-8 mb-8 text-center">
              <div className="text-6xl font-bold mb-2">{totalScore}%</div>
              <div className="text-xl">Overall Score</div>
              <div className="text-lg mt-2">
                {correctCount} / {results.length} correct ({Math.round((correctCount / results.length) * 100)}%)
              </div>
            </div>

            {/* Wrong Answers */}
            {results.filter(r => !r.isCorrect).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ❌ Topics to Review ({results.filter(r => !r.isCorrect).length})
                </h2>
                <div className="space-y-4">
                  {results
                    .map((result, idx) => ({ ...result, originalIndex: idx }))
                    .filter(r => !r.isCorrect)
                    .map((result) => (
                      <div key={result.originalIndex} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800">{result.flashcard.topic}</h3>
                          <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold">
                            {result.aiScore}%
                          </span>
                        </div>
                        <div className="text-sm mb-2">
                          <span className="font-semibold">Your answer:</span> {result.userAnswer}
                        </div>
                        <div className="text-sm mb-2">
                          <span className="font-semibold">Correct:</span> {result.flashcard.explanation}
                        </div>
                        <div className="text-xs text-gray-600 italic">{result.aiFeedback}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Study Recommendations */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                📚 Study Recommendations
              </h2>
              {isGeneratingRecommendations ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">Analyzing your performance...</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{studyRecommendations}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-white">
              <h1 className="text-2xl font-bold">🎮 Learn Mode</h1>
              <p className="text-blue-200 text-sm">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Exit
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-700 rounded-full h-3 mb-6">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Flashcard */}
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
            {/* Question */}
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">
                Subject: {currentCard.subject}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {currentCard.topic}
              </h2>
              <p className="text-gray-600">
                Explain what this topic means:
              </p>
            </div>

            {/* Answer Input */}
            {!showAnswer ? (
              <div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  rows={6}
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim() || isSubmitting}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scoring...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            ) : (
              <div>
                {/* Score */}
                <div className={`p-6 rounded-lg mb-4 ${
                  currentResult.isCorrect 
                    ? 'bg-green-100 border-2 border-green-500' 
                    : 'bg-red-100 border-2 border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {currentResult.isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                    </span>
                    <span className="text-3xl font-bold">
                      {currentResult.aiScore}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 italic">{currentResult.aiFeedback}</p>
                </div>

                {/* Your Answer */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Your Answer:</h3>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded">{currentResult.userAnswer}</p>
                </div>

                {/* Correct Answer */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Correct Answer:</h3>
                  <p className="text-gray-800 bg-blue-50 p-4 rounded border border-blue-200">
                    {currentCard.explanation}
                  </p>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  {currentIndex < flashcards.length - 1 ? 'Next Card →' : 'See Results 🎉'}
                </button>
              </div>
            )}
          </div>

          {/* Current Score */}
          {results.length > 0 && (
            <div className="bg-white bg-opacity-20 backdrop-blur text-white rounded-lg p-4 text-center">
              <div className="text-sm mb-1">Current Average Score</div>
              <div className="text-3xl font-bold">{totalScore}%</div>
              <div className="text-sm mt-1">
                {correctCount} / {results.length} correct
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

