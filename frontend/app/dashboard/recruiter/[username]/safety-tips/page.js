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
  Trophy,
  Search,
  Database,
  Zap,
  Target,
  BookOpen,
  Settings
} from 'lucide-react';

const RecruiterSafetyTips = () => {
  const [activeTab, setActiveTab] = useState('verification');
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
      question: "A candidate applies with impressive credentials but refuses video interviews, only accepting phone calls. What's your best approach?",
      options: [
        "Accept their preference and proceed with phone interviews",
        "Insist on video verification before moving forward",
        "Skip the interview and make an offer based on resume",
        "Ask for additional documentation to verify identity"
      ],
      correct: 1,
      explanation: "Video verification is crucial for identity confirmation. Legitimate candidates understand this security measure."
    },
    {
      question: "When should you request sensitive documents like passports or bank details from candidates?",
      options: [
        "During the initial application screening",
        "After the first interview to verify eligibility",
        "Only after a formal job offer is accepted",
        "Never - HR should handle all sensitive documents"
      ],
      correct: 2,
      explanation: "Sensitive documents should only be requested after a formal job offer is made and accepted, using secure channels."
    },
    {
      question: "A candidate's references all use similar email patterns and respond unusually quickly with identical praise. What should you do?",
      options: [
        "Accept the references as they're positive",
        "Call the reference numbers to verify authenticity",
        "Ask the candidate for additional references",
        "Research the companies and verify reference legitimacy"
      ],
      correct: 3,
      explanation: "Suspicious reference patterns require thorough verification including company research and direct contact verification."
    },
    {
      question: "Which communication channel is MOST secure for discussing sensitive hiring information?",
      options: [
        "WhatsApp or Telegram messaging",
        "Personal Gmail accounts",
        "Company email with encryption",
        "LinkedIn direct messages"
      ],
      correct: 2,
      explanation: "Company email systems with proper encryption provide the highest security for sensitive hiring communications."
    },
    {
      question: "A candidate asks for the job offer to be sent to a different name/person 'for family reasons'. How should you respond?",
      options: [
        "Accommodate the request to be helpful",
        "Refuse and only deal with the original applicant",
        "Ask for legal documentation explaining the arrangement",
        "Send the offer but flag it as suspicious"
      ],
      correct: 1,
      explanation: "Job offers should only go to the verified applicant. This could indicate identity fraud or other deceptive practices."
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
    if (score >= 80) return { message: "Excellent! You're implementing strong recruiting security practices.", color: "text-green-600", bgColor: "bg-green-50" };
    if (score >= 60) return { message: "Good foundation! Review the missed areas to strengthen your approach.", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    return { message: "Consider additional training on secure recruiting practices.", color: "text-red-600", bgColor: "bg-red-50" };
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

  const verificationTips = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Comprehensive Background Verification",
      description: "Implement multi-layered verification processes for all candidates",
      details: [
        "Cross-reference academic credentials with institutions",
        "Verify employment history through direct company contact",
        "Use professional background check services",
        "Confirm professional licenses and certifications"
      ],
      risk: "critical"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Identity Authentication Protocols",
      description: "Establish robust identity verification before sensitive discussions",
      details: [
        "Require video interviews for identity confirmation",
        "Use government ID verification for final candidates",
        "Implement biometric checks for high-security roles",
        "Verify social media profiles for consistency"
      ],
      risk: "high"
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Reference Verification Standards",
      description: "Thoroughly validate all provided references and contacts",
      details: [
        "Call references directly using publicly available numbers",
        "Verify reference companies exist and are legitimate",
        "Ask specific questions about candidate performance",
        "Be suspicious of overly similar reference responses"
      ],
      risk: "high"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Document Security Protocols",
      description: "Handle sensitive candidate documents with maximum security",
      details: [
        "Use encrypted file sharing systems only",
        "Limit document access to authorized personnel",
        "Implement secure document storage solutions",
        "Establish clear data retention policies"
      ],
      risk: "critical"
    }
  ];

  const communicationTips = [
    {
      icon: <MessageSquare className="w-6 h-6 text-green-600" />,
      title: "Official Communication Channels",
      description: "Use only verified, secure platforms for all hiring communications"
    },
    {
      icon: <Lock className="w-6 h-6 text-green-600" />,
      title: "End-to-End Encryption",
      description: "Ensure all sensitive discussions are properly encrypted and protected"
    },
    {
      icon: <Mail className="w-6 h-6 text-green-600" />,
      title: "Company Email Systems",
      description: "Keep all official correspondence within company-managed email systems"
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Data Privacy Compliance",
      description: "Follow GDPR, CCPA and other data protection regulations strictly"
    }
  ];

  const redFlags = [
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      title: "Inconsistent Information",
      description: "Details that don't match across resume, interview, and references"
    },
    {
      icon: <Camera className="w-6 h-6 text-red-500" />,
      title: "Avoidance of Video Calls",
      description: "Reluctance to participate in video interviews or identity verification"
    },
    {
      icon: <Building2 className="w-6 h-6 text-red-500" />,
      title: "Unverifiable Employment",
      description: "Previous employers that can't be contacted or don't exist"
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Suspicious References",
      description: "References with matching patterns, quick responses, or generic praise"
    }
  ];

  const emergencyContacts = [
    {
      title: "Recruitment Fraud Hotline",
      contact: "1-888-RECRUIT-FRAUD",
      description: "Report fraudulent candidates and suspicious recruitment activity"
    },
    {
      title: "Identity Theft Prevention",
      contact: "identity@recruiting-security.org",
      description: "Get help with identity verification and fraud prevention"
    },
    {
      title: "HR Security Consultancy",
      contact: "1-800-HR-SECURE",
      description: "Professional guidance on secure recruiting practices"
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
    { id: 'verification', label: 'Verification', icon: <Search className="w-5 h-5" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'redflags', label: 'Red Flags', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'emergency', label: 'Support', icon: <Phone className="w-5 h-5" /> }
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
              'bg-gradient-to-br from-cyan-400 to-green-500'
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
                    <h3 className="text-2xl font-bold text-gray-800">Recruiter Security Quiz</h3>
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
                  <p className="text-gray-600">Here's how you performed on the recruiter security test</p>
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
            <span className="text-xl font-bold">Secure Recruiting</span>
            <Target className="w-6 h-6 text-green-300" />
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
            Recruiter Safety Hub
          </h1>
          
          <p className="text-md text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
            Protect your organization and candidates with comprehensive security practices. 
            Build trust through verified, secure recruitment processes.
          </p>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { label: 'Fraud Prevention', icon: <Shield className="w-6 h-6" /> },
              { label: 'Identity Verification', icon: <UserCheck className="w-6 h-6" /> },
              { label: 'Secure Communications', icon: <Lock className="w-6 h-6" /> },
              { label: 'Trusted Hiring', icon: <Award className="w-6 h-6" /> }
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
          {/* Verification Tab */}
          {activeTab === 'verification' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Candidate Verification Protocols</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Implement comprehensive verification processes to ensure candidate authenticity and protect your organization.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {verificationTips.map((tip, index) => (
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

          {/* Communication Tab */}
          {activeTab === 'communication' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Secure Communication Practices</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Establish secure communication channels and protocols to protect sensitive hiring information.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {communicationTips.map((tip, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      {tip.icon}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">{tip.title}</h3>
                        <p className="text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Communication Security Guidelines */}
              <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Communication Security Guidelines</h3>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-green-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Mail className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-gray-800">Email Security Standards</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Use company email domains exclusively for official communications</li>
                      <li>• Implement email encryption for sensitive candidate information</li>
                      <li>• Avoid sharing confidential details in email subject lines</li>
                      <li>• Set up secure email filters to prevent phishing attempts</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-green-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Camera className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-gray-800">Video Call Security</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Use professional video conferencing platforms with encryption</li>
                      <li>• Enable waiting rooms and authentication for all interviews</li>
                      <li>• Record interviews only with explicit candidate consent</li>
                      <li>• Verify candidate identity before discussing sensitive topics</li>
                    </ul>
                  </div>

                  <div className="bg-white rounded-xl border border-green-200 p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Database className="w-5 h-5 text-green-500" />
                      <h4 className="font-bold text-gray-800">Data Handling Protocols</h4>
                    </div>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Store candidate data in encrypted, access-controlled systems</li>
                      <li>• Implement role-based access to sensitive information</li>
                      <li>• Regular data audits and access reviews</li>
                      <li>• Secure disposal of candidate information when no longer needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Red Flags Tab */}
          {activeTab === 'redflags' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Candidate Red Flags to Watch</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Learn to identify warning signs that may indicate fraudulent candidates or security risks.
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

              {/* Advanced Warning System */}
              <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 rounded-2xl p-8 border border-red-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <span>Advanced Fraud Detection</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Document Verification Red Flags:</h4>
                    <ol className="space-y-3">
                      {[
                        "Low-quality or pixelated document images",
                        "Documents with inconsistent fonts or formatting",
                        "Missing security features (watermarks, stamps)",
                        "Information that doesn't match across documents",
                        "Reluctance to provide original documents for verification"
                      ].map((flag, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{flag}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Behavioral Warning Signs:</h4>
                    <ol className="space-y-3">
                      {[
                        "Pressure for quick hiring decisions",
                        "Requests to bypass standard verification processes",
                        "Inconsistent stories during multiple interviews",
                        "Unusual payment or salary arrangement requests",
                        "Reluctance to meet in person or via video"
                      ].map((sign, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700">{sign}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Action Protocol */}
                <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-red-500" />
                    <span>When Red Flags Are Detected</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <h5 className="font-bold mb-1">PAUSE</h5>
                      <p className="text-sm">Stop the process immediately</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <h5 className="font-bold mb-1">DOCUMENT</h5>
                      <p className="text-sm">Record all suspicious activity</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-xl">
                      <Phone className="w-8 h-8 mx-auto mb-2" />
                      <h5 className="font-bold mb-1">ESCALATE</h5>
                      <p className="text-sm">Report to security team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === 'emergency' && (
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Security Support & Resources</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Access professional support and resources to enhance your recruitment security practices.
                </p>
              </div>

              {/* Support Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    ref={addToRefs}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-green-200"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{contact.title}</h3>
                    <div className="text-xl font-mono text-green-600 mb-3">{contact.contact}</div>
                    <p className="text-gray-600 text-sm">{contact.description}</p>
                  </div>
                ))}
              </div>

              {/* Training Resources */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
                  <BookOpen className="w-6 h-6 text-green-500" />
                  <span>Professional Development Resources</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Security Certification Program",
                      description: "Comprehensive training on secure recruiting practices",
                      type: "Online Course",
                      duration: "8 hours",
                      icon: <Award className="w-6 h-6 text-green-600" />
                    },
                    {
                      title: "Fraud Detection Workshop",
                      description: "Interactive sessions on identifying recruitment fraud",
                      type: "Live Training",
                      duration: "4 hours",
                      icon: <Users className="w-6 h-6 text-green-600" />
                    },
                    {
                      title: "Legal Compliance Guide",
                      description: "Stay updated on recruitment security regulations",
                      type: "Reference Guide",
                      duration: "Self-paced",
                      icon: <FileText className="w-6 h-6 text-green-600" />
                    }
                  ].map((resource, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                          {resource.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{resource.title}</h4>
                          <p className="text-sm text-gray-500">{resource.type}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{resource.duration}</span>
                        <button className="text-green-600 hover:text-green-800 font-medium text-sm">
                          Learn More →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Checklist */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span>Security Implementation Checklist</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    "Implemented multi-factor authentication for all recruiting systems",
                    "Established secure document sharing protocols",
                    "Created standardized identity verification procedures",
                    "Set up encrypted communication channels",
                    "Developed fraud detection training for recruiting team",
                    "Established incident response procedures",
                    "Regular security audits of recruiting processes",
                    "Created candidate data retention and disposal policies"
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
        </div>

        {/* Interactive Quiz Section */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-pink-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Test Your Security Knowledge</h3>
              <p className="text-white/90 max-w-2xl mx-auto mb-8">
                Evaluate your understanding of secure recruiting practices with our comprehensive assessment
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-semibold">Recruiter Security Assessment</span>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">5 minutes</span>
                  </div>
                </div>
                
                <p className="text-white/80 text-sm mb-6">
                  Test your knowledge on candidate verification, secure communications, and fraud detection
                </p>
                
                <button 
                  onClick={startQuiz}
                  className="w-full bg-white text-teal-600 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg"
                >
                  Start Security Assessment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tools & Technology Section */}
        <div className="mt-12 bg-gradient-to-r from-cyan-600 via-green-600 to-emerald-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Security Tools & Technologies</h3>
              <p className="text-white/90 max-w-2xl mx-auto">
                Leverage cutting-edge tools to enhance your recruitment security infrastructure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "AI Fraud Detection",
                  description: "Machine learning algorithms to identify suspicious patterns",
                  icon: <Zap className="w-6 h-6" />,
                  color: "from-yellow-400 to-orange-500"
                },
                {
                  title: "Blockchain Verification",
                  description: "Immutable credential verification system",
                  icon: <Lock className="w-6 h-6" />,
                  color: "from-green-400 to-emerald-500"
                },
                {
                  title: "Biometric Authentication",
                  description: "Advanced identity verification through biometrics",
                  icon: <Eye className="w-6 h-6" />,
                  color: "from-teal-400 to-pink-500"
                },
                {
                  title: "Secure Communication Hub",
                  description: "End-to-end encrypted messaging platform",
                  icon: <MessageSquare className="w-6 h-6" />,
                  color: "from-green-400 to-cyan-500"
                },
                {
                  title: "Real-time Background Checks",
                  description: "Instant verification of candidate credentials",
                  icon: <Search className="w-6 h-6" />,
                  color: "from-red-400 to-pink-500"
                },
                {
                  title: "Compliance Dashboard",
                  description: "Monitor and maintain regulatory compliance",
                  icon: <Database className="w-6 h-6" />,
                  color: "from-emerald-400 to-teal-500"
                }
              ].map((tool, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {tool.icon}
                    </div>
                    <h4 className="text-white font-bold mb-2">{tool.title}</h4>
                    <p className="text-white/80 text-sm">{tool.description}</p>
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

        {/* Final CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-4xl font-bold text-white mb-6">Secure Your Recruitment Process Today</h3>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Build trust, prevent fraud, and protect your organization with comprehensive security practices. 
                Your commitment to security creates a safer hiring environment for everyone.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button className="group bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2">
                  <span>Implement Security Measures</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <button className="group bg-green-700 text-white hover:bg-green-800 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Get Security Consultation</span>
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-white/70">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Trusted by 10k+ recruiters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Industry security leader</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Enterprise-grade security</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterSafetyTips;