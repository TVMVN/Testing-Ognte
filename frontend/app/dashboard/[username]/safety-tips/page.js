'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Shield, 
  Eye, 
  DollarSign, 
  MessageSquare, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Phone, 
  Mail,
  Building2,
  UserCheck,
  Star,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Camera,
  Info,
  Heart,
  Users,
  Globe,
  Clock,
  TrendingUp,
  Award,
  X,
  RotateCcw,
  Trophy
} from 'lucide-react';

const CandidateSafetyTips = () => {
  const [activeTab, setActiveTab] = useState('safety');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const circleContainer = useRef();
  const headerRef = useRef();
  const cardRefs = useRef([]);

  const quizQuestions = [
    {
      question: "A recruiter contacts you via WhatsApp with an immediate job offer paying $5000/month for data entry work, requiring no experience. What should you do?",
      options: [
        "Accept immediately - it's a great opportunity!",
        "Research the company and recruiter thoroughly first",
        "Ask for references from current employees",
        "Request a formal interview process"
      ],
      correct: 1,
      explanation: "High-paying offers with no requirements via informal channels are major red flags. Always research thoroughly before proceeding."
    },
    {
      question: "During the application process, an employer asks for your social security number and bank details 'for background verification'. When is this appropriate?",
      options: [
        "Immediately when they request it",
        "During the initial interview",
        "Only after receiving and accepting a formal job offer",
        "Never - legitimate employers don't need this information"
      ],
      correct: 2,
      explanation: "Personal financial information should only be shared AFTER you've received and accepted a formal job offer, never during the application phase."
    },
    {
      question: "You're asked to pay a $200 'training fee' upfront for a remote customer service position. The company promises to reimburse you with your first paycheck. What's your response?",
      options: [
        "Pay the fee - they promised to reimburse it",
        "Negotiate to pay half now, half later",
        "Refuse and report as a potential scam",
        "Ask if you can pay after getting the job"
      ],
      correct: 2,
      explanation: "Legitimate employers NEVER charge fees for training, equipment, or job opportunities. This is a classic scam tactic."
    },
    {
      question: "Which of these interview red flags should make you most concerned?",
      options: [
        "The interviewer asks about your salary expectations",
        "They want to conduct the interview via video call",
        "They can't provide specific details about daily responsibilities",
        "The interview is scheduled for after business hours"
      ],
      correct: 2,
      explanation: "Legitimate employers should be able to clearly explain job responsibilities. Vague descriptions often indicate fraudulent opportunities."
    },
    {
      question: "What's the safest way to research a potential employer before applying?",
      options: [
        "Only check their website",
        "Ask friends on social media",
        "Cross-reference multiple sources: website, LinkedIn, reviews, business registration",
        "Call them directly to ask about their reputation"
      ],
      correct: 2,
      explanation: "Comprehensive research using multiple independent sources gives you the best picture of a company's legitimacy."
    }
  ];

  useEffect(() => {
    // Background animation
    if (circleContainer.current) {
      const circles = circleContainer.current.querySelectorAll('.circle');
      circles.forEach((c, index) => {
        const x = Math.random() * 800 - 400;
        const y = Math.random() * 1000 - 500;
        const dur = Math.random() * 30 + 20;
        const dly = Math.random() * 10;
        
        // Initial animation
        c.style.transform = `scale(0) rotate(0deg)`;
        c.style.opacity = '0';
        
        setTimeout(() => {
          c.style.transition = 'all 4s ease-out';
          c.style.transform = `scale(${Math.random() * 1 + 0.5}) rotate(360deg)`;
          c.style.opacity = `${Math.random() * 0.15 + 0.05}`;
        }, dly * 1000);
        
        // Floating animation
        setInterval(() => {
          const newX = Math.random() * 800 - 400;
          const newY = Math.random() * 1000 - 500;
          c.style.transition = `all ${dur}s ease-in-out`;
          c.style.transform += ` translate(${newX}px, ${newY}px)`;
        }, dur * 1000);
      });
    }

    // Header entrance animation
    if (headerRef.current) {
      headerRef.current.style.transform = 'translateY(-100px)';
      headerRef.current.style.opacity = '0';
      setTimeout(() => {
        headerRef.current.style.transition = 'all 1s ease-out';
        headerRef.current.style.transform = 'translateY(0)';
        headerRef.current.style.opacity = '1';
      }, 200);
    }

    // Card stagger animation
    cardRefs.current.forEach((card, index) => {
      if (card) {
        card.style.transform = 'translateY(50px) scale(0.9)';
        card.style.opacity = '0';
        setTimeout(() => {
          card.style.transition = 'all 0.8s ease-out';
          card.style.transform = 'translateY(0) scale(1)';
          card.style.opacity = '1';
        }, 400 + (index * 100));
      }
    });
  }, []);

  const addToRefs = (el) => {
    if (el && !cardRefs.current.includes(el)) {
      cardRefs.current.push(el);
    }
  };

  const startQuiz = () => {
    setShowQuizModal(true);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index].correct) {
        correct++;
      }
    });
    return Math.round((correct / quizQuestions.length) * 100);
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return { message: "Excellent! You're well-prepared to identify job scams.", color: "text-green-600", bgColor: "bg-green-50" };
    if (score >= 60) return { message: "Good job! Review the areas you missed to improve your safety.", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { message: "Consider reviewing our safety tips more carefully before job hunting.", color: "text-red-600", bgColor: "bg-red-50" };
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setShowResults(false);
  };

  const closeQuiz = () => {
    setShowQuizModal(false);
    resetQuiz();
  };

  const safetyTips = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Research Recruiters & Companies",
      description: "Always verify legitimacy before sharing personal information",
      details: [
        "Check company websites and social media presence",
        "Look up recruiter profiles on LinkedIn",
        "Read reviews on Glassdoor and similar platforms",
        "Verify company registration and business licenses"
      ],
      risk: "high"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Never Pay for Job Opportunities",
      description: "Legitimate employers never charge candidates for interviews or jobs",
      details: [
        "No fees for interviews, applications, or training",
        "Beware of 'training fees' or 'equipment costs'",
        "Report any company asking for upfront payments",
        "Real jobs pay you, not the other way around"
      ],
      risk: "critical"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Use Official Communication Channels",
      description: "Keep all job communications on verified, professional platforms",
      details: [
        "Use company email domains, not personal emails",
        "Communicate through established job platforms",
        "Avoid WhatsApp or Telegram for initial contact",
        "Document all communications for your records"
      ],
      risk: "medium"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Protect Your Personal Data",
      description: "Share sensitive information only when absolutely necessary",
      details: [
        "Never share ID numbers in initial applications",
        "Avoid giving bank details until after job confirmation",
        "Use secure file sharing for documents",
        "Be cautious with social security numbers"
      ],
      risk: "high"
    }
  ];

  const redFlags = [
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      title: "Too Good to Be True Offers",
      description: "Extremely high salaries for minimal work or qualifications"
    },
    {
      icon: <Phone className="w-6 h-6 text-red-500" />,
      title: "Pressure Tactics",
      description: "Urgent deadlines or pressure to make immediate decisions"
    },
    {
      icon: <Mail className="w-6 h-6 text-red-500" />,
      title: "Poor Communication",
      description: "Spelling errors, unprofessional emails, or vague job descriptions"
    },
    {
      icon: <Building2 className="w-6 h-6 text-red-500" />,
      title: "No Physical Address",
      description: "Companies with no verifiable physical location or contact info"
    }
  ];

  const bestPractices = [
    {
      icon: <UserCheck className="w-6 h-6 text-green-600" />,
      title: "Professional Profile",
      description: "Keep your profiles updated and professional across all platforms"
    },
    {
      icon: <FileText className="w-6 h-6 text-green-600" />,
      title: "Document Everything",
      description: "Save all communications, job postings, and interview details"
    },
    {
      icon: <Users className="w-6 h-6 text-green-600" />,
      title: "Network Safely",
      description: "Build genuine connections and ask trusted contacts for referrals"
    },
    {
      icon: <Globe className="w-6 h-6 text-green-600" />,
      title: "Online Presence",
      description: "Maintain a clean digital footprint and privacy settings"
    }
  ];

  const emergencyContacts = [
    {
      title: "Job Scam Reporting",
      contact: "tamanco@gmail.com",
      description: "Report fraudulent job postings and recruitment scams"
    },
    {
      title: "Consumer Protection",
      contact: "+234-802-3333-333",
      description: "Consumer complaint line"
    },
    {
      title: "Identity Theft Hotline",
      contact: "+234-802-4444-444",
      description: "Report identity theft and get recovery assistance"
    }
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'from-red-500 to-pink-600';
      case 'high': return 'from-orange-500 to-red-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      default: return 'from-green-500 to-emerald-600';
    }
  };

  const tabs = [
    { id: 'safety', label: 'Safety Tips', icon: <Shield className="w-5 h-5" /> },
    { id: 'redflags', label: 'Red Flags', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'practices', label: 'Best Practices', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'emergency', label: 'Emergency', icon: <Phone className="w-5 h-5" /> }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Enhanced Background Elements */}
      <div ref={circleContainer} className="fixed inset-0 -z-10 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`circle absolute rounded-full ${
              i % 5 === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
              i % 5 === 1 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
              i % 5 === 2 ? 'bg-gradient-to-br from-teal-400 to-green-500' :
              i % 5 === 3 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              'bg-gradient-to-br from-blue-400 to-green-500'
            }`}
            style={{
              width: `${Math.random() * 250 + 80}px`,
              height: `${Math.random() * 250 + 80}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {!showResults ? (
              <div className="p-8">
                {/* Quiz Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Safety Knowledge Quiz</h3>
                  </div>
                  <button 
                    onClick={closeQuiz}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Question {currentQuestion + 1} of {quizQuestions.length}</span>
                    <span className="text-sm text-gray-600">{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-6 leading-relaxed">
                    {quizQuestions[currentQuestion].question}
                  </h4>

                  <div className="space-y-3">
                    {quizQuestions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          userAnswers[currentQuestion] === index
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            userAnswers[currentQuestion] === index
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300'
                          }`}>
                            {userAnswers[currentQuestion] === index && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                    disabled={currentQuestion === 0}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      currentQuestion === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>

                  <button
                    onClick={nextQuestion}
                    disabled={userAnswers[currentQuestion] === undefined}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      userAnswers[currentQuestion] === undefined
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {currentQuestion === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </button>
                </div>
              </div>
            ) : (
              /* Results Screen */
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h3>
                  <p className="text-gray-600">Here's how you performed on the safety knowledge test</p>
                </div>

                {/* Score Display */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-8 text-center border border-green-200">
                  <div className="text-6xl font-bold text-green-600 mb-4">{calculateScore()}%</div>
                  <div className={`text-lg font-medium mb-4 ${getScoreMessage(calculateScore()).color}`}>
                    {getScoreMessage(calculateScore()).message}
                  </div>
                  <div className="text-gray-600">
                    You answered {userAnswers.filter((answer, index) => answer === quizQuestions[index].correct).length} out of {quizQuestions.length} questions correctly
                  </div>
                </div>

                {/* Answer Review */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-xl font-bold text-gray-800 mb-4">Review Your Answers</h4>
                  {quizQuestions.map((question, index) => {
                    const isCorrect = userAnswers[index] === question.correct;
                    return (
                      <div key={index} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start space-x-3 mb-3">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 mb-2">Question {index + 1}</p>
                            <p className="text-sm text-gray-600 mb-3">{question.question}</p>
                            {!isCorrect && (
                              <div className="space-y-2">
                                <p className="text-sm text-red-700">
                                  <strong>Your answer:</strong> {question.options[userAnswers[index]]}
                                </p>
                                <p className="text-sm text-green-700">
                                  <strong>Correct answer:</strong> {question.options[question.correct]}
                                </p>
                              </div>
                            )}
                            <p className="text-sm text-gray-600 mt-2 italic">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={resetQuiz}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors duration-200"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Retake Quiz</span>
                  </button>
                  <button
                    onClick={closeQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="relative z-10 p-4 sm:p-6">
        <button className="group inline-flex items-center space-x-3 text-green-600 hover:text-green-800 transition-all duration-300 bg-white/70 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl border border-green-200 hover:border-green-300">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-semibold">Back to Dashboard</span>
          <Sparkles size={16} className="text-green-400 group-hover:text-green-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* Header Section */}
        <div ref={headerRef} className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl mb-6">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold">Safety First</span>
            <Heart className="w-6 h-6 text-red-300" />
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
            Your Safety Matters
          </h1>
          
          <p className="text-md text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            Navigate your job search confidently with our comprehensive safety guide. 
            Protect yourself from scams and make informed decisions throughout your career journey.
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { label: 'Prevent Scams', icon: <Shield className="w-6 h-6" /> },
              { label: 'Ensure Safe Connections', icon: <Users className="w-6 h-6" /> },
              { label: 'Provide Support', icon: <Clock className="w-6 h-6" /> },
              { label: 'Increase Success', icon: <TrendingUp className="w-6 h-6" /> }
            ].map((stat, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
                <div className="text-green-600 mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-md font-bold text-gray-800 mb-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white/90 hover:text-green-600'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Safety Tips Tab */}
          {activeTab === 'safety' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Essential Safety Guidelines</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Follow these crucial safety measures to protect yourself during your job search process.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {safetyTips.map((tip, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200"
                  >
                    <div className="flex items-start space-x-4 mb-6">
                      <div className={`p-4 rounded-xl bg-gradient-to-r ${getRiskColor(tip.risk)} text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                        {tip.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{tip.title}</h3>
                        <p className="text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {tip.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                        tip.risk === 'critical' ? 'bg-red-100 text-red-700' :
                        tip.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                        tip.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          tip.risk === 'critical' ? 'bg-red-500' :
                          tip.risk === 'high' ? 'bg-orange-500' :
                          tip.risk === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className="capitalize">{tip.risk} Priority</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags Tab */}
          {activeTab === 'redflags' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Warning Signs to Watch For</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Learn to identify common red flags that indicate potential job scams or fraudulent employers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {redFlags.map((flag, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border-l-4 border-red-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      {flag.icon}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">{flag.title}</h3>
                        <p className="text-gray-600">{flag.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Warning Indicators */}
              <div className="bg-gradient-to-r from-gray-50 to-red-50 rounded-2xl p-8 border border-red-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Detailed Warning Indicators</h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-red-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Mail className="w-5 h-5 text-red-500" />
                      <h4 className="font-bold text-gray-800">Suspicious Communication Patterns</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Generic email addresses (Gmail, Yahoo instead of company domain)</li>
                      <li>• Poor grammar, spelling errors, or unprofessional language</li>
                      <li>• Requests to communicate via messaging apps immediately</li>
                      <li>• Vague job descriptions with unrealistic salary promises</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-red-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Camera className="w-5 h-5 text-red-500" />
                      <h4 className="font-bold text-gray-800">Interview & Process Red Flags</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• No proper interview process or immediate job offers</li>
                      <li>• Requests for personal documents before job confirmation</li>
                      <li>• Pressure to start immediately without proper onboarding</li>
                      <li>• Unwillingness to provide company details or references</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-red-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <DollarSign className="w-5 h-5 text-red-500" />
                      <h4 className="font-bold text-gray-800">Financial Warning Signs</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Requests for upfront payments for any reason</li>
                      <li>• Promises of guaranteed high income with minimal work</li>
                      <li>• Asking for bank account details too early in process</li>
                      <li>• Check cashing or money transfer requests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Best Practices Tab */}
          {activeTab === 'practices' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Smart Job Search Strategies</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Implement these proven practices to enhance your job search safety and success rate.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {bestPractices.map((practice, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      {practice.icon}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">{practice.title}</h3>
                        <p className="text-gray-600">{practice.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Items Checklist */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span>Your Safety Checklist</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    "Updated LinkedIn profile with professional photo",
                    "Researched company thoroughly before applying",
                    "Kept copies of all job communications",
                    "Verified recruiter's identity and credentials",
                    "Used official company email addresses only",
                    "Never shared sensitive personal information upfront",
                    "Documented interview details and promises made",
                    "Asked for written job offer with clear terms"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Emergency Resources & Support</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  If you encounter fraud or need immediate assistance, use these trusted resources and contacts.
                </p>
              </div>

              {/* Emergency Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-red-200"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{contact.title}</h3>
                    <div className="text-xl font-mono text-red-600 mb-3">{contact.contact}</div>
                    <p className="text-gray-600 text-sm">{contact.description}</p>
                  </div>
                ))}
              </div>

              {/* Action Steps for Emergencies */}
              <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-8 border border-red-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <span>If You Encounter a Scam</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Immediate Actions:</h4>
                    <ol className="space-y-3">
                      {[
                        "Stop all communication immediately",
                        "Document everything (emails, messages, calls)",
                        "Do NOT send money or personal documents",
                        "Report to local authorities if money was involved",
                        "Change passwords if accounts were compromised"
                      ].map((action, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Follow-up Steps:</h4>
                    <ol className="space-y-3">
                      {[
                        "File reports with appropriate agencies",
                        "Monitor your credit reports closely",
                        "Alert your bank and credit card companies",
                        "Share your experience to help others",
                        "Seek support if you feel overwhelmed"
                      ].map((action, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Phone className="w-8 h-8 mb-4" />
                    <h4 className="font-bold text-lg mb-2">Report Immediately</h4>
                    <p className="text-sm opacity-90">Contact authorities if money or identity theft is involved</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Shield className="w-8 h-8 mb-4" />
                    <h4 className="font-bold text-lg mb-2">Secure Accounts</h4>
                    <p className="text-sm opacity-90">Change passwords and enable two-factor authentication</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Users className="w-8 h-8 mb-4" />
                    <h4 className="font-bold text-lg mb-2">Seek Support</h4>
                    <p className="text-sm opacity-90">Reach out to friends, family, or professional counselors</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Help Assistant */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Safety Assistant</h3>
              <p className="text-white/90 max-w-2xl mx-auto">
                Get personalized safety recommendations based on your specific situation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "First Time Job Seeker",
                  description: "New to job hunting? Get essential safety basics",
                  icon: <Star className="w-6 h-6" />,
                  color: "from-blue-400 to-cyan-500"
                },
                {
                  title: "Remote Work Safety",
                  description: "Special considerations for remote opportunities",
                  icon: <Globe className="w-6 h-6" />,
                  color: "from-green-400 to-emerald-500"
                },
                {
                  title: "International Jobs",
                  description: "Cross-border employment safety guidelines",
                  icon: <ExternalLink className="w-6 h-6" />,
                  color: "from-yellow-400 to-orange-500"
                },
                {
                  title: "Freelance Security",
                  description: "Protect yourself as an independent contractor",
                  icon: <Users className="w-6 h-6" />,
                  color: "from-pink-400 to-rose-500"
                }
              ].map((item, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <h4 className="text-white font-bold mb-2">{item.title}</h4>
                    <p className="text-white/80 text-sm">{item.description}</p>
                    <div className="flex items-center text-white/60 text-sm mt-3 group-hover:text-white/80 transition-colors duration-300">
                      <span>Learn more</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Quiz Section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Test Your Safety Knowledge</h3>
              <p className="text-white/90 max-w-2xl mx-auto mb-8">
                Take our interactive quiz to see how well you can spot job scams and protect yourself
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-semibold">Quick Safety Check</span>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">5 minutes</span>
                  </div>
                </div>
                
                <p className="text-white/80 text-sm mb-6">
                  Answer 5 quick questions to get your personalized safety score and recommendations
                </p>
                
                <button 
                  onClick={startQuiz}
                  className="w-full bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg"
                >
                  Start Safety Quiz
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-4xl font-bold text-white mb-6">Your Safety Journey Starts Here</h3>
              <p className="text-md text-white/90 mb-8 leading-relaxed">
                Armed with knowledge and the right tools, you're ready to navigate your job search with confidence. 
                Remember: a safe job search is a successful job search.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button className="group bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2">
                  <span>Start Job Hunting Safely</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button className="group bg-green-700 text-white hover:bg-green-800 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Share Safety Tips</span>
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-white/70">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Trusted by 50k+ job seekers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Industry safety certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Community verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSafetyTips;