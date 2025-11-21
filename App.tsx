
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Question, QuestionType, PracticeState } from './types';
import { generateNewQuestion, generateQuestionByType, questionTypes } from './services/questionService';
import { getBakedExplanation } from './services/explanationService';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

// Helper function to parse a fraction string (e.g., "3/4", "5", "1 1/2") into a numeric representation.
const parseFraction = (fractionStr: string): {num: number, den: number} | null => {
  const trimmed = fractionStr.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean); // Split by space and remove empty strings

  let whole = 0;
  let fracPart = '';

  if (parts.length === 2) {
    // Potentially a mixed number like "1 1/2"
    if (!parts[1].includes('/')) return null; // must have a fraction part
    whole = parseInt(parts[0], 10);
    fracPart = parts[1];
    if (isNaN(whole)) return null;
  } else if (parts.length === 1) {
    fracPart = parts[0];
  } else if (parts.length > 2) {
    return null; // Invalid format
  }

  if (fracPart.includes('/')) {
    const fracParts = fracPart.split('/');
    if (fracParts.length !== 2) return null;
    let num = parseInt(fracParts[0], 10);
    let den = parseInt(fracParts[1], 10);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    num = (whole * den) + num;
    return { num, den };
  } else {
    // Handle whole numbers
    const num = parseInt(fracPart, 10);
    if (isNaN(num)) return null;
    return { num: whole + num, den: 1 };
  }
};

// Helper function to check if two fraction strings are mathematically equivalent.
const areFractionsEquivalent = (userAnswer: string, correctAnswer: string): boolean => {
  const userFrac = parseFraction(userAnswer);
  const correctFrac = parseFraction(correctAnswer);

  if (!userFrac || !correctFrac) {
    return false; // Invalid format
  }

  // Use cross-multiplication to check for equivalence (n1/d1 === n2/d2  =>  n1 * d2 === n2 * d1)
  return userFrac.num * correctFrac.den === correctFrac.num * userFrac.den;
};


const PracticeTracker: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex space-x-2 justify-center">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${i <= count ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-400'}`}>
        {i <= count && <CheckIcon />}
      </div>
    ))}
  </div>
);

const formatCountdown = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return minutes > 0 ? `${minutes}:${paddedSeconds}` : `${seconds}s`;
};

const practiceTimerOptions = [
  { label: 'No timer', seconds: 0 },
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 mins', seconds: 120 },
];

// Helper function to strip markdown for cleaner speech
const sanitizeForSpeech = (text: string): string => {
    return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
};

interface StepByStepGuidancePanelProps {
  steps: string[];
  onContinue: () => void;
  speakText: (text: string) => void;
}

const StepByStepGuidancePanel: React.FC<StepByStepGuidancePanelProps> = ({ steps, onContinue, speakText }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);

    const handleNextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const handleShowAll = () => {
        setShowAll(true);
    };

    const formatStep = (step: string) => {
        return step
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')         // Italic
            .replace(/\n/g, '<br />');
    };

    const formattedContent = (content: string) => ({ __html: formatStep(content) });

    if (showAll) {
        return (
            <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg border-2 border-amber-400 animate-fade-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">All Steps</h3>
                <div className="prose max-w-none text-gray-700 space-y-4">
                    {steps.map((step, index) => (
                        <div key={index}>
                           <div className="flex items-center gap-2">
                               <p className="font-bold">Step {index + 1}:</p>
                                <button onClick={() => speakText(step)} className="text-gray-500 hover:text-blue-600 transition-colors" aria-label={`Read step ${index + 1} aloud`}>
                                    <SpeakerIcon />
                                </button>
                           </div>
                           <div dangerouslySetInnerHTML={formattedContent(step)} />
                        </div>
                    ))}
                </div>
                <button
                    onClick={onContinue}
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                >
                    Got it! Let's Practice
                </button>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg border-2 border-amber-400 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Let's break it down...</h3>
                    <p className="text-gray-600">Step {currentStepIndex + 1} of {steps.length}</p>
                </div>
                <button onClick={() => speakText(steps[currentStepIndex])} className="text-gray-500 hover:text-blue-600 transition-colors" aria-label={`Read step ${currentStepIndex + 1} aloud`}>
                    <SpeakerIcon />
                </button>
            </div>

            <div className="prose max-w-none text-gray-700 min-h-[120px] mb-4" dangerouslySetInnerHTML={formattedContent(steps[currentStepIndex])} />

            <div className="mt-6 space-y-3">
                {currentStepIndex < steps.length - 1 ? (
                    <button
                        onClick={handleNextStep}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handleShowAll}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        Display All Steps
                    </button>
                )}
                <button
                    onClick={onContinue}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                >
                    I'm Ready for the Next Question
                </button>
            </div>
        </div>
    );
};


const Fraction: React.FC<{ value: string }> = ({ value }) => {
  // Handle mixed numbers
  const mixedParts = value.split(' ');
  if (mixedParts.length === 2 && mixedParts[1].includes('/')) {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className="font-mono text-5xl">{mixedParts[0]}</span>
        <Fraction value={mixedParts[1]} />
      </div>
    );
  }

  // Handle simple fractions
  const parts = value.split('/');
  if (parts.length === 2) {
    return (
      <div className="inline-flex flex-col items-center font-mono text-5xl leading-none">
        <span>{parts[0]}</span>
        <span className="w-full border-t-2 border-black my-1"></span>
        <span>{parts[1]}</span>
      </div>
    );
  }
  
  // For whole numbers in fraction questions (e.g., division)
  return <span className="font-mono text-5xl">{value}</span>;
};


const QuestionDisplay: React.FC<{ question: Question }> = ({ question }) => {
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

  if (question.type === QuestionType.LongMultiplication && question.operands) {
    return (
      <div className="flex justify-center my-4">
        <div className="inline-flex flex-col items-end font-mono text-5xl text-gray-800">
          <span>{question.operands[0]}</span>
          <div className="flex items-center">
            <span className="mr-4">{question.operator}</span>
            <span>{question.operands[1]}</span>
          </div>
          <div className="w-full border-t-2 border-black mt-2"></div>
        </div>
      </div>
    );
  }

  if (fractionTypes.includes(question.type) && question.operands && question.operator) {
      return (
          <div className="flex justify-center items-center my-8 space-x-6 text-gray-800">
              <Fraction value={question.operands[0]} />
              <span className="font-mono text-5xl">{question.operator}</span>
              <Fraction value={question.operands[1]} />
              <span className="font-mono text-5xl">=</span>
          </div>
      );
  }
  
  const getQuestionFontSize = (text: string | undefined) => {
    if (!text) return 'text-4xl';
    if (text.length > 25) return 'text-3xl';
    if (text.includes('│')) return 'text-5xl'; // long division
    return 'text-5xl';
  }

  return (
    <div className={`text-center text-gray-800 font-mono whitespace-pre-line ${getQuestionFontSize(question.text)}`}>
        {question.text.replace(/_/g, '___')}
    </div>
  );
};


export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | 'hidden'>('hidden');
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [isAnswering, setIsAnswering] = useState(true);
  const [explanation, setExplanation] = useState<string[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<QuestionType | 'All'>('All');
  const [britishVoice, setBritishVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [practiceTimerSeconds, setPracticeTimerSeconds] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timeUpTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        // Prioritize a "Google" voice as they often sound more natural
        const gbVoice = allVoices.find(voice => voice.lang === 'en-GB' && voice.name.includes('Google')) ||
                      allVoices.find(voice => voice.lang === 'en-GB');
        setBritishVoice(gbVoice || null);
      }
    };

    // Voices are loaded asynchronously. onvoiceschanged is the event to listen for.
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      // Also cancel any speech on component unmount
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeUpTransitionRef.current) {
        clearTimeout(timeUpTransitionRef.current);
      }
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;

    // Cancel any ongoing speech to prevent overlap
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
    }
  }, [practiceState]);

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
    // Sanitize answer by removing commas for place value questions
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
          setSelectedTopic('All'); // Go back to random questions
          // A delay is already built-in before startNewQuestion runs from useEffect
        } else {
          setPracticeState({ ...practiceState, correctInARow: newCount });
          setTimeout(startPracticeQuestion, 1500);
        }
      } else {
        // Correct answer in random mode
        setTimeout(() => startNewQuestion(currentQuestion.type), 1500);
      }
    } else {
      // Incorrect answer
      setPracticeState({ type: currentQuestion.type, correctInARow: 0 });
      setSelectedTopic(currentQuestion.type); // Lock into this topic for practice
      const expl = getBakedExplanation(currentQuestion);
      setExplanation(expl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl text-center mb-4">
        <h1 className="text-4xl font-bold text-blue-700">KS2 Arithmetic Practice</h1>
        <p className="text-gray-600 mt-2">Master your maths skills, one question at a time!</p>
      </div>
      
      <div className="w-full max-w-xs mx-auto mb-6">
          <label htmlFor="topic-select" className="block text-sm font-medium text-gray-700 mb-1 text-center">
            Choose a topic to practice:
          </label>
          <select
            id="topic-select"
            value={selectedTopic}
            onChange={handleTopicChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="All">All Topics (Random)</option>
            {questionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>


      {practiceState && (
          <div className="w-full max-w-2xl mx-auto bg-blue-100 p-4 rounded-lg shadow-md mb-6 border border-blue-300">
            <h3 className="text-lg font-semibold text-blue-800 text-center mb-2">Practice Zone: {practiceState.type}</h3>
            <PracticeTracker count={practiceState.correctInARow} />
            <p className="text-center text-sm text-blue-700 mt-2">Get 3 in a row correct to move to a new topic!</p>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-blue-700 mb-2">Timer per question</p>
              <div className="flex flex-wrap justify-center gap-2">
                {practiceTimerOptions.map((option) => (
                  <button
                    key={`timer-${option.seconds}`}
                    onClick={() => {
                      setPracticeTimerSeconds(option.seconds);
                      setSecondsRemaining(option.seconds);
                    }}
                    className={`px-3 py-1 rounded-full border text-sm font-semibold transition-colors duration-200 ${
                      practiceTimerSeconds === option.seconds
                        ? 'bg-blue-600 border-blue-700 text-white'
                        : 'bg-white border-blue-200 text-blue-700 hover:border-blue-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {practiceTimerSeconds > 0 && currentQuestion && (
                <div className="mt-3 text-2xl font-bold text-blue-800">
                  Time left: {formatCountdown(secondsRemaining)}
                </div>
              )}
            </div>
          </div>
      )}

      {currentQuestion && !explanation && (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg transition-all duration-300">
            <div className="text-center mb-6">
                <span className="text-sm font-semibold bg-gray-200 text-gray-700 px-3 py-1 rounded-full">{currentQuestion.type}</span>
            </div>
            
            <QuestionDisplay question={currentQuestion} />
            
            <div className="mt-8">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && isAnswering && handleCheckAnswer()}
                placeholder="Your Answer"
                className={`w-full p-4 text-2xl border-2 rounded-lg text-center transition-all duration-300 focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400
                  ${feedback === 'hidden' ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-300' : ''}
                  ${feedback === 'correct' ? 'border-green-500 bg-green-50 focus:ring-green-300' : ''}
                  ${feedback === 'incorrect' ? 'border-red-500 bg-red-50 focus:ring-red-300' : ''}
                  ${feedback === 'timeout' ? 'border-orange-500 bg-orange-50 focus:ring-orange-300' : ''}`}
                disabled={!isAnswering}
              />
            </div>

            <div className="mt-4 h-8 flex items-center justify-center">
              {feedback === 'correct' && (
                <div className="flex items-center text-green-600 font-bold">
                  <CheckIcon /> 
                  <span className="ml-2">Correct! Well done!</span>
                  <button onClick={() => speakText('Correct! Well done!')} className="ml-2 text-gray-500 hover:text-blue-600 transition-colors" aria-label="Read feedback aloud">
                    <SpeakerIcon />
                  </button>
                </div>
              )}
              {feedback === 'incorrect' && (
                <div className="flex items-center text-red-600 font-bold">
                  <CrossIcon /> 
                  <span className="ml-2">Not quite, let's review.</span>
                   <button onClick={() => speakText("Not quite, let's review.")} className="ml-2 text-gray-500 hover:text-blue-600 transition-colors" aria-label="Read feedback aloud">
                    <SpeakerIcon />
                  </button>
                </div>
              )}
              {feedback === 'timeout' && (
                <div className="flex items-center text-orange-600 font-bold">
                  <CrossIcon />
                  <span className="ml-2">Time's up! Keep calm and try again.</span>
                  <button onClick={() => speakText("Time's up! Keep calm and try again.")} className="ml-2 text-gray-500 hover:text-blue-600 transition-colors" aria-label="Read timeout feedback aloud">
                    <SpeakerIcon />
                  </button>
                </div>
              )}
            </div>

            <button
                onClick={handleCheckAnswer}
                disabled={!isAnswering || userAnswer.trim() === ''}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-200 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Check Answer
            </button>
        </div>
      )}

      {explanation && (
        <StepByStepGuidancePanel steps={explanation} onContinue={startPracticeQuestion} speakText={speakText} />
      )}
    </div>
  );
}
