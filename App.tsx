import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Question, QuestionType } from './types';
import { generateQuestionByType, generateNewQuestion } from './services/questionService';
import { getBakedExplanation } from './services/explanationService';
import AdditionVisualizer from './components/visualizers/AdditionVisualizer';
import SubtractionVisualizer from './components/visualizers/SubtractionVisualizer';
import ShortMultiplicationVisualizer from './components/visualizers/ShortMultiplicationVisualizer';

// --- Icons ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all duration-300 ${filled ? 'text-yellow-400 fill-current scale-110' : 'text-gray-300 scale-100'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// --- Helper Components ---

const PracticeTracker: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex space-x-3 justify-center mb-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="transform transition-transform hover:scale-110">
        <StarIcon filled={i <= count} />
      </div>
    ))}
  </div>
);

const QuestionDisplay: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="text-center">
      <div className="text-5xl md:text-7xl font-black text-gray-800 tracking-tight mb-4 font-mono">
        {question.text}
      </div>
      {question.type.includes('Fraction') && (
        <div className="text-gray-500 text-lg italic">
          (Enter fractions like 1/2 or 1 1/2)
        </div>
      )}
    </div>
  );
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const StepByStepGuidancePanel: React.FC<{
  steps: string[],
  onContinue: () => void,
  speakText: (text: string) => void,
  question: Question
}> = ({ steps, onContinue, speakText, question }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  return (
    <div className="mt-6 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-primary/20 animate-fade-in-up w-full max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <span>💡</span> Let's solve it together!
        </h3>
        {!showAllSteps && (
          <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Step {stepIndex + 1} of {steps.length}
          </div>
        )}
      </div>

      {showAllSteps ? (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <div className="text-lg text-gray-700 font-medium leading-relaxed">
                <FormattedText text={step} />
                <button
                  onClick={() => speakText(step)}
                  className="ml-2 inline-block text-gray-400 hover:text-primary transition-colors align-middle"
                  title="Read step"
                >
                  <SpeakerIcon />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-4 text-center">
            <button
              onClick={() => setShowAllSteps(false)}
              className="text-primary font-bold hover:underline"
            >
              Show Step-by-Step View
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Text Explanation */}
          <div className="flex-1 space-y-4">
            <div className="text-lg text-gray-700 font-medium leading-relaxed flex items-start gap-2">
              <div className="flex-1">
                <FormattedText text={steps[stepIndex]} />
              </div>
              <button
                onClick={() => speakText(steps[stepIndex])}
                className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors mt-1"
                title="Read step"
              >
                <SpeakerIcon />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePrevStep}
                disabled={stepIndex === 0}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2
                          ${stepIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:shadow-md'
                  }`}
              >
                <span>←</span> Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={stepIndex === steps.length - 1}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                          ${stepIndex === steps.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white'
                  }`}
              >
                Next Step →
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAllSteps(true)}
                className="flex-1 py-2 px-4 rounded-xl font-bold text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                View All Steps
              </button>
              <button
                onClick={onContinue}
                className="flex-1 py-2 px-4 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
              >
                Ready to Practice! 🚀
              </button>
            </div>
          </div>

          {/* Visualizer */}
          <div className="flex-shrink-0 flex justify-center md:justify-end">
            {question.type === QuestionType.Addition && (
              <AdditionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {(question.type === QuestionType.Subtraction || question.type === QuestionType.SubtractionWithRegrouping) && (
              <SubtractionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.Multiplication && (
              <ShortMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const questionTypes = Object.values(QuestionType);

// Helper to check fraction equivalence (simplified)
const areFractionsEquivalent = (ans1: string, ans2: string): boolean => {
  // Very basic check, ideally would parse and compare values
  // For now, strip spaces and compare
  return ans1.replace(/\s/g, '') === ans2.replace(/\s/g, '');
};

// Helper for speech
const sanitizeForSpeech = (text: string) => {
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/(\d+)\/(\d+)/g, '$1 over $2') // Fractions
    .replace(/-/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ');
};

// Helper for timer format
const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'hidden' | 'correct' | 'incorrect' | 'timeout'>('hidden');
  const [isAnswering, setIsAnswering] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<QuestionType | 'All'>('All');
  const [explanation, setExplanation] = useState<string[] | null>(null);

  // Practice Mode State
  const [practiceState, setPracticeState] = useState<{ type: QuestionType, correctInARow: number } | null>(null);
  const [practiceTimerSeconds, setPracticeTimerSeconds] = useState<number>(0); // 0 means no timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const practiceTimerOptions = [
    { label: 'No Timer', seconds: 0 },
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '2m', seconds: 120 },
  ];

  // Speech Synthesis
  const [britishVoice, setBritishVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const gbVoice = voices.find(voice => voice.lang === 'en-GB' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'en-GB');
      setBritishVoice(gbVoice || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Timer transition ref
  const timeUpTransitionRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeUpTransitionRef.current) {
        clearTimeout(timeUpTransitionRef.current);
      }
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
    if (britishVoice) {
      utterance.voice = britishVoice;
    }
    utterance.pitch = 1;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [britishVoice]);

  const resetForNewQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setUserAnswer('');
    setFeedback('hidden');
    setIsAnswering(true);
    setExplanation(null);
  }

  const startNewQuestion = useCallback((typeToExclude?: QuestionType) => {
    const newQ = generateNewQuestion(typeToExclude);
    resetForNewQuestion(newQ);
  }, []);

  const startPracticeQuestion = useCallback(() => {
    if (practiceState) {
      const newQ = generateQuestionByType(practiceState.type);
      resetForNewQuestion(newQ);
    } else {
      // If no practice state (e.g. All Topics), generate a random new question
      startNewQuestion();
    }
  }, [practiceState, startNewQuestion]);

  const handleTimerExpire = useCallback(() => {
    if (!currentQuestion) return;

    setFeedback('timeout');
    setIsAnswering(false);
    setExplanation(null);
    setPracticeState({ type: currentQuestion.type, correctInARow: 0 });
    setSelectedTopic(currentQuestion.type);
    setSecondsRemaining(0);
    speakText("Time's up! Keep calm and try again.");

    if (timeUpTransitionRef.current) {
      clearTimeout(timeUpTransitionRef.current);
    }
    timeUpTransitionRef.current = setTimeout(() => {
      startPracticeQuestion();
    }, 1500);
  }, [currentQuestion, startPracticeQuestion, speakText]);

  useEffect(() => {
    if (selectedTopic === 'All') {
      startNewQuestion();
    } else {
      const newQ = generateQuestionByType(selectedTopic);
      resetForNewQuestion(newQ);
      if (!practiceState || practiceState.type !== selectedTopic) {
        setPracticeState({ type: selectedTopic, correctInARow: 0 });
      }
    }
  }, [selectedTopic, startNewQuestion]);

  const handleTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = event.target.value as QuestionType | 'All';
    setSelectedTopic(newTopic);
    if (newTopic === 'All') {
      setPracticeState(null);
    }
  };

  useEffect(() => {
    if (practiceTimerSeconds <= 0 || !practiceState || !currentQuestion || !isAnswering) {
      setSecondsRemaining(practiceTimerSeconds);
      return;
    }

    setSecondsRemaining(practiceTimerSeconds);
    const intervalId = setInterval(() => {
      setSecondsRemaining((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(intervalId);
          handleTimerExpire();
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [practiceTimerSeconds, practiceState, currentQuestion, isAnswering, handleTimerExpire]);


  const handleCheckAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;

    const fractionTypes = [
      QuestionType.FractionAdditionSimpleDenominators,
      QuestionType.FractionAdditionUnlikeDenominators,
      QuestionType.FractionAdditionMixedNumbers,
      QuestionType.FractionSubtractionSimpleDenominators,
      QuestionType.FractionSubtractionUnlikeDenominators,
      QuestionType.FractionSubtractionMixedNumbers,
      QuestionType.FractionMultiplication,
      QuestionType.FractionMultiplicationMixedNumbers,
      QuestionType.FractionDivision,
    ];

    let isCorrect = false;
    const sanitizedUserAnswer = userAnswer.trim().replace(/,/g, '');
    const sanitizedCorrectAnswer = currentQuestion.answer.replace(/,/g, '');

    if (fractionTypes.includes(currentQuestion.type)) {
      isCorrect = areFractionsEquivalent(userAnswer, currentQuestion.answer);
    } else {
      isCorrect = sanitizedUserAnswer === sanitizedCorrectAnswer;
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnswering(false);

    if (isCorrect) {
      if (practiceState) {
        const newCount = practiceState.correctInARow + 1;
        if (newCount >= 3) {
          setPracticeState(null);
          setSelectedTopic('All');
        } else {
          setPracticeState({ ...practiceState, correctInARow: newCount });
          setTimeout(startPracticeQuestion, 1500);
        }
      } else {
        setTimeout(() => startNewQuestion(currentQuestion.type), 1500);
      }
    } else {
      setPracticeState({ type: currentQuestion.type, correctInARow: 0 });
      setSelectedTopic(currentQuestion.type);
      const expl = getBakedExplanation(currentQuestion);
      setExplanation(expl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl text-center mb-8 animate-bounce-slow">
        <h1 className="text-5xl md:text-6xl font-bold text-primary drop-shadow-sm mb-2">KS2 Maths Fun! 🧮</h1>
        <p className="text-xl text-gray-600 font-medium">Master your maths skills, one question at a time!</p>
      </div>

      <div className="w-full max-w-xs mx-auto mb-8">
        <label htmlFor="topic-select" className="block text-lg font-bold text-gray-700 mb-2 text-center">
          Choose a topic to practice:
        </label>
        <div className="relative">
          <select
            id="topic-select"
            value={selectedTopic}
            onChange={handleTopicChange}
            className="block w-full pl-4 pr-10 py-3 text-lg border-2 border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary rounded-2xl shadow-sm bg-white appearance-none cursor-pointer transition-all hover:border-primary"
          >
            <option value="All">🎲 All Topics (Random)</option>
            {questionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
            <svg className="h-6 w-6 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
        </div>
      </div>


      {practiceState && (
        <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl mb-8 border-4 border-blue-200 animate-fade-in">
          <h3 className="text-xl font-bold text-primary text-center mb-4">Practice Zone: {practiceState.type}</h3>
          <PracticeTracker count={practiceState.correctInARow} />
          <p className="text-center text-base text-gray-600 mt-3 font-medium">Get 3 stars to unlock a new topic! ⭐⭐⭐</p>
          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Timer per question</p>
            <div className="flex flex-wrap justify-center gap-3">
              {practiceTimerOptions.map((option) => (
                <button
                  key={`timer-${option.seconds}`}
                  onClick={() => {
                    setPracticeTimerSeconds(option.seconds);
                    setSecondsRemaining(option.seconds);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform hover:scale-105 ${practiceTimerSeconds === option.seconds
                    ? 'bg-primary text-white shadow-lg ring-2 ring-primary ring-offset-2'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {practiceTimerSeconds > 0 && currentQuestion && (
              <div className={`mt-4 text-3xl font-black transition-colors duration-300 ${secondsRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                ⏱️ {formatCountdown(secondsRemaining)}
              </div>
            )}
          </div>
        </div>
      )}

      {currentQuestion && !explanation && (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-2xl border-b-8 border-gray-200 transition-all duration-300">
          <div className="text-center mb-8">
            <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">{currentQuestion.type}</span>
          </div>

          <QuestionDisplay question={currentQuestion} />

          <div className="mt-10">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isAnswering && handleCheckAnswer()}
              placeholder="?"
              className={`w-full p-5 text-4xl font-bold border-4 rounded-2xl text-center transition-all duration-300 focus:ring-4 outline-none bg-gray-50 text-gray-800 placeholder:text-gray-300
                  ${feedback === 'hidden' ? 'border-gray-200 focus:border-primary focus:ring-primary/20' : ''}
                  ${feedback === 'correct' ? 'border-green-400 bg-green-50 focus:ring-green-200' : ''}
                  ${feedback === 'incorrect' ? 'border-red-400 bg-red-50 focus:ring-red-200' : ''}
                  ${feedback === 'timeout' ? 'border-orange-400 bg-orange-50 focus:ring-orange-200' : ''}`}
              disabled={!isAnswering}
              autoFocus
            />
          </div>

          <div className="mt-6 min-h-[3rem] flex items-center justify-center">
            {feedback === 'correct' && (
              <div className="flex items-center text-green-500 font-black text-xl animate-bounce">
                <CheckIcon />
                <span className="ml-2">Awesome! Correct! 🎉</span>
                <button onClick={() => speakText('Correct! Well done!')} className="ml-2 text-gray-400 hover:text-green-600 transition-colors" aria-label="Read feedback aloud">
                  <SpeakerIcon />
                </button>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="flex items-center text-red-500 font-black text-xl animate-shake">
                <CrossIcon />
                <span className="ml-2">Oops! Not quite. 🤔</span>
                <button onClick={() => speakText("Not quite, let's review.")} className="ml-2 text-gray-400 hover:text-red-600 transition-colors" aria-label="Read feedback aloud">
                  <SpeakerIcon />
                </button>
              </div>
            )}
            {feedback === 'timeout' && (
              <div className="flex items-center text-orange-500 font-black text-xl">
                <span className="text-3xl mr-2">⏰</span>
                <span className="ml-2">Time's up! Try again!</span>
                <button onClick={() => speakText("Time's up! Keep calm and try again.")} className="ml-2 text-gray-400 hover:text-orange-600 transition-colors" aria-label="Read timeout feedback aloud">
                  <SpeakerIcon />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckAnswer}
            disabled={!isAnswering || userAnswer.trim() === ''}
            className="mt-8 w-full bg-secondary hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[2px] transition-all duration-200 text-2xl uppercase tracking-wider"
          >
            Check Answer ✨
          </button>
        </div>
      )}

      {explanation && currentQuestion && (
        <StepByStepGuidancePanel steps={explanation} onContinue={startPracticeQuestion} speakText={speakText} question={currentQuestion} />
      )}
    </div>
  );
}
